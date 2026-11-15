import { randomBytes } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { PortfolioClient } from '../../index'
import { createProtection, createSecretHelpers } from '../../runtime/secrets'
import { createTestDependencies, requireSuccess, withReadyPortfolio } from '../../testing/fixtures'

const key = (byte: number) => Buffer.alloc(32, byte).toString('base64')
const protectionId = '01k00000000000000000000000'

async function setup(encryptionKey: string | null) {
	const dependencies = {
		...createTestDependencies(),
		secrets: { encryptionKey: null as string | null },
	}
	dependencies.secrets.encryptionKey = encryptionKey
	const opened = requireSuccess(await PortfolioClient.new(dependencies))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const client = requireSuccess(await opened.setup())
	return { dependencies, opened, client }
}

describe('Core-owned Secret protection', () => {
	it.each([null, key(1)])('establishes one protection and reopens an empty Portfolio (%s)', async (encryptionKey) => {
		const { dependencies, opened, client } = await setup(encryptionKey)
		const protection = dependencies.storage.adapter.stores.get('secret_protection')
		expect(protection?.size).toBe(1)
		expect(protection?.get(protectionId)).toMatchObject({
			id: protectionId,
			spec: { mode: encryptionKey === null ? 'plaintext' : 'encrypted' },
		})
		expect(await client.shutdown()).toEqual({ ok: true, value: undefined })
		const reopened = await PortfolioClient.new(dependencies)
		expect(reopened).toMatchObject({ ok: true, value: { state: 'ready' } })
		if (reopened.ok) await reopened.value.shutdown()
		await opened.shutdown()
	})

	it.each(['create-failure', 'malformed-create', 'read-failure', 'duplicate-read', 'commit-failure'] as const)(
		'rolls back setup and retains no Secret helper after %s',
		async (fault) => {
			const dependencies = createTestDependencies()
			const adapter = dependencies.storage.adapter
			const createMany = adapter.createMany.bind(adapter)
			const findMany = adapter.findMany.bind(adapter)
			const session = adapter.session.bind(adapter)
			const opened = requireSuccess(await PortfolioClient.new(dependencies))
			if (opened.state !== 'uninitialized') throw new Error('Expected setup')
			try {
				if (fault === 'create-failure') {
					adapter.createMany = async (...args) => {
						const rows = await createMany(...args)
						if (args[0].name === 'secret_protection') throw new Error('synthetic setup create failure')
						return rows
					}
				} else if (fault === 'malformed-create') {
					adapter.createMany = async (...args) => {
						const rows = await createMany(...args)
						return args[0].name === 'secret_protection' ? rows.map((row) => ({ ...row, spec: null })) : rows
					}
				} else if (fault === 'read-failure') {
					adapter.findMany = (...args) => {
						if (args[0].name === 'secret_protection') throw new Error('synthetic setup read failure')
						return findMany(...args)
					}
				} else if (fault === 'duplicate-read') {
					adapter.findMany = async (...args) => {
						const rows = await findMany(...args)
						return args[0].name === 'secret_protection' && rows[0]
							? [...rows, structuredClone(rows[0])]
							: rows
					}
				} else {
					adapter.session = (work) =>
						session(async () => {
							await work()
							throw new Error('synthetic setup commit failure')
						})
				}
				expect(await opened.setup()).toMatchObject({ ok: false })
			} finally {
				adapter.createMany = createMany
				adapter.findMany = findMany
				adapter.session = session
			}
			expect(await adapter.introspect()).toEqual([])
			expect(await opened.setup()).toMatchObject({ ok: true, value: { state: 'ready' } })
			await opened.shutdown()
		},
	)

	it.each(['', 'AA==', Buffer.alloc(31).toString('base64'), `${key(2)}\n`, key(2).replace(/=$/, '')])(
		'rejects an invalid encryption key before startup: %s',
		async (encryptionKey) => {
			const dependencies = {
				...createTestDependencies(),
				secrets: { encryptionKey: null as string | null },
			}
			dependencies.secrets.encryptionKey = encryptionKey
			expect(await PortfolioClient.new(dependencies)).toMatchObject({ ok: false })
			expect(await dependencies.storage.adapter.introspect()).toEqual([])
		},
	)

	it.each([null, key(3)])('rejects wrong or mismatched opening configuration (%s)', async (configured) => {
		const original = configured === null ? key(4) : null
		const { dependencies, client } = await setup(original)
		await client.shutdown()
		dependencies.secrets.encryptionKey = configured
		expect(await PortfolioClient.new(dependencies)).toEqual({ ok: false, error: { type: 'internal-error' } })
	})

	it.each(['missing', 'corrupt', 'mode'] as const)('rejects %s protection without mutation', async (fault) => {
		const { dependencies, client } = await setup(key(5))
		await client.shutdown()
		const store = dependencies.storage.adapter.stores.get('secret_protection')!
		if (fault === 'missing') store.delete(protectionId)
		else if (fault === 'corrupt') store.set(protectionId, { id: protectionId, spec: { mode: 'encrypted' } })
		else store.set(protectionId, { id: protectionId, spec: { mode: 'plaintext' } })
		const before = structuredClone(Array.from(store.entries()))
		expect(await PortfolioClient.new(dependencies)).toMatchObject({ ok: false })
		expect(Array.from(store.entries())).toEqual(before)
	})

	it.each(['missing', 'corrupt', 'mode'] as const)(
		'revalidates %s protection under the operation lock before an ordinary write',
		async (fault) => {
			const { dependencies, client } = await setup(key(5))
			const portfolio = requireSuccess(client.as({ by: 'test' }))
			const adapter = dependencies.storage.adapter
			const protection = adapter.stores.get('secret_protection')!
			if (fault === 'missing') protection.delete(protectionId)
			else if (fault === 'corrupt')
				protection.set(protectionId, { id: protectionId, spec: { mode: 'encrypted' } })
			else protection.set(protectionId, { id: protectionId, spec: { mode: 'plaintext' } })
			const protectionBefore = structuredClone(Array.from(protection.entries()))
			const lock = adapter.lock.bind(adapter)
			const findMany = adapter.findMany.bind(adapter)
			let shared = false
			let protectionReadsUnderLock = 0
			adapter.lock = (config, mode, work) =>
				lock(config, mode, async () => {
					if (mode === 'shared') shared = true
					try {
						return await work()
					} finally {
						shared = false
					}
				})
			adapter.findMany = (...args) => {
				if (args[0].name === 'secret_protection') {
					expect(shared).toBe(true)
					protectionReadsUnderLock++
				}
				return findMany(...args)
			}
			try {
				expect(
					await portfolio.projects.create({ title: 'Must not persist', spec: { type: 'source-control' } }),
				).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
				expect(protectionReadsUnderLock).toBe(1)
				expect(adapter.stores.has('projects')).toBe(false)
				expect(Array.from(protection.entries())).toEqual(protectionBefore)
			} finally {
				adapter.lock = lock
				adapter.findMany = findMany
				await client.shutdown()
			}
		},
	)

	it('stores authenticated encrypted round trips with fresh nonces and metadata redaction', async () => {
		const encryptionKey = key(6)
		const { dependencies, client } = await setup(encryptionKey)
		const portfolio = requireSuccess(client.as({ by: 'test' }))
		const created = requireSuccess(await portfolio.secrets.create({ title: ' Access ', value: ' exact value\n' }))
		expect(Object.keys(created).sort()).toEqual(['created', 'id', 'title', 'valueUpdated'])
		const row = dependencies.storage.adapter.stores.get('secrets')!.get(created.id)
		if (!row || typeof row.value !== 'object' || row.value === null) throw new Error('Expected encrypted row')
		const value = row.value as Record<string, string>
		expect(value).toMatchObject({ mode: 'encrypted' })
		expect(value).not.toHaveProperty('plaintext')
		expect(Buffer.from(value.tag!, 'base64')).toHaveLength(16)
		const firstNonce = value.nonce
		const replaced = requireSuccess(
			await portfolio.secrets.updateValue({ secretId: created.id, value: ' exact value\n' }),
		)
		expect(replaced.id).toBe(created.id)
		const replacement = dependencies.storage.adapter.stores.get('secrets')!.get(created.id)
		expect((replacement?.value as Record<string, string>).nonce).not.toBe(firstNonce)
		expect(requireSuccess(await portfolio.secrets.find({ secretId: created.id }))).toEqual(replaced)
		expect(requireSuccess(await portfolio.secrets.list())).toEqual([replaced])
		await client.shutdown()
	})

	it('authenticates the unique stable protection row while holding shared storage access', async () => {
		const { dependencies, client } = await setup(null)
		await client.shutdown()
		const adapter = dependencies.storage.adapter
		const lock = adapter.lock.bind(adapter)
		const findMany = adapter.findMany.bind(adapter)
		let shared = false
		adapter.lock = async (config, mode, work) =>
			lock(config, mode, async () => {
				if (mode === 'shared') shared = true
				try {
					return await work()
				} finally {
					shared = false
				}
			})
		adapter.findMany = (...args) => {
			if (args[0].name === 'secret_protection') expect(shared).toBe(true)
			return findMany(...args)
		}
		try {
			const reopened = requireSuccess(await PortfolioClient.new(dependencies))
			await reopened.shutdown()
			const store = adapter.stores.get('secret_protection')!
			store.set('01k00000000000000000000001', {
				id: '01k00000000000000000000001',
				spec: { mode: 'plaintext' },
			})
			expect(await PortfolioClient.new(dependencies)).toEqual({
				ok: false,
				error: { type: 'internal-error' },
			})
		} finally {
			adapter.lock = lock
			adapter.findMany = findMany
		}
	})

	it.each([
		['nonce', Buffer.alloc(11).toString('base64')],
		['tag', Buffer.alloc(15).toString('base64')],
		['ciphertext', 'not-base64'],
		['ciphertext', 'AA'],
	] as const)('rejects malformed encrypted %s during metadata reads', async (field, malformed) => {
		const { dependencies, client } = await setup(key(9))
		const portfolio = requireSuccess(client.as({ by: 'test' }))
		const created = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'value' }))
		const store = dependencies.storage.adapter.stores.get('secrets')!
		const row = structuredClone(store.get(created.id))
		if (!row || typeof row.value !== 'object' || row.value === null) throw new Error('Expected encrypted row')
		;(row.value as Record<string, string>)[field] = malformed
		store.set(created.id, row)
		expect(await portfolio.secrets.find({ secretId: created.id })).toEqual({
			ok: false,
			error: { type: 'invalid-storage-output' },
		})
		await client.shutdown()
	})

	it('rejects stored Secret modes that disagree with established protection on every selected read', async () => {
		const { dependencies, client } = await setup(null)
		const portfolio = requireSuccess(client.as({ by: 'test' }))
		const project = requireSuccess(
			await portfolio.projects.create({ title: 'Project', spec: { type: 'source-control' } }),
		)
		const created = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'value' }))
		const store = dependencies.storage.adapter.stores.get('secrets')!
		const original = structuredClone(store.get(created.id))
		if (!original) throw new Error('Expected Secret row')
		const mismatched = {
			...original,
			value: {
				mode: 'encrypted',
				nonce: Buffer.alloc(12).toString('base64'),
				ciphertext: Buffer.from('value').toString('base64'),
				tag: Buffer.alloc(16).toString('base64'),
			},
		}
		const failure = { ok: false, error: { type: 'invalid-storage-output' } }
		for (const call of [
			() => portfolio.secrets.find({ secretId: created.id }),
			() => portfolio.secrets.list(),
			() => portfolio.secrets.updateValue({ secretId: created.id, value: 'replacement' }),
			() => portfolio.secrets.usages({ secretId: created.id }),
			() =>
				portfolio.projects.assets.create({
					projectId: project.id,
					spec: {
						type: 'repository',
						source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: created.id },
					},
				}),
		]) {
			store.set(created.id, structuredClone(mismatched))
			expect(await call()).toEqual(failure)
		}
		expect(store.get(created.id)).toEqual(mismatched)
		await client.shutdown()
	})

	it.each(['ciphertext', 'tag', 'nonce', 'secret-id'] as const)(
		'returns metadata without decrypting encrypted value bytes or rebinding their identity: %s',
		async (fault) => {
			const { dependencies, client } = await setup(key(7))
			const portfolio = requireSuccess(client.as({ by: 'test' }))
			const created = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'value' }))
			const store = dependencies.storage.adapter.stores.get('secrets')!
			const row = structuredClone(store.get(created.id))
			if (!row || typeof row.value !== 'object' || row.value === null) throw new Error('Expected encrypted row')
			if (fault === 'secret-id') {
				store.delete(created.id)
				row.id = '01k00000000000000000000001'
				const substitutedId = row.id as string
				store.set(substitutedId, row)
				expect(await portfolio.secrets.find({ secretId: substitutedId })).toMatchObject({ ok: true })
			} else {
				;(row.value as Record<string, string>)[fault] = randomBytes(fault === 'tag' ? 16 : 12).toString(
					'base64',
				)
				store.set(created.id, row)
				expect(await portfolio.secrets.find({ secretId: created.id })).toMatchObject({ ok: true })
			}
			await client.shutdown()
		},
	)

	it.each(['ciphertext', 'tag', 'nonce', 'secret-id', 'protection-id'] as const)(
		'authenticates encrypted values against bytes and identities: %s',
		(fault) => {
			const encryptionKey = Buffer.alloc(32, 8)
			const secretId = '01k00000000000000000000001' as const
			const protection = createProtection(encryptionKey)
			const helpers = createSecretHelpers(protection, encryptionKey)
			const encrypted = helpers.encode(secretId, ' exact value ')
			expect(helpers.decode(secretId, encrypted)).toBe(' exact value ')
			if (encrypted.mode !== 'encrypted') throw new Error('Expected encryption')
			const tampered = structuredClone(encrypted)
			if (fault === 'secret-id') {
				expect(() => helpers.decode('01k00000000000000000000002', tampered)).toThrow()
				return
			}
			if (fault === 'protection-id') {
				const substituted = { ...protection, id: '01k00000000000000000000002' as const }
				expect(() => createSecretHelpers(substituted, encryptionKey)).toThrow()
				return
			}
			tampered[fault] = randomBytes(fault === 'tag' ? 16 : 12).toString('base64')
			expect(() => helpers.decode(secretId, tampered)).toThrow()
		},
	)

	it('preserves plaintext exact values and returns metadata only', async () => {
		const dependencies = createTestDependencies()
		await withReadyPortfolio(async (portfolio) => {
			const created = requireSuccess(
				await portfolio.secrets.create({ title: ' Access ', value: ' exact value\n' }),
			)
			expect(created).not.toHaveProperty('value')
			expect(dependencies.storage.adapter.stores.get('secrets')!.get(created.id)).toMatchObject({
				value: { mode: 'plaintext', plaintext: ' exact value\n' },
			})
		}, dependencies)
	})

	it.each([null, key(10)])('preserves lone-surrogate JavaScript strings exactly (%s)', async (encryptionKey) => {
		const raw = 'left\ud800right\udcff'
		const { dependencies, client } = await setup(encryptionKey)
		const portfolio = requireSuccess(client.as({ by: 'test' }))
		const created = requireSuccess(await portfolio.secrets.create({ title: 'Surrogates', value: raw }))
		const row = dependencies.storage.adapter.stores.get('secrets')!.get(created.id)
		if (!row || typeof row.value !== 'object' || row.value === null) throw new Error('Expected Secret value')
		if (encryptionKey === null) {
			expect(row.value).toEqual({ mode: 'plaintext', plaintext: raw })
		} else {
			const encryptionKeyBytes = Buffer.from(encryptionKey, 'base64')
			const helpers = createSecretHelpers(createProtection(encryptionKeyBytes), encryptionKeyBytes)
			expect(helpers.decode(created.id, row.value as ReturnType<typeof helpers.encode>)).toBe(raw)
		}
		await client.shutdown()
	})
})
