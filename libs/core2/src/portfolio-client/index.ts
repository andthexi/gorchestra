import { EquippedError } from 'equipped/errors'
import { OrmMigrationError, type Migration } from 'equipped/orm'
import { v, PipeError, type PipeInput, type PipeOutput } from 'valleyed'

import { dependenciesPipe, type CoreDependencies, type RuntimeDependencies, type StorageAdapter } from '../dependencies'
import { attributionPipe } from '../domain/commons'
import {
	inputIssues,
	factoryErrorPipe,
	setupErrorPipe,
	resultPipe,
	type Result,
	type FactoryError,
	type SetupError,
	type InvalidInputError,
	type StorageOperationFailedError,
} from '../errors'
import { issuePortfolio, type Portfolio } from '../portfolio'
import { Owner } from '../runtime/owner'
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
function migrationFailure(error: unknown, catalog: readonly Migration<StorageAdapter>[]): SetupError {
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
			const entry = catalog.find(({ id }) => id === error.id)
			return { type: entry?.changes.every(({ kind }) => kind !== 'execute') ? 'storage-operation-failed' : 'internal-error' }
		}
		default:
			throw new Error('Unexpected migration phase.')
	}
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest
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
