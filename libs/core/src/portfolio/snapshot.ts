import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

import { v, PipeError, type PipeOutput } from 'valleyed'

import { assetPipe, assetSchema } from '../domain/asset'
import { auditStampPipe, canonicalBase64Pipe, idPipe, protectedStringPipe } from '../domain/commons'
import { memoryPipe, memorySchema } from '../domain/memory'
import { memoryRevisionPipe, memoryRevisionSchema } from '../domain/memory-revision'
import { projectPipe, projectSchema } from '../domain/project'
import { secretPipe, secretSchema } from '../domain/secret'
import { inputIssues, type Result, type SharedOperationError } from '../errors'
import type { Owner } from '../runtime/owner'
import { transaction } from '../runtime/transaction'
import { stored } from '../storage/read'
import { withExplicitId } from '../storage/schema'

const CONTEXT = Buffer.from('gorchestra:portfolio-snapshot:v1', 'utf8')
const passphrasePipe = protectedStringPipe.pipe(v.min(12))
const inputPipe = v.object({ passphrase: passphrasePipe })
const importInputPipe = v.object({ snapshot: protectedStringPipe, passphrase: passphrasePipe })
const envelopePipe = v.fromJson(
	v.object({
		version: v.eq(1),
		salt: canonicalBase64Pipe(16),
		nonce: canonicalBase64Pipe(12),
		ciphertext: canonicalBase64Pipe(),
		tag: canonicalBase64Pipe(16),
	}),
)
const plainSecretPipe = v.object({
	id: idPipe,
	title: secretSchema.fields.title.pipe,
	value: protectedStringPipe,
	created: auditStampPipe,
	valueUpdated: auditStampPipe,
})
const payloadPipe = v.fromJson(
	v.object({
		version: v.eq(1),
		migrationId: idPipe,
		projects: v.array(projectPipe),
		assets: v.array(assetPipe),
		secrets: v.array(plainSecretPipe),
		memories: v.array(memoryPipe),
		memoryRevisions: v.array(memoryRevisionPipe),
	}),
)

export type SnapshotError = SharedOperationError | { type: 'snapshot-invalid' } | { type: 'snapshot-incompatible' }

function key(passphrase: string, salt: Buffer) {
	return scryptSync(Buffer.from(passphrase, 'utf16le'), salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 << 20 })
}

async function invoke<T>(owner: Owner, work: () => Promise<Result<T, SnapshotError>>) {
	const release = owner.admit()
	if (!release) return { ok: false, error: { type: 'storage-operation-failed' } } as const
	try {
		return await owner.access('exclusive', async () => {
			const ready = await owner.validateReady()
			if (!ready.ok) return ready
			try {
				await owner.ensureSecretProtection()
			} catch {
				return { ok: false, error: { type: 'storage-operation-failed' } } as const
			}
			return transaction(owner, work)
		})
	} finally {
		release()
	}
}

export async function exportSnapshot(owner: Owner, input: unknown): Promise<Result<string, SnapshotError>> {
	let parsed: PipeOutput<typeof inputPipe> | PipeError
	try {
		parsed = v.compile(inputPipe)(input)
	} catch {
		return { ok: false, error: { type: 'invalid-input', issues: [{ message: 'Invalid input.' }] } }
	}
	if (parsed instanceof PipeError) return { ok: false, error: { type: 'invalid-input', issues: inputIssues(parsed) } }
	return invoke(owner, async () => {
		try {
			const ready = await owner.validateReady()
			if (!ready.ok) return ready
			const migrationId = owner.catalog.at(-1)?.id
			if (!migrationId) return { ok: false, error: { type: 'internal-error' } }
			const projects = await owner.repo.on(projectSchema).all().find()
			const assets = await owner.repo.on(assetSchema).all().find()
			const storedSecrets = await owner.repo.on(secretSchema).all().find()
			const memories = await owner.repo.on(memorySchema).all().find()
			const memoryRevisions = await owner.repo.on(memoryRevisionSchema).all().find()
			if (
				projects.some((row) => !stored(projectPipe, row).ok) ||
				assets.some((row) => !stored(assetPipe, row).ok) ||
				storedSecrets.some((row) => !stored(secretPipe, row).ok) ||
				memories.some((row) => !stored(memoryPipe, row).ok) ||
				memoryRevisions.some((row) => !stored(memoryRevisionPipe, row).ok)
			)
				return { ok: false, error: { type: 'invalid-storage-output' } }
			const secrets = storedSecrets.map((secret) => ({
				id: secret.id,
				title: secret.title,
				value: owner.secrets.decode(secret.id, secret.value),
				created: secret.created,
				valueUpdated: secret.valueUpdated,
			}))
			if (storedSecrets.some(({ value }) => !owner.secrets.matches(value)))
				return { ok: false, error: { type: 'invalid-storage-output' } }
			const plaintext = Buffer.from(
				JSON.stringify({ version: 1, migrationId, projects, assets, secrets, memories, memoryRevisions }),
				'utf8',
			)
			const salt = randomBytes(16)
			const nonce = randomBytes(12)
			const cipher = createCipheriv('aes-256-gcm', key(parsed.passphrase, salt), nonce)
			cipher.setAAD(CONTEXT)
			const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
			return {
				ok: true,
				value: JSON.stringify({
					version: 1,
					salt: salt.toString('base64'),
					nonce: nonce.toString('base64'),
					ciphertext: ciphertext.toString('base64'),
					tag: cipher.getAuthTag().toString('base64'),
				}),
			}
		} catch {
			return { ok: false, error: { type: 'internal-error' } }
		}
	})
}

