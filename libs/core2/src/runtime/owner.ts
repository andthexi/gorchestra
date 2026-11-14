import { Migrator, Repo, type Migration } from 'equipped/orm'
import { v } from 'valleyed'

import type { CoreDependencies, RuntimeDependencies, StorageAdapter } from '../dependencies'
import type { Result, StorageOperationFailedError, SetupError } from '../errors'
import { classifyMigrationHistory } from '../storage/history'

// Internal resource lifetime, never exported from the package entry.
export class Owner {
	#active = 0
	#drained: (() => void) | undefined
	#closed = false
	#cleaned = false
	#cleanup: Promise<Result<void, StorageOperationFailedError>> | undefined
	#repo: Repo<StorageAdapter> | undefined
	#migrator: Migrator<StorageAdapter> | undefined

	constructor(
		readonly dependencies: RuntimeDependencies,
		readonly catalog: readonly Migration<StorageAdapter>[],
	) {}

	build() {
		this.#repo = Repo.from<StorageAdapter>(this.dependencies.storage.adapter)
			.resolve(this.dependencies.storage.resolveSchema)
			.build()
		this.#migrator = Migrator.from<StorageAdapter>(this.#repo).withLock().migrations(this.catalog).build()
	}

	get repo() {
		if (!this.#repo) throw new Error('Owner has not been built.')
		return this.#repo
	}

	get migrator() {
		if (!this.#migrator) throw new Error('Owner has not been built.')
		return this.#migrator
	}

	async inspect(): Promise<
		Result<'empty' | 'migration' | 'ready', Exclude<SetupError, { type: 'storage-already-initialized' }>>
	> {
		const adapter = this.dependencies.storage.adapter
		let history: unknown
		try {
			history = await adapter.loadMigrations(this.repo.resolveConfig('_equipped_migrations'))
		} catch {
			return { ok: false, error: { type: 'storage-operation-failed' } }
		}
		const state = classifyMigrationHistory(
			history,
			this.catalog.map(({ id }) => id),
		)
		if (!state.ok || state.value !== 'empty') return state
		let containers: unknown
		try {
			containers = await adapter.introspect()
		} catch {
			return { ok: false, error: { type: 'storage-operation-failed' } }
		}
		const parsed = v.validate(v.array(v.custom<unknown>(() => true)), containers)
		if (!parsed.valid) return { ok: false, error: { type: 'storage-operation-failed' } }
		if (parsed.value.length > 0) return { ok: false, error: { type: 'storage-not-empty' } }
		return state
	}

	async confirmMigrationRun(): Promise<Result<void, StorageOperationFailedError>> {
		let history: unknown
		try {
			history = await this.dependencies.storage.adapter.loadMigrations(
				this.repo.resolveConfig('_equipped_migrations'),
			)
		} catch {
			// An ordinary read failure can still unwind successfully and permit retry.
			return { ok: false, error: { type: 'storage-operation-failed' } }
		}
		const state = classifyMigrationHistory(
			history,
			this.catalog.map(({ id }) => id),
		)
		if (state.ok && state.value === 'ready') return { ok: true, value: undefined }
		// A resolved run with a non-current raw ledger is observable protocol
		// failure. Abort the outer session and do not admit another setup.
		this.closeAdmission()
		return { ok: false, error: { type: 'storage-operation-failed' } }
	}

	closeAdmission() {
		this.#closed = true
	}

	admit(): (() => void) | undefined {
		if (this.#closed) return undefined
		this.#active++
		return () => {
			this.#active--
			if (this.#active === 0) this.#drained?.()
		}
	}

	shutdown(): Promise<Result<void, StorageOperationFailedError>> {
		this.#closed = true
		if (this.#cleanup) return this.#cleanup
		if (this.#cleaned) return Promise.resolve({ ok: true, value: undefined })
		this.#cleanup = Promise.resolve()
			.then(async (): Promise<Result<void, StorageOperationFailedError>> => {
				try {
					if (this.#active > 0)
						await new Promise<void>((resolve) => {
							this.#drained = resolve
						})
					await this.dependencies.storage.adapter.disconnect?.()
					this.#cleaned = true
					return { ok: true, value: undefined }
				} catch {
					return { ok: false, error: { type: 'storage-operation-failed' } }
				}
			})
			.finally(() => {
				this.#cleanup = undefined
			})
		return this.#cleanup
	}
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('keeps the specific resolver paired when using the fixed native contract', async () => {
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const { projectSchema } = await import('../domain/project')
		const { withExplicitId } = await import('../storage/schema')
		const { migrations } = await import('../storage/migrations')
		function buildOwner<A extends StorageAdapter>(
			dependencies: CoreDependencies<A>,
			catalog: readonly Migration<StorageAdapter>[],
		) {
			const owner = new Owner(dependencies, catalog)
			owner.build()
			return owner
		}
		const configurations: Array<{ table: string; scope: 'selected' }> = []
		class ScopedAdapter extends InMemoryAdapter {
			override readonly schemaConfigPipe = v
				.object({ table: v.string(), scope: v.eq('selected') })
				.pipe((config) => {
					configurations.push(config)
					return { table: config.table }
				})
		}
		const adapter = ScopedAdapter.create({})
		const resolveSchema: CoreDependencies<ScopedAdapter>['storage']['resolveSchema'] = (name) => ({
			table: name,
			scope: 'selected',
		})
		const owner = buildOwner(
			{
				storage: { adapter, resolveSchema },
				secrets: { encode: () => Promise.resolve(null), decode: () => Promise.resolve({}) },
			},
			migrations,
		)
		try {
			expect(owner.dependencies.storage.adapter).toBe(adapter)
			expect(await owner.inspect()).toEqual({ ok: true, value: 'empty' })
			await owner.repo.session(async () => {
				await owner.migrator.up()
				expect(await owner.confirmMigrationRun()).toEqual({ ok: true, value: undefined })
			})
			const project = await withExplicitId('01k00000000000000000000001', () =>
				owner.repo
					.on(projectSchema)
					.one()
					.create({
						title: 'Generic owner',
						spec: { type: 'source-control' },
						created: { src: 'local', at: '2026-11-12T00:00:00.000Z', by: 'test', cid: null },
					}),
			)
			expect(await owner.repo.on(projectSchema).all().find()).toEqual([project])
			expect(await owner.inspect()).toEqual({ ok: true, value: 'ready' })
			expect(configurations.length).toBeGreaterThan(0)
			expect(configurations.every(({ scope }) => scope === 'selected')).toBe(true)
		} finally {
			expect(await owner.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})
}
