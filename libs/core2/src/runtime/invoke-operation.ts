import { v, PipeError, type Pipe, type PipeOutput } from 'valleyed'

import type { attributionPipe } from '../domain/commons'
import { inputIssues, resultPipe, type Result, type SharedOperationError } from '../errors'
import { defineOperation, type Operation } from './define-operation'
import { Owner } from './owner'
import { transaction } from './transaction'

export async function invokeOperation<II, IO, OI, OO, EI, EO>(
	definition: Operation<Pipe<II, IO>, Pipe<OI, OO>, Pipe<EI, EO>>,
	owner: Owner,
	attribution: PipeOutput<typeof attributionPipe>,
	input: unknown,
): Promise<Result<OO, EO | SharedOperationError>> {
	let parsed: IO | PipeError
	try {
		parsed = v.compile(definition.input)(input)
	} catch {
		return { ok: false, error: { type: 'invalid-input', issues: [{ message: 'Invalid input.' }] } }
	}
	if (parsed instanceof PipeError) return { ok: false, error: { type: 'invalid-input', issues: inputIssues(parsed) } }
	const release = owner.admit()
	if (!release) return { ok: false, error: { type: 'storage-operation-failed' } }
	try {
		return await transaction<OO, EO | SharedOperationError>(owner, async () => {
			let result: unknown
			try {
				result = await definition.handler(parsed, {
					storage: owner.repo,
					stamp: { src: 'local', at: new Date().toISOString(), ...attribution },
				})
			} catch {
				result = { ok: false, error: { type: 'internal-error' } }
			}
			const output = v.validate(resultPipe(definition.output, definition.error), result)
			return output.valid ? output.value : { ok: false, error: { type: 'invalid-output' } }
		})
	} finally {
		release()
	}
}