export async function importSnapshot(owner: Owner, input: unknown): Promise<Result<void, SnapshotError>> {
	let parsedInput: PipeOutput<typeof importInputPipe> | PipeError
	try {
		parsedInput = v.compile(importInputPipe)(input)
	} catch {
		return { ok: false, error: { type: 'invalid-input', issues: [{ message: 'Invalid input.' }] } }
	}
	if (parsedInput instanceof PipeError)
		return { ok: false, error: { type: 'invalid-input', issues: inputIssues(parsedInput) } }
	let payload: PipeOutput<typeof payloadPipe>
	try {
		const parsedEnvelope = v.validate(envelopePipe, parsedInput.snapshot)
		if (!parsedEnvelope.valid) return { ok: false, error: { type: 'snapshot-invalid' } }
		const envelope = parsedEnvelope.value
		const decipher = createDecipheriv(
			'aes-256-gcm',
			key(parsedInput.passphrase, Buffer.from(envelope.salt, 'base64')),
			Buffer.from(envelope.nonce, 'base64'),
		)
		decipher.setAAD(CONTEXT)
		decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
		const decoded = Buffer.concat([
			decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
			decipher.final(),
		]).toString('utf8')
		const parsedPayload = v.validate(payloadPipe, decoded)
		if (!parsedPayload.valid) return { ok: false, error: { type: 'snapshot-invalid' } }
		payload = parsedPayload.value
	} catch {
		return { ok: false, error: { type: 'snapshot-invalid' } }
	}
	return invoke(owner, async () => {
		const ready = await owner.validateReady()
		if (!ready.ok) return ready
		if (payload.migrationId !== owner.catalog.at(-1)?.id)
			return { ok: false, error: { type: 'snapshot-incompatible' } }
		const importedAt = new Date().toISOString()
		const stamp = (value: PipeOutput<typeof auditStampPipe>) => ({
			src: 'imported' as const,
			at: value.at,
			iat: importedAt,
		})
		try {
			await owner.repo.on(memoryRevisionSchema).all().delete()
			await owner.repo.on(memorySchema).all().delete()
			await owner.repo.on(assetSchema).all().delete()
			await owner.repo.on(secretSchema).all().delete()
			await owner.repo.on(projectSchema).all().delete()
			const projects = payload.projects.map((record) => ({ ...record, created: stamp(record.created) }))
			const assets = payload.assets.map((record) => ({ ...record, created: stamp(record.created) }))
			const secrets = payload.secrets.map((record) => ({
				...record,
				value: owner.secrets.encode(record.id, record.value),
				created: stamp(record.created),
				valueUpdated: stamp(record.valueUpdated),
			}))
			const memories = payload.memories.map((record) => ({ ...record, created: stamp(record.created) }))
			const revisions = payload.memoryRevisions.map((record) => ({ ...record, created: stamp(record.created) }))
			for (const row of projects)
				await withExplicitId(row.id, () => owner.repo.on(projectSchema).one().create(row))
			for (const row of secrets) await withExplicitId(row.id, () => owner.repo.on(secretSchema).one().create(row))
			for (const row of assets) await withExplicitId(row.id, () => owner.repo.on(assetSchema).one().create(row))
			for (const row of memories)
				await withExplicitId(row.id, () => owner.repo.on(memorySchema).one().create(row))
			for (const row of revisions)
				await withExplicitId(row.id, () => owner.repo.on(memoryRevisionSchema).one().create(row))
			return { ok: true, value: undefined }
		} catch {
			return { ok: false, error: { type: 'internal-error' } }
		}
	})
}
