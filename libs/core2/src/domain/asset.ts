import { Schema } from 'equipped/orm'
import { v, type PipeOutput } from 'valleyed'

import { auditStampPipe, idPipe } from './commons'
import { requireExplicitId, schemaPipe } from '../storage/schema'

const repositoryIdentifierPipe = v
	.custom<string>((value) => typeof value === 'string', 'Expected a repository identifier.')
	.pipe(
		v.custom(
			(value) => value.length > 0 && !/[^A-Za-z0-9._-]/.test(value) && value !== '.' && value !== '..',
			'Expected a repository identifier.',
		),
	)

export const assetSchema = Schema.from('assets')
	.pk('id', idPipe, requireExplicitId)
	.field('projectId', idPipe)
	.field(
		'spec',
		v.object({
			type: v.custom<'repository'>((value) => value === 'repository', 'Expected a repository asset.'),
			source: v.object({
				provider: v.custom<'github'>((value) => value === 'github', 'Expected the GitHub provider.'),
				owner: repositoryIdentifierPipe,
				name: repositoryIdentifierPipe,
				secretId: idPipe,
			}),
		}),
	)
	.field('created', auditStampPipe)
	.build()

export const assetPipe = schemaPipe(assetSchema)
export type Asset = PipeOutput<typeof assetPipe>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('rejects nonprimitive source identifiers and discriminators with non-echoing diagnostics', () => {
		const sentinel = 'synthetic-PROTECTED-input'
		const source = { provider: 'github', owner: 'Owner', name: 'Repo', secretId: '01k00000000000000000000002' }
		const spoof = { constructor: { name: 'String' }, payload: sentinel, [sentinel]: sentinel }
		const hostile = {
			get constructor() {
				throw new Error(sentinel)
			},
		}
		const boxed: unknown = Object('github')
		for (const value of [boxed, spoof, hostile, sentinel, null]) {
			for (const spec of [
				{ type: value, source },
				{ type: 'repository', source: { ...source, provider: value } },
			]) {
				const parsed = v.validate(assetSchema.fields.spec.pipe, spec)
				expect(parsed.valid).toBe(false)
				if (parsed.valid) throw new Error('Expected invalid discriminator')
				expect(JSON.stringify(parsed.error.messages.map(({ path, message }) => ({ path, message })))).not.toContain(sentinel)
			}
		}
		for (const field of ['owner', 'name']) {
			for (const value of [boxed, spoof, hostile, null]) {
				const parsed = v.validate(assetSchema.fields.spec.pipe, { type: 'repository', source: { ...source, [field]: value } })
				expect(parsed.valid).toBe(false)
				if (parsed.valid) throw new Error('Expected invalid repository identifier')
				expect(parsed.error.messages.map(({ path }) => path)).toEqual([`source.${field}`])
				expect(JSON.stringify(parsed.error.messages.map(({ path, message }) => ({ path, message })))).not.toContain(sentinel)
			}
		}
		expect(
			v.validate(assetSchema.fields.spec.pipe, { type: 'repository', source: { ...source, secretId: `${source.secretId}\n` } }).valid,
		).toBe(false)
	})

	it('rejects repository locators and whitespace without repair', () => {
		const source = { provider: 'github', owner: 'Owner', name: 'Repo', secretId: '01k00000000000000000000002' }
		for (const field of ['owner', 'name']) {
			for (const value of ['', '.', '..', ' Owner', 'Repo ', 'Repo\n', 'a/b', 'a\\b', 'https://github.com/a', 'a%2Fb', 'Répo']) {
				expect
					.soft(
						v.validate(assetSchema.fields.spec.pipe, {
							type: 'repository',
							source: { ...source, [field]: value },
						}).valid,
					)
					.toBe(false)
			}
			for (const value of ['A', 'A.B_c-1', '...', '_', '-']) {
				expect(
					v.validate(assetSchema.fields.spec.pipe, {
						type: 'repository',
						source: { ...source, [field]: value },
					}),
				).toEqual({ valid: true, value: { type: 'repository', source: { ...source, [field]: value } } })
			}
		}
	})

	it('parses a nested repository Asset without flattening or normalizing its source', () => {
		const stamp = { src: 'local', at: '2026-11-11T00:00:00.000Z', by: 'test', cid: null }
		const source = { provider: 'github', owner: 'Acme.Tools', name: 'Repo_v2-1', secretId: '01k00000000000000000000002' }
		const input = {
			id: '01k00000000000000000000001',
			projectId: '01k00000000000000000000003',
			spec: { type: 'repository', source: { ...source, ignored: true } },
			created: stamp,
			title: 'legacy',
		}
		expect(v.validate(assetPipe, input)).toEqual({
			valid: true,
			value: {
				id: input.id,
				projectId: input.projectId,
				spec: { type: 'repository', source },
				created: stamp,
			},
		})
		expect(v.validate(assetPipe, { ...input, spec: undefined, ...source }).valid).toBe(false)
	})
}