if (import.meta.vitest) {
	const { describe, it, expect, beforeEach, afterEach } = import.meta.vitest
	const { EquippedError } = await import('equipped/errors')
	const { createTestDependencies } = await import('../testing/dependencies')
	const { migrations } = await import('../storage/migrations')
	const { projectSchema } = await import('../domain/project')
	const { withExplicitId } = await import('../storage/schema')

	describe('operation transaction', () => {
		let dependencies: ReturnType<typeof createTestDependencies>
		let owner: Owner
		const attribution = { by: 'runtime-author', cid: 'runtime-call' }
		beforeEach(async () => {
			dependencies = createTestDependencies()
			owner = new Owner(dependencies, migrations)
			owner.build()
			await owner.repo.session(() => owner.migrator.up())
		})
		afterEach(async () => {
			expect(await owner.shutdown()).toEqual({ ok: true, value: undefined })
		})
		it('uses one invocation stamp across awaited owned writes', async () => {
			const operation = defineOperation({
				title: 'Two writes',
				description: 'Synthetic stamp reuse',
				input: v.eq(undefined),
				output: v.eq(undefined),
				handler: async (_input, context) => {
					const stamp = context.stamp
					for (const id of ['01k00000000000000000000001', '01k00000000000000000000002']) {
						await withExplicitId(id, () =>
							context.storage
								.on(projectSchema)
								.one()
								.create({ title: 'Same stamp', spec: { type: 'source-control' }, created: context.stamp }),
						)
						expect(context.stamp).toBe(stamp)
					}
					return { ok: true, value: undefined }
				},
			})
			expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({ ok: true, value: undefined })
			const rows = await owner.repo.on(projectSchema).all().find()
			expect(rows).toHaveLength(2)
			expect(rows[0]?.created).toEqual(rows[1]?.created)
			expect(rows[0]?.created).toMatchObject({ src: 'local', ...attribution })
		})
		it('returns a parsed declared failure with extra fields stripped', async () => {
			const operation = defineOperation({
				title: 'Failure',
				description: 'Synthetic transforming failure',
				input: v.eq(undefined),
				output: v.eq(undefined),
				error: v.object({ type: v.eq('synthetic-failure'), length: v.string().pipe((text) => text.length) }),
				handler: () =>
					Promise.resolve({
						ok: false,
						error: { type: 'synthetic-failure', length: 'four', cause: 'synthetic-PROTECTED' },
						raw: 'synthetic-PROTECTED',
					}),
			})
			const result = await invokeOperation(operation, owner, attribution, undefined)
			expect(result).toEqual({ ok: false, error: { type: 'synthetic-failure', length: 4 } })
			if (result.ok || result.error.type !== 'synthetic-failure') throw new Error('Expected declared failure')
			expect(result.error.length.toFixed()).toBe('4')
		})
		it.each(['skip', 'swallow'] as const)('refuses a native session protocol violation: %s', async (mode) => {
			const adapter = dependencies.storage.adapter
			const original = adapter.session.bind(adapter)
			const descriptor = Object.getOwnPropertyDescriptor(adapter, 'session')
			const operation = defineOperation({
				title: 'Refuse',
				description: 'Synthetic refusal',
				input: v.eq(undefined),
				output: v.eq(undefined),
				handler: () => Promise.resolve({ ok: false, error: { type: 'invalid-output' } }),
			})
			Object.defineProperty(adapter, 'session', {
				configurable: true,
				value: async (work: () => Promise<unknown>) => {
					switch (mode) {
						case 'skip':
							return undefined
						case 'swallow':
							return original(work).catch(() => undefined)
						default:
							throw new Error('Unexpected test mode')
					}
				},
			})
			try {
				expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({
					ok: false,
					error: { type: 'storage-operation-failed' },
				})
				expect(owner.admit()).toBeUndefined()
			} finally {
				if (descriptor) Object.defineProperty(adapter, 'session', descriptor)
				else Reflect.deleteProperty(adapter, 'session')
			}
		})
		it.each(['direct', 'wrapped', 'foreign', 'nested', 'wrong-context'] as const)(
			'recognizes only this invocation abort: %s',
			async (mode) => {
				const adapter = dependencies.storage.adapter
				const original = adapter.session.bind(adapter)
				const operation = defineOperation({
					title: 'Refuse',
					description: 'Synthetic refusal',
					input: v.eq(undefined),
					output: v.eq(undefined),
					handler: () => Promise.resolve({ ok: false, error: { type: 'invalid-storage-output' } }),
				})
				adapter.session = async (work) => {
					try {
						return await original(work)
					} catch (error) {
						switch (mode) {
							case 'direct':
								throw error
							case 'wrapped':
								throw new EquippedError('synthetic-PROTECTED', { operation: 'session' }, error)
							case 'foreign':
								throw new Error('Core operation aborted')
							case 'nested':
								throw new EquippedError(
									'outer',
									{ operation: 'session' },
									new EquippedError('inner', { operation: 'session' }, error),
								)
							case 'wrong-context':
								throw new EquippedError('synthetic-PROTECTED', { operation: 'query' }, error)
							default:
								throw new Error('Unexpected test mode')
						}
					}
				}
				try {
					const result = await invokeOperation(operation, owner, attribution, undefined)
					const recognized = mode === 'direct' || mode === 'wrapped'
					expect(result).toEqual({
						ok: false,
						error: { type: recognized ? 'invalid-storage-output' : 'storage-operation-failed' },
					})
					const release = owner.admit()
					expect(Boolean(release)).toBe(recognized)
					release?.()
				} finally {
					adapter.session = original
				}
			},
		)
		it('does not reuse a prior invocation abort even on the same owner', async () => {
			const adapter = dependencies.storage.adapter
			const original = adapter.session.bind(adapter)
			let previous: unknown
			const operation = defineOperation({
				title: 'Refuse',
				description: 'Synthetic refusal',
				input: v.eq(undefined),
				output: v.eq(undefined),
				handler: () => Promise.resolve({ ok: false, error: { type: 'internal-error' } }),
			})
			adapter.session = async (work) => {
				try {
					return await original(work)
				} catch (error) {
					previous ??= error
					throw previous
				}
			}
			try {
				expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({
					ok: false,
					error: { type: 'internal-error' },
				})
				expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({
					ok: false,
					error: { type: 'storage-operation-failed' },
				})
			} finally {
				adapter.session = original
			}
		})
		it('waits for commit before returning success and drains pending handler work on shutdown', async () => {
			const adapter = dependencies.storage.adapter
			const original = adapter.session.bind(adapter)
			const entered = Promise.withResolvers<void>()
			const finishHandler = Promise.withResolvers<void>()
			const beforeCommit = Promise.withResolvers<void>()
			const commit = Promise.withResolvers<void>()
			let closed = false
			let returned = false
			const operation = defineOperation({
				title: 'Wait',
				description: 'Synthetic pending callback',
				input: v.eq(undefined),
				output: v.string(),
				handler: async () => {
					entered.resolve()
					await finishHandler.promise
					return { ok: true, value: 'committed' }
				},
			})
			adapter.session = (work) =>
				original(async () => {
					const value = await work()
					beforeCommit.resolve()
					await commit.promise
					return value
				})
			try {
				const result = invokeOperation(operation, owner, attribution, undefined).then((value) => {
					returned = true
					return value
				})
				await entered.promise
				const shutdown = owner.shutdown().then((value) => {
					closed = true
					return value
				})
				await Promise.resolve()
				expect(closed).toBe(false)
				finishHandler.resolve()
				await beforeCommit.promise
				expect(returned).toBe(false)
				expect(closed).toBe(false)
				commit.resolve()
				expect(await result).toEqual({ ok: true, value: 'committed' })
				expect(await shutdown).toEqual({ ok: true, value: undefined })
			} finally {
				finishHandler.resolve()
				commit.resolve()
				adapter.session = original
			}
		})
		it('does not return success when native commit rejects', async () => {
			const adapter = dependencies.storage.adapter
			const original = adapter.session.bind(adapter)
			const operation = defineOperation({
				title: 'Commit',
				description: 'Synthetic commit failure',
				input: v.eq(undefined),
				output: v.eq(undefined),
				handler: () => Promise.resolve({ ok: true, value: undefined }),
			})
			adapter.session = (work) =>
				original(async () => {
					await work()
					throw new Error('synthetic-PROTECTED-commit')
				})
			try {
				expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({
					ok: false,
					error: { type: 'storage-operation-failed' },
				})
			} finally {
				adapter.session = original
			}
		})
		it('validates transformed output inside the session before commit', async () => {
			const adapter = dependencies.storage.adapter
			const original = adapter.session.bind(adapter)
			let inside = false
			const operation = defineOperation({
				title: 'Transform',
				description: 'Synthetic transforming pipes',
				input: v.object({ text: v.string().pipe((text) => text.length) }),
				output: v.string().pipe((text) => {
					expect(inside).toBe(true)
					return text.length
				}),
				handler: (input, context) => {
					expect(input.text.toFixed()).toBe('4')
					expect(context.storage).toBe(owner.repo)
					expect(Object.keys(context).sort()).toEqual(['stamp', 'storage'])
					return Promise.resolve({ ok: true, value: 'parsed', cause: 'synthetic-PROTECTED' })
				},
			})
			adapter.session = (work) =>
				original(async () => {
					inside = true
					try {
						return await work()
					} finally {
						inside = false
					}
				})
			try {
				const result = await invokeOperation(operation, owner, attribution, { text: 'four', ignored: true })
				expect(inside).toBe(false)
				expect(result).toEqual({ ok: true, value: 6 })
				if (!result.ok) throw new Error('Expected success')
				expect(result.value.toFixed()).toBe('6')
			} finally {
				adapter.session = original
			}
		})
		it('rolls back malformed output instead of committing handler writes', async () => {
			const operation = defineOperation({
				title: 'Malformed',
				description: 'Synthetic invalid output',
				input: v.eq(undefined),
				output: v.string().pipe(v.min(1)),
				handler: async (_input, context) => {
					await withExplicitId('01k00000000000000000000001', () =>
						context.storage
							.on(projectSchema)
							.one()
							.create({ title: 'Rolled back', spec: { type: 'source-control' }, created: context.stamp }),
					)
					return { ok: true, value: '' }
				},
			})
			expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({
				ok: false,
				error: { type: 'invalid-output' },
			})
			expect(await owner.repo.on(projectSchema).all().find()).toEqual([])
		})
		it('rejects invalid input before admission and session or handler execution', async () => {
			const adapter = dependencies.storage.adapter
			const session = adapter.session.bind(adapter)
			let calls = 0
			const operation = defineOperation({
				title: 'Input',
				description: 'Synthetic input',
				input: v.string(),
				output: v.eq(undefined),
				handler: () => {
					calls++
					return Promise.resolve({ ok: true, value: undefined })
				},
			})
			adapter.session = () => {
				throw new Error('No session expected')
			}
			try {
				expect(await invokeOperation(operation, owner, attribution, null)).toMatchObject({
					ok: false,
					error: { type: 'invalid-input' },
				})
				owner.closeAdmission()
				expect(await invokeOperation(operation, owner, attribution, null)).toMatchObject({
					ok: false,
					error: { type: 'invalid-input' },
				})
				expect(calls).toBe(0)
			} finally {
				adapter.session = session
			}
		})
		it('does not expose exceptions from public input getters', async () => {
			let called = false
			const operation = defineOperation({
				title: 'Input',
				description: 'Synthetic input',
				input: v.object({ title: v.string() }),
				output: v.eq(undefined),
				handler: () => {
					called = true
					return Promise.resolve({ ok: true, value: undefined })
				},
			})
			const result = await invokeOperation(operation, owner, attribution, {
				get title() {
					throw new Error('synthetic-PROTECTED-input')
				},
			})
			expect(result).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
			expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
			expect(called).toBe(false)
		})
		it('classifies unexpected handler exceptions as internal-error after rollback', async () => {
			const operation = defineOperation({
				title: 'Throw',
				description: 'Synthetic author exception',
				input: v.eq(undefined),
				output: v.eq(undefined),
				handler: async (_input, context) => {
					await withExplicitId('01k00000000000000000000001', () =>
						context.storage
							.on(projectSchema)
							.one()
							.create({ title: 'Rolled back', spec: { type: 'source-control' }, created: context.stamp }),
					)
					throw new Error('synthetic-PROTECTED')
				},
			})
			expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({
				ok: false,
				error: { type: 'internal-error' },
			})
			expect(await owner.repo.on(projectSchema).all().find()).toEqual([])
		})
		it('rolls back writes on a declared safe failure', async () => {
			const operation = defineOperation({
				title: 'Refuse',
				description: 'Synthetic authored refusal',
				input: v.eq(undefined),
				output: v.eq(undefined),
				handler: async (_input, context) => {
					await withExplicitId('01k00000000000000000000001', () =>
						context.storage
							.on(projectSchema)
							.one()
							.create({ title: 'Rolled back', spec: { type: 'source-control' }, created: context.stamp }),
					)
					return { ok: false, error: { type: 'internal-error' } }
				},
			})
			expect(await invokeOperation(operation, owner, attribution, undefined)).toEqual({
				ok: false,
				error: { type: 'internal-error' },
			})
			expect(await owner.repo.on(projectSchema).all().find()).toEqual([])
		})
	})
}
