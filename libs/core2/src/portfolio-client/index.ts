import { EquippedError } from 'equipped/errors'
import { OrmMigrationError, type Migration } from 'equipped/orm'
import { v, PipeError, type PipeInput, type PipeOutput } from 'valleyed'

import { dependenciesPipe, type CoreDependencies, type RuntimeDependencies, type StorageAdapter } from '../dependencies'
import { attributionPipe } from '../domain/commons'
import {
	inputIssues,
	factoryErrorPipe,
	setupErrorPipe,
	migrationErrorPipe,
	resultPipe,
	type Result,
	type FactoryError,
	type SetupError,
	type MigrationError,
	type InvalidInputError,
	type StorageOperationFailedError,
} from '../errors'
import { issuePortfolio, type Portfolio } from '../portfolio'
import { Owner } from '../runtime/owner'
import { transaction } from '../runtime/transaction'
import { migrations } from '../storage/migrations'

let issueSetup: (owner: Owner) => PortfolioSetup
let issueClient: (owner: Owner) => PortfolioClient
let issueMigration: (owner: Owner) => PortfolioMigration

export class PortfolioMigration {
	readonly state = 'migration'
	readonly #owner: Owner
	private constructor(owner: Owner) {
		this.#owner = owner
	}
	static {
		issueMigration = (owner) => new PortfolioMigration(owner)
	}
	async migrate(): Promise<Result<PortfolioClient, MigrationError>> {
		const release = this.#owner.admit()
		if (!release) return { ok: false, error: { type: 'storage-operation-failed' } }
		try {
			const result = await transaction(this.#owner, async (): Promise<Result<void, MigrationError>> => {
				let result: Result<void, MigrationError>
				try {
					const state = await this.#owner.inspect()
					if (!state.ok) result = state
					else
						switch (state.value) {
							case 'ready':
								result = { ok: false, error: { type: 'schema-already-current' } }
								break
							case 'empty':
								result = { ok: false, error: { type: 'storage-not-initialized' } }
								break
							case 'migration':
								try {
									await this.#owner.migrator.up()
									result = await this.#owner.confirmMigrationRun()
								} catch (error) {
									result = { ok: false, error: migrationFailure(error, this.#owner.catalog) }
								}
								break
							default:
								throw new Error('Unexpected history state.')
						}
				} catch {
					result = { ok: false, error: { type: 'internal-error' } }
				}
				const parsed = v.validate(resultPipe(v.undefined(), migrationErrorPipe), result)
				return parsed.valid ? parsed.value : { ok: false, error: { type: 'internal-error' } }
			})
			return result.ok ? { ok: true, value: issueClient(this.#owner) } : result
		} finally {
			release()
		}
	}
	shutdown() {
		return this.#owner.shutdown()
	}
}

export class PortfolioSetup {
	readonly state = 'uninitialized'
	readonly #owner: Owner
	private constructor(owner: Owner) {
		this.#owner = owner
	}
	static {
		issueSetup = (owner) => new PortfolioSetup(owner)
	}
	shutdown() {
		return this.#owner.shutdown()
	}
	async setup(): Promise<Result<PortfolioClient, SetupError>> {
		const release = this.#owner.admit()
		if (!release) return { ok: false, error: { type: 'storage-operation-failed' } }
		const abort = new Error('Core setup aborted.')
		let failure: SetupError | undefined
		let completed = false
		try {
			await this.#owner.repo.session(async () => {
				let result: Result<void, SetupError>
				try {
					const state = await this.#owner.inspect()
					if (!state.ok) result = state
					else
						switch (state.value) {
							case 'ready':
							case 'migration':
								result = { ok: false, error: { type: 'storage-already-initialized' } }
								break
							case 'empty':
								try {
									await this.#owner.migrator.up()
									result = await this.#owner.confirmMigrationRun()
								} catch (error) {
									result = { ok: false, error: migrationFailure(error, this.#owner.catalog) }
								}
								break
							default:
								throw new Error('Unexpected history state.')
						}
				} catch {
					result = { ok: false, error: { type: 'internal-error' } }
				}
				const parsed = v.validate(resultPipe(v.undefined(), setupErrorPipe), result)
				if (!parsed.valid) failure = { type: 'internal-error' }
				else if (!parsed.value.ok) failure = parsed.value.error
				if (failure) throw abort
				completed = true
			})
			if (!completed || failure) {
				this.#owner.closeAdmission()
				return { ok: false, error: { type: 'storage-operation-failed' } }
			}
			return { ok: true, value: issueClient(this.#owner) }
		} catch (error) {
			if (
				failure &&
				(error === abort || (error instanceof EquippedError && error.context.operation === 'session' && error.cause === abort))
			) {
				return { ok: false, error: failure }
			}
			// Replacing our callback abort is observable unwind failure, not an
			// ordinary rollback. A later explicit shutdown may clean up resources.
			if (failure) this.#owner.closeAdmission()
			return { ok: false, error: { type: 'storage-operation-failed' } }
		} finally {
			release()
		}
	}
}

export class PortfolioClient {
	readonly state = 'ready'
	readonly #owner: Owner
	private constructor(owner: Owner) {
		this.#owner = owner
	}
	static {
		issueClient = (owner) => new PortfolioClient(owner)
	}
	shutdown() {
		return this.#owner.shutdown()
	}

	as(
		attribution: Pick<PipeInput<typeof attributionPipe>, 'by'> & Partial<Pick<PipeInput<typeof attributionPipe>, 'cid'>>,
	): Result<Portfolio, InvalidInputError | StorageOperationFailedError> {
		let parsed: PipeOutput<typeof attributionPipe> | PipeError
		try {
			parsed = v.compile(attributionPipe)(attribution)
		} catch {
			return { ok: false, error: { type: 'invalid-input', issues: [{ message: 'Invalid attribution.' }] } }
		}
		if (parsed instanceof PipeError) return { ok: false, error: { type: 'invalid-input', issues: inputIssues(parsed) } }
		const release = this.#owner.admit()
		if (!release) return { ok: false, error: { type: 'storage-operation-failed' } }
		try {
			return { ok: true, value: issuePortfolio(this.#owner, parsed) }
		} finally {
			release()
		}
	}

	static async new<A extends StorageAdapter>(
		dependencies: CoreDependencies<A>,
	): Promise<Result<PortfolioSetup | PortfolioMigration | PortfolioClient, FactoryError>> {
		const result = await openWithCatalog(dependencies, migrations)
		if (result.ok) return result
		const error = v.validate(factoryErrorPipe, result.error)
		return { ok: false, error: error.valid ? error.value : { type: 'internal-error' } }
	}
}

// Native migration errors wrap both adapter I/O and authored callbacks. Keep
// that distinction out of the session/abort protocol; never inspect messages.
function migrationFailure(
	error: unknown,
	catalog: readonly Migration<StorageAdapter>[],
): Extract<SetupError, { type: 'storage-operation-failed' | 'internal-error' }> {
	if (!(error instanceof OrmMigrationError)) return { type: 'internal-error' }
	switch (error.phase) {
		case 'load':
		case 'lock':
		case 'record':
		case 'session':
			return { type: 'storage-operation-failed' }
		case 'user': {
			// Only a known entirely declarative entry establishes an adapter-call
			// boundary. 'user' alone does not establish an authored-code failure.
			// Callback-bearing entries lack precise failing-change provenance;
			// internal-error is the fallback, not proof of an authored cause.
			const entry = catalog.find(({ id }) => id === error.id)
			return { type: entry?.changes.every(({ kind }) => kind !== 'execute') ? 'storage-operation-failed' : 'internal-error' }
		}
		default:
			throw new Error('Unexpected migration phase.')
	}
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest
	const { createTestDependencies } = await import('../testing/dependencies')

	const upgradeCatalog = [
		...migrations,
		{
			id: '01m76d124c6e848k2hfvb4mar3',
			changes: [{ kind: 'createTable', name: 'test_pending_one', pk: { name: 'id', type: 'string' }, fields: [] }],
		},
		{
			id: '01m76d124c6e848k2hfvb4mar4',
			changes: [{ kind: 'createTable', name: 'test_pending_two', pk: { name: 'id', type: 'string' }, fields: [] }],
		},
	] as const satisfies readonly Migration<StorageAdapter>[]

	function restoreMethods(adapter: StorageAdapter, ...methods: (keyof StorageAdapter)[]) {
		const descriptors = methods.map((method) => [method, Object.getOwnPropertyDescriptor(adapter, method)] as const)
		return () => {
			for (const [method, descriptor] of descriptors) {
				if (descriptor) Object.defineProperty(adapter, method, descriptor)
				else Reflect.deleteProperty(adapter, method)
			}
		}
	}

	async function migrationFixture(
		catalog: readonly Migration<StorageAdapter>[] = upgradeCatalog,
		dependencies = createTestDependencies(),
	) {
		const adapter = dependencies.storage.adapter
		const setup = await PortfolioClient.new(dependencies)
		if (!setup.ok || setup.value.state !== 'uninitialized') throw new Error('Expected setup')
		try {
			const client = await setup.value.setup()
			if (!client.ok) throw new Error('Expected ready')
			const portfolio = client.value.as({ by: 'test-prefix' })
			if (!portfolio.ok) throw new Error('Expected Portfolio')
			const project = await portfolio.value.projects.create({ title: 'Existing project', spec: { type: 'source-control' } })
			if (!project.ok) throw new Error('Expected Project')
			const before = { schema: await adapter.introspect(), ledger: await adapter.loadMigrations(), project: project.value }
			expect(await client.value.shutdown()).toEqual({ ok: true, value: undefined })
			const opened = await openWithCatalog(dependencies, catalog)
			if (!opened.ok || opened.value.state !== 'migration') throw new Error('Expected migration')
			return { dependencies, adapter, opened: opened.value, before }
		} finally {
			expect(await setup.value.shutdown()).toEqual({ ok: true, value: undefined })
		}
	}

	it('does not preflight codecs or the resolver when migrating declarative entries', async () => {
		const dependencies = createTestDependencies()
		const resolve = dependencies.storage.resolveSchema
		const calls: string[] = []
		let armed = false
		dependencies.storage.resolveSchema = (schema) => {
			if (armed) {
				calls.push('resolve')
				throw new Error('synthetic-PROTECTED')
			}
			return resolve(schema)
		}
		dependencies.secrets.encode = () => {
			calls.push('encode')
			throw new Error('synthetic-PROTECTED')
		}
		dependencies.secrets.decode = () => {
			calls.push('decode')
			throw new Error('synthetic-PROTECTED')
		}
		const { opened } = await migrationFixture(upgradeCatalog, dependencies)
		armed = true
		try {
			expect(await opened.migrate()).toMatchObject({ ok: true, value: { state: 'ready' } })
			expect(calls).toEqual([])
		} finally {
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})

	it('drains an admitted migration before shared cleanup and rejects new admission immediately', async () => {
		const { adapter, opened } = await migrationFixture()
		const ddlDescriptor = Object.getOwnPropertyDescriptor(adapter, 'applyCreateTable')
		const disconnectDescriptor = Object.getOwnPropertyDescriptor(adapter, 'disconnect')
		const create = adapter.applyCreateTable.bind(adapter)
		const entered = Promise.withResolvers<void>()
		const gate = Promise.withResolvers<void>()
		const cleanupEntered = Promise.withResolvers<void>()
		const cleanupGate = Promise.withResolvers<void>()
		adapter.applyCreateTable = async (change) => {
			entered.resolve()
			await gate.promise
			await create(change)
		}
		let cleanups = 0
		adapter.disconnect = async () => {
			cleanups++
			cleanupEntered.resolve()
			await cleanupGate.promise
		}
		const migrating = opened.migrate()
		try {
			await entered.promise
			let settled = false
			const closing = opened.shutdown()
			void closing.then(() => {
				settled = true
			})
			expect(opened.shutdown()).toBe(closing)
			expect(await opened.migrate()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			expect(cleanups).toBe(0)
			expect(settled).toBe(false)
			gate.resolve()
			const result = await migrating
			if (!result.ok) throw new Error('Expected admitted migration to finish')
			const client = result.value
			expect(client.state).toBe('ready')
			expect(client.as({ by: 'too-late' })).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			await cleanupEntered.promise
			expect(client.shutdown()).toBe(closing)
			expect(settled).toBe(false)
			cleanupGate.resolve()
			expect(await closing).toEqual({ ok: true, value: undefined })
			expect(await client.shutdown()).toEqual({ ok: true, value: undefined })
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
			expect(cleanups).toBe(1)
		} finally {
			gate.resolve()
			cleanupGate.resolve()
			await migrating
			await opened.shutdown()
			if (ddlDescriptor) Object.defineProperty(adapter, 'applyCreateTable', ddlDescriptor)
			else Reflect.deleteProperty(adapter, 'applyCreateTable')
			if (disconnectDescriptor) Object.defineProperty(adapter, 'disconnect', disconnectDescriptor)
			else Reflect.deleteProperty(adapter, 'disconnect')
		}
	})

	it.each([false, true])('issues ready only after the outer migration commit (reject: %s)', async (reject) => {
		const { adapter, opened, before } = await migrationFixture()
		const descriptor = Object.getOwnPropertyDescriptor(adapter, 'session')
		const session = adapter.session.bind(adapter)
		const entered = Promise.withResolvers<void>()
		const gate = Promise.withResolvers<void>()
		let sessions = 0
		Object.defineProperty(adapter, 'session', {
			configurable: true,
			value: async (work: () => Promise<unknown>) => {
				if (++sessions !== 1) return session(work)
				return session(async () => {
					const result = await work()
					entered.resolve()
					await gate.promise
					if (reject) throw new Error('synthetic-PROTECTED')
					return result
				})
			},
		})
		let settled = false
		const pending = opened.migrate().then((result) => {
			settled = true
			return result
		})
		try {
			await entered.promise
			expect(settled).toBe(false)
			gate.resolve()
			const result = await pending
			if (reject) {
				expect(result).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
				expect(await adapter.introspect()).toEqual(before.schema)
				expect(await adapter.loadMigrations()).toEqual(before.ledger)
			} else expect(result).toMatchObject({ ok: true, value: { state: 'ready' } })
		} finally {
			gate.resolve()
			await pending
			if (descriptor) Object.defineProperty(adapter, 'session', descriptor)
			else Reflect.deleteProperty(adapter, 'session')
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})

	it.each(['skip', 'swallow'] as const)('refuses a falsely successful inner migration session: %s', async (fault) => {
		const { adapter, opened, before } = await migrationFixture()
		const sessionDescriptor = Object.getOwnPropertyDescriptor(adapter, 'session')
		const ddlDescriptor = Object.getOwnPropertyDescriptor(adapter, 'applyCreateTable')
		const session = adapter.session.bind(adapter)
		const create = adapter.applyCreateTable.bind(adapter)
		let calls = 0
		Object.defineProperty(adapter, 'session', {
			configurable: true,
			value: async (work: () => Promise<unknown>) => {
				const current = ++calls
				if (current === 2 && fault === 'skip') return undefined
				try {
					return await session(work)
				} catch (error) {
					if (current === 2 && fault === 'swallow') return undefined
					throw error
				}
			},
		})
		adapter.applyCreateTable = async (change) => {
			await create(change)
			if (change.name === 'test_pending_one') throw new Error('synthetic-PROTECTED')
		}
		try {
			expect(await opened.migrate()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			expect(calls).toBe(3)
			expect(await adapter.introspect()).toEqual(before.schema)
			expect(await adapter.loadMigrations()).toEqual(before.ledger)
			if (sessionDescriptor) Object.defineProperty(adapter, 'session', sessionDescriptor)
			else Reflect.deleteProperty(adapter, 'session')
			if (ddlDescriptor) Object.defineProperty(adapter, 'applyCreateTable', ddlDescriptor)
			else Reflect.deleteProperty(adapter, 'applyCreateTable')
			expect(await opened.migrate()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		} finally {
			if (sessionDescriptor) Object.defineProperty(adapter, 'session', sessionDescriptor)
			else Reflect.deleteProperty(adapter, 'session')
			if (ddlDescriptor) Object.defineProperty(adapter, 'applyCreateTable', ddlDescriptor)
			else Reflect.deleteProperty(adapter, 'applyCreateTable')
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})

	it.each(['inspection', 'native-load', 'post-run', 'lock', 'record', 'session'] as const)(
		'permits explicit migration retry after a rolled-back %s I/O failure',
		async (fault) => {
			const { adapter, opened, before } = await migrationFixture()
			let method: 'loadMigrations' | 'acquireMigrationLock' | 'recordMigration' | 'session'
			switch (fault) {
				case 'inspection':
				case 'native-load':
				case 'post-run':
					method = 'loadMigrations'
					break
				case 'lock':
					method = 'acquireMigrationLock'
					break
				case 'record':
					method = 'recordMigration'
					break
				case 'session':
					method = 'session'
					break
				default:
					throw new Error('Unexpected I/O fault')
			}
			const descriptor = Object.getOwnPropertyDescriptor(adapter, method)
			const load = adapter.loadMigrations.bind(adapter)
			let reads = 0
			Object.defineProperty(adapter, method, {
				configurable: true,
				value: async () => {
					if (method === 'loadMigrations') {
						const history = await load()
						reads++
						if ((fault === 'native-load' && reads !== 2) || (fault === 'post-run' && history.length !== 3)) return history
					}
					throw new Error('synthetic-PROTECTED')
				},
			})
			try {
				expect(await opened.migrate()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
				expect(await adapter.introspect()).toEqual(before.schema)
				expect(await load()).toEqual(before.ledger)
				if (descriptor) Object.defineProperty(adapter, method, descriptor)
				else Reflect.deleteProperty(adapter, method)
				expect(await opened.migrate()).toMatchObject({ ok: true, value: { state: 'ready' } })
			} finally {
				if (descriptor) Object.defineProperty(adapter, method, descriptor)
				else Reflect.deleteProperty(adapter, method)
				expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
			}
		},
	)

	it.each(['incomplete', 'malformed', 'unknown', 'gap'] as const)(
		'rolls back a resolved upgrade with a %s ledger and closes admission',
		async (fault) => {
			const { adapter, opened, before } = await migrationFixture()
			const descriptor = Object.getOwnPropertyDescriptor(adapter, 'recordMigration')
			const record = adapter.recordMigration.bind(adapter)
			adapter.recordMigration = async (id, at) => {
				switch (fault) {
					case 'incomplete':
						return
					case 'malformed':
						await record('synthetic-PROTECTED', at)
						return
					case 'unknown':
						await record('01k00000000000000000000001', at)
						return
					case 'gap':
						if (id === upgradeCatalog[2].id) await record(id, at)
						return
					default:
						throw new Error('Unexpected ledger fault')
				}
			}
			try {
				expect(await opened.migrate()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
				expect(await adapter.introspect()).toEqual(before.schema)
				expect(await adapter.loadMigrations()).toEqual(before.ledger)
				if (descriptor) Object.defineProperty(adapter, 'recordMigration', descriptor)
				else Reflect.deleteProperty(adapter, 'recordMigration')
				expect(await opened.migrate()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			} finally {
				if (descriptor) Object.defineProperty(adapter, 'recordMigration', descriptor)
				else Reflect.deleteProperty(adapter, 'recordMigration')
				expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
			}
		},
	)

	it.each(['direct', 'wrapped', 'replaced', 'swallowed', 'skipped'] as const)(
		'handles %s migration session unwind without reopening a failed protocol',
		async (mode) => {
			const { adapter, opened, before } = await migrationFixture()
			await adapter.recordMigration('synthetic-PROTECTED', 0)
			const ledger = await adapter.loadMigrations()
			const descriptor = Object.getOwnPropertyDescriptor(adapter, 'session')
			const session = adapter.session.bind(adapter)
			Object.defineProperty(adapter, 'session', {
				configurable: true,
				value: async (work: () => Promise<unknown>) => {
					if (mode === 'skipped') return undefined
					try {
						return await session(work)
					} catch (error) {
						switch (mode) {
							case 'direct':
								throw error
							case 'wrapped':
								throw new EquippedError('synthetic-PROTECTED', { operation: 'session' }, error)
							case 'replaced':
								throw new Error('synthetic-PROTECTED')
							case 'swallowed':
								return undefined
							default:
								throw new Error('Unexpected fault mode')
						}
					}
				},
			})
			try {
				const type = mode === 'direct' || mode === 'wrapped' ? 'schema-metadata-invalid' : 'storage-operation-failed'
				expect(await opened.migrate()).toEqual({ ok: false, error: { type } })
				expect(await adapter.introspect()).toEqual(before.schema)
				expect(await adapter.loadMigrations()).toEqual(ledger)
				if (descriptor) Object.defineProperty(adapter, 'session', descriptor)
				else Reflect.deleteProperty(adapter, 'session')
				expect(await opened.migrate()).toEqual({ ok: false, error: { type } })
			} finally {
				if (descriptor) Object.defineProperty(adapter, 'session', descriptor)
				else Reflect.deleteProperty(adapter, 'session')
				expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
			}
		},
	)

	it.each([
		['nonarray', { protected: 'synthetic-PROTECTED' }, 'schema-metadata-invalid'],
		[
			'malformed before unknown',
			[
				{ id: '01k00000000000000000000001', appliedAt: 0 },
				{ id: upgradeCatalog[0].id, appliedAt: -1 },
			],
			'schema-metadata-invalid',
		],
		[
			'duplicate before unknown',
			[
				{ id: upgradeCatalog[0].id, appliedAt: 0 },
				{ id: upgradeCatalog[0].id, appliedAt: 1 },
				{ id: '01k00000000000000000000001', appliedAt: 0 },
			],
			'schema-metadata-invalid',
		],
		[
			'unknown before gap',
			[
				{ id: upgradeCatalog[2].id, appliedAt: 0 },
				{ id: '01k00000000000000000000001', appliedAt: 0 },
			],
			'schema-version-unrecognized',
		],
		[
			'gap',
			[
				{ id: upgradeCatalog[0].id, appliedAt: 0 },
				{ id: upgradeCatalog[2].id, appliedAt: 0 },
			],
			'schema-metadata-invalid',
		],
		[
			'malformed current',
			[...upgradeCatalog.map(({ id }) => ({ id, appliedAt: 0 })), { id: 'synthetic-PROTECTED', appliedAt: 0 }],
			'schema-metadata-invalid',
		],
	] as const)('validates %s history before migration refusals or writes', async (_name, history, type) => {
		const { adapter, opened, before } = await migrationFixture()
		const restore = restoreMethods(adapter, 'loadMigrations', 'introspect')
		Object.defineProperty(adapter, 'loadMigrations', { configurable: true, value: () => Promise.resolve(history) })
		let inspections = 0
		Object.defineProperty(adapter, 'introspect', {
			configurable: true,
			value: () => {
				inspections++
				return Promise.resolve([])
			},
		})
		try {
			expect(await opened.migrate()).toEqual({ ok: false, error: { type } })
			expect(inspections).toBe(0)
			restore()
			expect(await adapter.introspect()).toEqual(before.schema)
			expect(await adapter.loadMigrations()).toEqual(before.ledger)
			expect(await opened.migrate()).toMatchObject({ ok: true, value: { state: 'ready' } })
		} finally {
			restore()
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})

	it.each(['authored', 'declarative'] as const)('rolls back every new suffix change after a later %s failure', async (failure) => {
		const { projectSchema } = await import('../domain/project')
		const { Schema } = await import('equipped/orm')
		const pendingSchema = Schema.from('test_pending_one')
			.pk('id', v.string(), () => 'pending-row')
			.build()
		let fail = true
		let reachedLater = false
		const catalog: readonly Migration<StorageAdapter>[] = [
			migrations[0],
			{
				id: upgradeCatalog[1].id,
				changes: [
					...upgradeCatalog[1].changes,
					{
						kind: 'execute',
						up: async (repo) => {
							await repo.on(projectSchema).all().update({ title: 'Pending rewrite' })
							await repo.on(pendingSchema).one().create({})
						},
					},
				],
			},
			failure === 'authored'
				? {
						id: upgradeCatalog[2].id,
						changes: [
							{
								kind: 'execute',
								up: async (repo) => {
									expect((await repo.on(projectSchema).all().find()).map(({ title }) => title)).toEqual([
										'Pending rewrite',
									])
									reachedLater = true
									await repo.on(projectSchema).all().update({ title: 'Later rewrite' })
									if (fail) throw new Error('synthetic-PROTECTED')
								},
							},
						],
					}
				: upgradeCatalog[2],
		]
		const { adapter, opened, before } = await migrationFixture(catalog)
		const descriptor = Object.getOwnPropertyDescriptor(adapter, 'applyCreateTable')
		const create = adapter.applyCreateTable.bind(adapter)
		if (failure === 'declarative')
			adapter.applyCreateTable = async (change) => {
				await create(change)
				if (change.name === 'test_pending_two') {
					expect((await adapter.loadMigrations()).map(({ id }) => id)).toEqual([migrations[0].id, upgradeCatalog[1].id])
					expect(await adapter.findByPk(projectSchema, { table: 'projects' }, before.project.id)).toEqual({
						...before.project,
						title: 'Pending rewrite',
					})
					reachedLater = true
					if (fail) throw new Error('synthetic-PROTECTED')
				}
			}
		try {
			expect(await opened.migrate()).toEqual({
				ok: false,
				error: {
					type: failure === 'authored' ? 'internal-error' : 'storage-operation-failed',
				},
			})
			expect(reachedLater).toBe(true)
			expect(await adapter.introspect()).toEqual(before.schema)
			expect(await adapter.loadMigrations()).toEqual(before.ledger)
			expect(await adapter.findByPk(projectSchema, { table: 'projects' }, before.project.id)).toEqual(before.project)
			expect(await adapter.findByPk(pendingSchema, { table: 'test_pending_one' }, 'pending-row')).toBeNull()
			fail = false
			const result = await opened.migrate()
			if (!result.ok) throw new Error('Expected explicit retry to migrate')
			const portfolio = result.value.as({ by: 'after-retry' })
			if (!portfolio.ok) throw new Error('Expected Portfolio')
			expect(await portfolio.value.projects.list()).toEqual({
				ok: true,
				value: [
					{
						...before.project,
						title: failure === 'authored' ? 'Later rewrite' : 'Pending rewrite',
					},
				],
			})
			expect((await adapter.loadMigrations()).map(({ id }) => id)).toEqual(catalog.map(({ id }) => id))
			expect(await adapter.findByPk(pendingSchema, { table: 'test_pending_one' }, 'pending-row')).toEqual({ id: 'pending-row' })
		} finally {
			if (descriptor) Object.defineProperty(adapter, 'applyCreateTable', descriptor)
			else Reflect.deleteProperty(adapter, 'applyCreateTable')
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})

	it.each([false, true])('refuses empty history without upgrading (containers: %s)', async (containers) => {
		const { adapter, opened } = await migrationFixture()
		const schema = await adapter.introspect()
		const restore = restoreMethods(adapter, 'loadMigrations', 'introspect')
		Object.defineProperty(adapter, 'loadMigrations', { configurable: true, value: () => Promise.resolve([]) })
		if (!containers) Object.defineProperty(adapter, 'introspect', { configurable: true, value: () => Promise.resolve([]) })
		try {
			expect(await opened.migrate()).toEqual({
				ok: false,
				error: { type: containers ? 'storage-not-empty' : 'storage-not-initialized' },
			})
			restore()
			expect(await adapter.introspect()).toEqual(schema)
			expect(await adapter.loadMigrations()).toHaveLength(1)
			expect(await opened.migrate()).toMatchObject({ ok: true, value: { state: 'ready' } })
		} finally {
			restore()
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})

	it('explicitly upgrades the whole pending suffix and retains the old migration view', async () => {
		const { adapter, opened, before } = await migrationFixture()
		try {
			expect(await adapter.introspect()).toEqual(before.schema)
			expect(await adapter.loadMigrations()).toEqual(before.ledger)
			const result = await opened.migrate()
			if (!result.ok) throw new Error('Expected migrated client')
			expect(result.value.state).toBe('ready')
			expect(result.value).not.toBe(opened)
			expect(opened.state).toBe('migration')
			expect((await adapter.introspect()).map(({ name }) => name)).toEqual([
				...before.schema.map(({ name }) => name),
				'test_pending_one',
				'test_pending_two',
			])
			const ledger = await adapter.loadMigrations()
			expect(ledger).toHaveLength(3)
			expect(ledger[0]).toEqual(before.ledger[0])
			expect(ledger.map(({ id }) => id)).toEqual(upgradeCatalog.map(({ id }) => id))
			const portfolio = result.value.as({ by: 'test-upgraded' })
			if (!portfolio.ok) throw new Error('Expected Portfolio')
			expect(await portfolio.value.projects.list()).toEqual({ ok: true, value: [before.project] })
			expect(await opened.migrate()).toEqual({ ok: false, error: { type: 'schema-already-current' } })
			expect(await adapter.loadMigrations()).toEqual(ledger)
			expect(await portfolio.value.projects.list()).toEqual({ ok: true, value: [before.project] })
		} finally {
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})
	it('rolls back an unexpected authored migration failure as internal-error', async () => {
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const adapter = InMemoryAdapter.create({})
		const result = await openWithCatalog(
			{
				storage: { adapter, resolveSchema: (schema) => ({ table: schema.name }) },
				secrets: { encode: () => Promise.resolve(null), decode: () => Promise.resolve({}) },
			},
			[
				...migrations,
				{
					id: '01m76d124c6e848k2hfvb4mar3',
					changes: [
						{
							kind: 'execute',
							up: () => Promise.reject(new Error('synthetic-PROTECTED')),
						},
					],
				},
			],
		)
		if (!result.ok || result.value.state !== 'uninitialized') throw new Error('Expected setup')
		try {
			expect(await result.value.setup()).toEqual({ ok: false, error: { type: 'internal-error' } })
			expect(await adapter.introspect()).toEqual([])
			expect(await adapter.loadMigrations()).toEqual([])
		} finally {
			expect(await result.value.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})

	it('issues a migration view for a valid proper native catalog prefix', async () => {
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const adapter = InMemoryAdapter.create({})
		await adapter.recordMigration('01m76d124c6e848k2hfvb4mar2', 0)
		const result = await openWithCatalog(
			{
				storage: { adapter, resolveSchema: (schema) => ({ table: schema.name }) },
				secrets: { encode: () => Promise.resolve(null), decode: () => Promise.resolve({}) },
			},
			[
				...migrations,
				{
					id: '01m76d124c6e848k2hfvb4mar3',
					changes: [{ kind: 'createTable', name: 'test_later', pk: { name: 'id', type: 'string' }, fields: [] }],
				},
			],
		)
		expect(result).toMatchObject({ ok: true, value: { state: 'migration' } })
		if (result.ok) expect(await result.value.shutdown()).toEqual({ ok: true, value: undefined })
		expect(await adapter.introspect()).toEqual([])
		expect(await adapter.loadMigrations()).toEqual([{ id: '01m76d124c6e848k2hfvb4mar2', appliedAt: 0 }])
	})
}

async function openWithCatalog(
	dependencies: RuntimeDependencies,
	catalog: readonly Migration<StorageAdapter>[],
): Promise<Result<PortfolioSetup | PortfolioMigration | PortfolioClient, FactoryError>> {
	let owner: Owner | undefined
	try {
		// The compiled Valleyed pipe preserves normal parsing/stripping but lets
		// unexpected getter exceptions reach this safe boundary, not issue text.
		const parsed = v.compile(dependenciesPipe())(dependencies)
		if (parsed instanceof PipeError) return { ok: false, error: { type: 'invalid-input', issues: inputIssues(parsed) } }
		owner = new Owner(parsed, catalog)
		try {
			await parsed.storage.adapter.connect?.()
		} catch {
			await owner.shutdown()
			return { ok: false, error: { type: 'storage-operation-failed' } }
		}
		owner.build()
		const state = await owner.inspect()
		if (!state.ok) {
			const cleanup = await owner.shutdown()
			return cleanup.ok ? state : cleanup
		}
		switch (state.value) {
			case 'ready':
				return { ok: true, value: issueClient(owner) }
			case 'migration':
				return { ok: true, value: issueMigration(owner) }
			case 'empty':
				return { ok: true, value: issueSetup(owner) }
			default:
				throw new Error('Unexpected history state.')
		}
	} catch {
		const cleanup = await owner?.shutdown()
		return cleanup && !cleanup.ok ? cleanup : { ok: false, error: { type: 'internal-error' } }
	}
}
