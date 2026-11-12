import type { AnyMigration } from 'equipped/orm'

import { initialFoundationMigration } from './initial-foundation'

// Append new author-time IDs in ascending order; retain all released entries.
const migrations = [initialFoundationMigration] as const satisfies readonly AnyMigration[]

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('applies the catalog through native InMemory migrations and classifies the raw ledger', async () => {
		const { Migrator, Repo } = await import('equipped/orm')
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const { v } = await import('valleyed')
		const { appliedAtPipe } = await import('../../domain/commons')
		const { classifyMigrationHistory } = await import('../history')
		const adapter = InMemoryAdapter.create({})
		const repo = Repo.from(adapter)
			.resolve((schema) => ({ table: schema.name }))
			.build()
		const migrator = Migrator.from(repo, adapter).migrations(migrations).build()
		const ids = migrations.map(({ id }) => id)
		const snapshot = structuredClone(migrations)
		expect(classifyMigrationHistory(await adapter.loadMigrations(), ids)).toEqual({ ok: true, value: 'empty' })
		expect(await migrator.up()).toEqual({ ran: ['01m76d124c6e848k2hfvb4mar2'], skipped: [] })
		const discovered = await adapter.introspect()
		expect(discovered).toEqual(
			initialFoundationMigration.changes.map(({ name, pk, fields }) => ({
				name,
				pk,
				fields: fields.map((field) => ({ nullable: false, ...field })),
				indexes: [],
				foreignKeys: [],
			})),
		)
		expect(discovered.map(({ name }) => name)).toEqual(['secrets', 'projects', 'assets', 'memories', 'memory_revisions'])
		const ledger = await adapter.loadMigrations()
		expect(ledger).toHaveLength(1)
		expect(ledger.map(({ id }) => id)).toEqual(['01m76d124c6e848k2hfvb4mar2'])
		for (const entry of ledger) {
			expect(Object.keys(entry).sort()).toEqual(['appliedAt', 'id'])
			expect(v.validate(appliedAtPipe, entry.appliedAt).valid).toBe(true)
		}
		expect(classifyMigrationHistory(ledger, ids)).toEqual({ ok: true, value: 'ready' })
		expect(await migrator.up()).toEqual({ ran: [], skipped: ['01m76d124c6e848k2hfvb4mar2'] })
		expect(await adapter.loadMigrations()).toEqual(ledger)
		expect(await adapter.introspect()).toEqual(discovered)
		expect(migrations).toEqual(snapshot)
	})

	it('builds the native catalog with its permanent initial identity', async () => {
		const { Migrator, Repo } = await import('equipped/orm')
		const { InMemoryAdapter } = await import('equipped/orm/adapters/in-memory')
		const { v } = await import('valleyed')
		const { idPipe } = await import('../../domain/commons')
		const adapter = InMemoryAdapter.create({})
		const repo = Repo.from(adapter)
			.resolve((schema) => ({ table: schema.name }))
			.build()
		const migrator = Migrator.from(repo, adapter).migrations(migrations).build()
		expect(await migrator.dry()).toEqual({ would: ['01m76d124c6e848k2hfvb4mar2'] })
		const ids = migrations.map(({ id }) => id)
		expect(ids).toEqual(['01m76d124c6e848k2hfvb4mar2'])
		expect(ids.length).toBeGreaterThan(0)
		expect(new Set(ids).size).toBe(ids.length)
		expect(ids).toEqual([...ids].sort())
		for (const id of ids) expect(v.validate(idPipe, id).valid).toBe(true)
		expect(await adapter.loadMigrations()).toEqual([])
		expect(await adapter.introspect()).toEqual([])
	})
}
