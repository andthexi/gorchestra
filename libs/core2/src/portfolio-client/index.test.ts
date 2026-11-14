import { EquippedError } from 'equipped/errors'
import { Repo, Schema } from 'equipped/orm'
import { InMemoryAdapter } from 'equipped/orm/adapters/in-memory'
import { v, PipeError } from 'valleyed'
import { expect, it } from 'vitest'

import { PortfolioClient, type CoreDependencies, type PortfolioSetup, type PortfolioMigration, type Result } from '../index'
import { createTestDependencies, requireSuccess } from '../testing/fixtures'

it.each([false, true])('drains a pending Secret encoder before cleanup (encoder fails: %s)', async (fail) => {
	const deps = createTestDependencies()
	const adapter = deps.storage.adapter
	const entered = Promise.withResolvers<void>()
	const encodeGate = Promise.withResolvers<void>()
	const cleanupEntered = Promise.withResolvers<void>()
	const cleanupGate = Promise.withResolvers<void>()
	const events: string[] = []
	let encodes = 0
	let decodes = 0
	let closed = false
	let activeSession = false
	let cleaned = 0
	deps.secrets.encode = async () => {
		encodes++
		entered.resolve()
		await encodeGate.promise
		events.push('encoder-settled')
		if (fail) throw new Error('synthetic-PROTECTED')
		return 'synthetic-reference'
	}
	deps.secrets.decode = () => {
		decodes++
		return Promise.resolve({})
	}
	const opened = requireSuccess(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const client = requireSuccess(await opened.setup())
	const portfolio = requireSuccess(client.as({ by: 'drain' }))
	const session = adapter.session.bind(adapter)
	const createMany = adapter.createMany.bind(adapter)
	const writes: Array<Record<string, unknown>[]> = []
	adapter.session = async (work) => {
		activeSession = true
		try {
			return await session(work)
		} finally {
			activeSession = false
			events.push('session-settled')
		}
	}
	adapter.createMany = (...args) => {
		writes.push(args[2])
		return createMany(...args)
	}
	adapter.disconnect = async () => {
		cleaned++
		events.push('cleanup')
		expect(activeSession).toBe(false)
		cleanupEntered.resolve()
		await cleanupGate.promise
	}
	const pending = portfolio.secrets.create({ title: 'Pending', value: 'synthetic-PROTECTED' })
	try {
		await entered.promise
		expect(activeSession).toBe(true)
		expect(writes).toEqual([])
		expect(adapter.stores.get('secrets')?.size ?? 0).toBe(0)
		const shutdown = client.shutdown()
		void shutdown.then(() => {
			closed = true
		})
		expect(opened.shutdown()).toBe(shutdown)
		expect(client.as({ by: 'later' })).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await portfolio.secrets.create({ title: 'Too late', value: 'synthetic-raw' })).toEqual({
			ok: false,
			error: { type: 'storage-operation-failed' },
		})
		expect(await portfolio.secrets.find({ secretId: '01k00000000000000000000001' })).toEqual({
			ok: false,
			error: { type: 'storage-operation-failed' },
		})
		expect(await portfolio.secrets.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(closed).toBe(false)
		expect(cleaned).toBe(0)
		expect(writes).toEqual([])
		encodeGate.resolve()
		const result = await pending
		if (fail) expect(result).toEqual({ ok: false, error: { type: 'secret-encoding-failed' } })
		else {
			const secret = requireSuccess(result)
			expect(writes).toEqual([[{ ...secret, valueRef: 'synthetic-reference' }]])
		}
		await cleanupEntered.promise
		expect(events).toEqual(['encoder-settled', 'session-settled', 'cleanup'])
		expect(writes).toHaveLength(fail ? 0 : 1)
		expect(adapter.stores.get('secrets')?.size ?? 0).toBe(fail ? 0 : 1)
		expect(encodes).toBe(1)
		expect(decodes).toBe(0)
		expect(closed).toBe(false)
		cleanupGate.resolve()
		expect(await shutdown).toEqual({ ok: true, value: undefined })
		expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		expect(cleaned).toBe(1)
	} finally {
		encodeGate.resolve()
		cleanupGate.resolve()
		await pending
		await opened.shutdown()
		adapter.session = session
		adapter.createMany = createMany
		delete adapter.disconnect
	}
})

it.each([false, true])('keeps public Project admission closed throughout shared cleanup (first attempt fails: %s)', async (fail) => {
	const deps = createTestDependencies()
	const adapter = deps.storage.adapter
	const opened = requireSuccess(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const client = requireSuccess(await opened.setup())
	const portfolio = requireSuccess(client.as({ by: 'test' }))
	const project = requireSuccess(await portfolio.projects.create({ title: 'Before close', spec: { type: 'source-control' } }))
	const gate = Promise.withResolvers<void>()
	const entered = Promise.withResolvers<void>()
	let attempts = 0
	let reconnects = 0
	adapter.connect = () => {
		reconnects++
		return Promise.resolve()
	}
	adapter.disconnect = async () => {
		attempts++
		entered.resolve()
		await gate.promise
		if (fail && attempts === 1) throw new Error('synthetic-PROTECTED')
	}
	try {
		const first = client.shutdown()
		const second = opened.shutdown()
		expect(second).toBe(first)
		expect(client.as({ by: 'later' })).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await portfolio.projects.create({ title: 'After close', spec: { type: 'source-control' } })).toEqual({
			ok: false,
			error: { type: 'storage-operation-failed' },
		})
		expect(await portfolio.projects.find({ projectId: project.id })).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await portfolio.projects.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		await entered.promise
		expect(attempts).toBe(1)
		gate.resolve()
		const expected = fail ? { ok: false, error: { type: 'storage-operation-failed' } } : { ok: true, value: undefined }
		expect(await first).toEqual(expected)
		expect(await second).toEqual(expected)
		expect(await portfolio.projects.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		// A completed failed attempt retries only on this explicit call.
		expect(attempts).toBe(1)
		expect(await client.shutdown()).toEqual({ ok: true, value: undefined })
		expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		expect(attempts).toBe(fail ? 2 : 1)
		expect(reconnects).toBe(0)
		expect(client.as({ by: 'still-closed' })).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await portfolio.projects.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
	} finally {
		gate.resolve()
		await opened.shutdown()
		delete adapter.connect
		delete adapter.disconnect
	}
})

function dependencies(): CoreDependencies<InMemoryAdapter> {
	return {
		storage: { adapter: InMemoryAdapter.create({}), resolveSchema: (name) => ({ table: name }) },
		secrets: { encode: () => Promise.resolve(null), decode: () => Promise.resolve({}) },
	}
}

function success<T, E>(result: Result<T, E>): T {
	expect(result.ok).toBe(true)
	if (!result.ok) throw new Error('Expected success')
	return result.value
}

it('returns adapter-independent lifecycle views from precisely typed dependencies', async () => {
	const deps = dependencies()
	const opened: PortfolioSetup | PortfolioMigration | PortfolioClient = success(await PortfolioClient.new(deps))
	try {
		if (opened.state !== 'uninitialized') throw new Error('Expected setup')
		const ready: PortfolioClient = success(await opened.setup())
		expect(ready.state).toBe('ready')
		expect(await deps.storage.adapter.loadMigrations({ table: '_equipped_migrations' })).toHaveLength(1)
		expect(await ready.shutdown()).toEqual({ ok: true, value: undefined })
	} finally {
		success(await opened.shutdown())
	}
})

it('uses one resolved physical ledger for opening, locking, recording and reopening', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	deps.storage.resolveSchema = (name) => ({ table: `selected_${name}` })
	const repo = Repo.from(adapter).resolve(deps.storage.resolveSchema).build()
	const historyConfig = repo.resolveConfig('_equipped_migrations')
	const load = adapter.loadMigrations.bind(adapter)
	const record = adapter.recordMigration.bind(adapter)
	const lock = adapter.acquireMigrationLock.bind(adapter)
	const loads: Parameters<typeof adapter.loadMigrations>[0][] = []
	const records: Parameters<typeof adapter.recordMigration>[0][] = []
	const locks: Parameters<typeof adapter.acquireMigrationLock>[0][] = []
	adapter.loadMigrations = (config) => {
		loads.push(config)
		return load(config)
	}
	adapter.recordMigration = (config, id, at) => {
		records.push(config)
		return record(config, id, at)
	}
	adapter.acquireMigrationLock = (config, work) => {
		locks.push(config)
		return lock(config, work)
	}
	try {
		const opened = success(await PortfolioClient.new(deps))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected setup')
			const ready = success(await opened.setup())
			const portfolio = success(ready.as({ by: 'scoped-test' }))
			const project = success(await portfolio.projects.create({ title: 'Scoped', spec: { type: 'source-control' } }))
			expect(await portfolio.projects.find({ projectId: project.id })).toEqual({ ok: true, value: project })
			const ledger = await load(historyConfig)
			expect(ledger).toHaveLength(1)
			expect(records).toEqual([historyConfig])
			expect(locks).toEqual([historyConfig])
			expect(loads.length).toBeGreaterThan(0)
			for (const config of loads) expect(config).toEqual(historyConfig)
			expect(await load({ table: '_equipped_migrations' })).toEqual([])
			success(await ready.shutdown())
			const reopened = success(await PortfolioClient.new(deps))
			try {
				expect(reopened.state).toBe('ready')
				expect(await load(historyConfig)).toEqual(ledger)
				expect(records).toEqual([historyConfig])
			} finally {
				success(await reopened.shutdown())
			}
		} finally {
			success(await opened.shutdown())
		}
	} finally {
		adapter.loadMigrations = load
		adapter.recordMigration = record
		adapter.acquireMigrationLock = lock
	}
})

it.each(['left', 'right'] as const)('narrows the %s adapter before constructing its dependency pair', async (kind) => {
	class LeftAdapter extends InMemoryAdapter {
		readonly kind = 'left'
		override readonly schemaConfigPipe = v.object({ table: v.string(), scope: v.eq('left') }).pipe(({ table }) => ({ table }))
	}
	class RightAdapter extends InMemoryAdapter {
		readonly kind = 'right'
		override readonly schemaConfigPipe = v.object({ table: v.string(), scope: v.eq('right') }).pipe(({ table }) => ({ table }))
	}
	async function openSelected(adapter: LeftAdapter | RightAdapter) {
		const secrets = { encode: () => Promise.resolve(null), decode: () => Promise.resolve({}) }
		switch (adapter.kind) {
			case 'left': {
				const resolveSchema: CoreDependencies<LeftAdapter>['storage']['resolveSchema'] = (name) => ({
					table: name,
					scope: 'left',
				})
				return PortfolioClient.new({ storage: { adapter, resolveSchema }, secrets })
			}
			case 'right': {
				const resolveSchema: CoreDependencies<RightAdapter>['storage']['resolveSchema'] = (name) => ({
					table: name,
					scope: 'right',
				})
				return PortfolioClient.new({ storage: { adapter, resolveSchema }, secrets })
			}
			default:
				throw new Error('Unexpected adapter kind.')
		}
	}
	const adapter = kind === 'left' ? LeftAdapter.create({}) : RightAdapter.create({})
	const opened = success(await openSelected(adapter))
	try {
		if (opened.state !== 'uninitialized') throw new Error('Expected setup')
		const ready: PortfolioClient = success(await opened.setup())
		expect(ready.state).toBe('ready')
		expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toHaveLength(1)
	} finally {
		success(await opened.shutdown())
	}
})

it('refuses native session success without executing admitted setup', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const original = adapter.session.bind(adapter)
	Object.defineProperty(adapter, 'session', { configurable: true, value: () => Promise.resolve(undefined) })
	try {
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await adapter.introspect()).toEqual([])
		expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
	} finally {
		Object.defineProperty(adapter, 'session', { configurable: true, writable: true, value: original })
		success(await opened.shutdown())
	}
})

it.each(['skip', 'swallow'] as const)('refuses false inner-session success: %s', async (fault) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const sessionDescriptor = Object.getOwnPropertyDescriptor(adapter, 'session')
	const ddlDescriptor = Object.getOwnPropertyDescriptor(adapter, 'applyCreateTable')
	const session = adapter.session.bind(adapter)
	const ddl = adapter.applyCreateTable.bind(adapter)
	let sessions = 0
	let creates = 0
	Object.defineProperty(adapter, 'session', {
		configurable: true,
		value: async (work: () => Promise<unknown>) => {
			const invocation = ++sessions
			if (invocation === 2 && fault === 'skip') return undefined
			try {
				return await session(work)
			} catch (error) {
				if (invocation === 2 && fault === 'swallow') return undefined
				throw error
			}
		},
	})
	adapter.applyCreateTable = async (change) => {
		await ddl(change)
		if (++creates === 2) throw new Error('synthetic-PROTECTED')
	}
	try {
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(sessions).toBe(2)
		expect(creates).toBe(fault === 'skip' ? 0 : 2)
		expect(await adapter.introspect()).toEqual([])
		expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
		if (sessionDescriptor) Object.defineProperty(adapter, 'session', sessionDescriptor)
		else Reflect.deleteProperty(adapter, 'session')
		if (ddlDescriptor) Object.defineProperty(adapter, 'applyCreateTable', ddlDescriptor)
		else Reflect.deleteProperty(adapter, 'applyCreateTable')
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(opened.state).toBe('uninitialized')
	} finally {
		if (sessionDescriptor) Object.defineProperty(adapter, 'session', sessionDescriptor)
		else Reflect.deleteProperty(adapter, 'session')
		if (ddlDescriptor) Object.defineProperty(adapter, 'applyCreateTable', ddlDescriptor)
		else Reflect.deleteProperty(adapter, 'applyCreateTable')
		success(await opened.shutdown())
	}
})

it.each([
	['malformed', [{ id: 'synthetic-PROTECTED', appliedAt: 0 }]],
	['unknown', [{ id: '01k00000000000000000000001', appliedAt: 0 }]],
	['empty', []],
] as const)('aborts a resolved run with %s authoritative ledger output', async (_name, history) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const descriptor = Object.getOwnPropertyDescriptor(adapter, 'recordMigration')
	const record = adapter.recordMigration.bind(adapter)
	adapter.recordMigration = async (config) => {
		for (const { id, appliedAt } of history) await record(config, id, appliedAt)
	}
	try {
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await adapter.introspect()).toEqual([])
		expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
		if (descriptor) Object.defineProperty(adapter, 'recordMigration', descriptor)
		else Reflect.deleteProperty(adapter, 'recordMigration')
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
	} finally {
		if (descriptor) Object.defineProperty(adapter, 'recordMigration', descriptor)
		else Reflect.deleteProperty(adapter, 'recordMigration')
		success(await opened.shutdown())
	}
})

it('permits retry after a post-run ledger read fails and the outer session rolls back', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const descriptor = Object.getOwnPropertyDescriptor(adapter, 'loadMigrations')
	const load = adapter.loadMigrations.bind(adapter)
	adapter.loadMigrations = async (config) => {
		const history = await load(config)
		if (history.length > 0) throw new Error('synthetic-PROTECTED')
		return history
	}
	try {
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await adapter.introspect()).toEqual([])
		expect(await load({ table: '_equipped_migrations' })).toEqual([])
		if (descriptor) Object.defineProperty(adapter, 'loadMigrations', descriptor)
		else Reflect.deleteProperty(adapter, 'loadMigrations')
		expect(success(await opened.setup()).state).toBe('ready')
	} finally {
		if (descriptor) Object.defineProperty(adapter, 'loadMigrations', descriptor)
		else Reflect.deleteProperty(adapter, 'loadMigrations')
		success(await opened.shutdown())
	}
})

it('does not issue ready when a broken native session swallows the rollback signal', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	await adapter.recordMigration({ table: '_equipped_migrations' }, 'legacy-synthetic-PROTECTED', 0)
	const original = adapter.session.bind(adapter)
	// A narrowly scoped adapter fault; normal transactions still use native InMemory.
	Object.defineProperty(adapter, 'session', {
		configurable: true,
		value: async (work: () => Promise<unknown>) => {
			try {
				return await original(work)
			} catch {
				return undefined
			}
		},
	})
	try {
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		Object.defineProperty(adapter, 'session', { configurable: true, writable: true, value: original })
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
	} finally {
		Object.defineProperty(adapter, 'session', { configurable: true, writable: true, value: original })
		success(await opened.shutdown())
	}
})

it.each([null, undefined, 'synthetic-PROTECTED', {}, { storage: null }])(
	'rejects malformed dependency shapes safely: %s',
	async (input) => {
		const result: unknown = await Reflect.apply(PortfolioClient.new.bind(PortfolioClient), PortfolioClient, [input])
		expect(result).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
		expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
	},
)

it('rejects a nonfunction resolver without calling startup or codecs', async () => {
	const deps = dependencies()
	const calls: string[] = []
	deps.storage.adapter.connect = () => {
		calls.push('connect')
		return Promise.resolve()
	}
	try {
		const result: unknown = await Reflect.apply(PortfolioClient.new.bind(PortfolioClient), PortfolioClient, [
			{ ...deps, storage: { ...deps.storage, resolveSchema: 'synthetic-PROTECTED' } },
		])
		expect(result).toEqual({
			ok: false,
			error: { type: 'invalid-input', issues: [{ path: 'storage.resolveSchema', message: 'Expected a function.' }] },
		})
		expect(calls).toEqual([])
	} finally {
		delete deps.storage.adapter.connect
	}
})

it.each([
	['storage', 'resolveSchema'],
	['secrets', 'encode'],
	['secrets', 'decode'],
] as const)('rejects a callable PipeError at %s.%s without exposing supplied issues', async (container, key) => {
	const deps = dependencies()
	const calls: string[] = []
	const injected = Object.assign(() => calls.push('injected'), {
		messages: [{ path: 'synthetic-PROTECTED', message: 'synthetic-PROTECTED' }],
	})
	Object.setPrototypeOf(injected, PipeError.prototype)
	deps.storage.resolveSchema = (name) => {
		calls.push('resolve')
		return { table: name }
	}
	deps.secrets.encode = () => {
		calls.push('encode')
		return Promise.resolve(null)
	}
	deps.secrets.decode = () => {
		calls.push('decode')
		return Promise.resolve({})
	}
	deps.storage.adapter.connect = () => {
		calls.push('connect')
		return Promise.resolve()
	}
	const input = { ...deps, [container]: { ...deps[container], [key]: injected } }
	try {
		const result: unknown = await Reflect.apply(PortfolioClient.new.bind(PortfolioClient), PortfolioClient, [input])
		expect(result).toEqual({
			ok: false,
			error: { type: 'invalid-input', issues: [{ path: `${container}.${key}`, message: 'Expected a function.' }] },
		})
		expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
		expect(calls).toEqual([])
	} finally {
		delete deps.storage.adapter.connect
	}
})

it('does not require unused delete, raw or aggregate capabilities', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const methods = ['deleteMany', 'deleteByPk', 'raw', 'aggregate'] as const
	const descriptors = methods.map((name) => [name, Object.getOwnPropertyDescriptor(adapter, name)] as const)
	for (const method of methods) Object.defineProperty(adapter, method, { configurable: true, value: undefined })
	try {
		const opened = success(await PortfolioClient.new(deps))
		if (opened.state !== 'uninitialized') throw new Error('Expected setup')
		expect(success(await opened.setup()).state).toBe('ready')
		success(await opened.shutdown())
	} finally {
		for (const [name, descriptor] of descriptors) {
			if (descriptor) Object.defineProperty(adapter, name, descriptor)
			else Reflect.deleteProperty(adapter, name)
		}
	}
})

it('resolves native history and DDL names without preflighting codecs during opening or setup', async () => {
	const deps = dependencies()
	const calls: string[] = []
	deps.storage.resolveSchema = (name) => {
		calls.push(name)
		return { table: name }
	}
	deps.secrets.encode = () => {
		calls.push('encode')
		return Promise.reject(new Error('synthetic-PROTECTED'))
	}
	deps.secrets.decode = () => {
		calls.push('decode')
		return Promise.reject(new Error('synthetic-PROTECTED'))
	}
	const opened = success(await PortfolioClient.new(deps))
	try {
		expect(calls).toEqual(['_equipped_migrations'])
		if (opened.state !== 'uninitialized') throw new Error('Expected setup')
		success(await opened.setup())
		expect(calls).toEqual([
			'_equipped_migrations',
			'_equipped_migrations',
			'_equipped_migrations',
			'secrets',
			'projects',
			'assets',
			'memories',
			'memory_revisions',
			'_equipped_migrations',
		])
	} finally {
		success(await opened.shutdown())
	}
})

it('validates raw malformed adapter history and inspection outputs without leaking them', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const load = adapter.loadMigrations.bind(adapter)
	const inspect = adapter.introspect.bind(adapter)
	try {
		Object.defineProperty(adapter, 'loadMigrations', {
			configurable: true,
			value: () => Promise.resolve({ protected: 'synthetic-PROTECTED' }),
		})
		expect(await PortfolioClient.new(deps)).toEqual({ ok: false, error: { type: 'schema-metadata-invalid' } })
		Object.defineProperty(adapter, 'loadMigrations', { configurable: true, writable: true, value: load })
		Object.defineProperty(adapter, 'introspect', {
			configurable: true,
			value: () => Promise.resolve({ length: 0, protected: 'synthetic-PROTECTED' }),
		})
		expect(await PortfolioClient.new(deps)).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
	} finally {
		Object.defineProperty(adapter, 'loadMigrations', { configurable: true, writable: true, value: load })
		Object.defineProperty(adapter, 'introspect', { configurable: true, writable: true, value: inspect })
	}
})

it('returns a safe error for hostile dependency getters without invoking callbacks', async () => {
	const input = {
		get storage() {
			throw new Error('synthetic-PROTECTED')
		},
	}
	await expect(Reflect.apply(PortfolioClient.new.bind(PortfolioClient), PortfolioClient, [input])).resolves.toEqual({
		ok: false,
		error: { type: 'internal-error' },
	})
})

it.each([
	'use',
	'session',
	'findByPk',
	'findMany',
	'createMany',
	'updateByPk',
	'updateMany',
	'loadMigrations',
	'recordMigration',
	'introspect',
	'acquireMigrationLock',
	'applyCreateTable',
	'connect',
	'disconnect',
] as const)('rejects a nonfunction native %s without any startup calls', async (method) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const original = Object.getOwnPropertyDescriptor(adapter, method)
	const connect = Object.getOwnPropertyDescriptor(adapter, 'connect')
	let calls = 0
	adapter.connect = () => {
		calls++
		return Promise.resolve()
	}
	Object.defineProperty(adapter, method, { configurable: true, value: 'synthetic-PROTECTED' })
	try {
		const result = await PortfolioClient.new(deps)
		expect(result).toEqual({
			ok: false,
			error: {
				type: 'invalid-input',
				issues: [{ path: 'storage.adapter', message: 'Expected a supported native storage adapter.' }],
			},
		})
		expect(calls).toBe(0)
	} finally {
		if (original) Object.defineProperty(adapter, method, original)
		else Reflect.deleteProperty(adapter, method)
		if (connect) Object.defineProperty(adapter, 'connect', connect)
		else delete adapter.connect
	}
})

it.each([
	['missing', undefined],
	['empty', []],
	['null', null],
	['nonarray', 'string'],
	['array-like', { 0: 'string', length: 1 }],
	['unknown name', ['synthetic-PROTECTED']],
	['nonstring name', [42]],
	['boxed name', [Object('string')]],
	['spoofed name', [{ constructor: { name: 'String' }, value: 'string' }]],
	['sparse array', new Array<unknown>(1)],
	['malformed tail', ['string', 'number', 'object', null]],
])('rejects a %s field capability declaration before startup', async (_name, declaration) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const original = Object.getOwnPropertyDescriptor(adapter, 'supportedFieldTypes')
	const calls: string[] = []
	adapter.connect = () => {
		calls.push('connect')
		return Promise.resolve()
	}
	adapter.disconnect = () => {
		calls.push('disconnect')
		return Promise.resolve()
	}
	Object.defineProperty(adapter, 'supportedFieldTypes', { configurable: true, value: declaration })
	try {
		const result = await PortfolioClient.new(deps)
		if (result.ok) await result.value.shutdown()
		expect(result).toEqual({
			ok: false,
			error: {
				type: 'invalid-input',
				issues: [{ path: 'storage.adapter', message: 'Expected a supported native storage adapter.' }],
			},
		})
		expect(calls).toEqual([])
	} finally {
		if (original) Object.defineProperty(adapter, 'supportedFieldTypes', original)
		else Reflect.deleteProperty(adapter, 'supportedFieldTypes')
		delete adapter.connect
		delete adapter.disconnect
	}
})

it.each([
	['minimal', ['string', 'number', 'object']],
	['reordered', ['object', 'number', 'string']],
])('opens with a %s field declaration without rewriting it', async (_name, types) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const original = Object.getOwnPropertyDescriptor(adapter, 'supportedFieldTypes')
	const declaration = Object.freeze(types)
	Object.defineProperty(adapter, 'supportedFieldTypes', { configurable: true, value: declaration })
	try {
		const opened = success(await PortfolioClient.new(deps))
		try {
			expect(adapter.supportedFieldTypes).toBe(declaration)
			if (opened.state !== 'uninitialized') throw new Error('Expected setup')
			expect(success(await opened.setup()).state).toBe('ready')
			expect(adapter.supportedFieldTypes).toBe(declaration)
		} finally {
			success(await opened.shutdown())
		}
	} finally {
		if (original) Object.defineProperty(adapter, 'supportedFieldTypes', original)
		else Reflect.deleteProperty(adapter, 'supportedFieldTypes')
	}
})

it.each(['encode', 'decode'] as const)('requires %s even for setup-only opening', async (method) => {
	const deps = dependencies()
	let calls = 0
	deps.storage.adapter.connect = () => {
		calls++
		return Promise.resolve()
	}
	try {
		const result: unknown = await Reflect.apply(PortfolioClient.new.bind(PortfolioClient), PortfolioClient, [
			{ ...deps, secrets: { ...deps.secrets, [method]: undefined } },
		])
		expect(result).toEqual({
			ok: false,
			error: { type: 'invalid-input', issues: [{ path: `secrets.${method}`, message: 'Expected a function.' }] },
		})
		expect(calls).toBe(0)
	} finally {
		delete deps.storage.adapter.connect
	}
})

it('strips undeclared dependency fields without evaluating them or losing the native adapter', async () => {
	const deps = dependencies()
	let startups = 0
	deps.storage.adapter.connect = function () {
		expect(this).toBe(deps.storage.adapter)
		startups++
		return Promise.resolve()
	}
	const input = {
		...deps,
		storage: { ...deps.storage, unused: 'synthetic-PROTECTED' },
		secrets: { ...deps.secrets, unused: 'synthetic-PROTECTED' },
		ignored: 'synthetic-PROTECTED',
	}
	try {
		const opened = success(await PortfolioClient.new(input))
		if (opened.state !== 'uninitialized') throw new Error('Expected setup')
		const client = success(await opened.setup())
		expect(Object.keys(client)).toEqual(['state'])
		expect(Object.keys(opened)).toEqual(['state'])
		expect(input.storage.unused).toBe('synthetic-PROTECTED')
		expect(startups).toBe(1)
		success(await opened.shutdown())
	} finally {
		delete deps.storage.adapter.connect
	}
})

it('refuses a table added after factory classification before running setup', async () => {
	const deps = dependencies()
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	await deps.storage.adapter.applyCreateTable({ kind: 'createTable', name: 'external', pk: { name: 'id', type: 'string' }, fields: [] })
	try {
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-not-empty' } })
		expect(await deps.storage.adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
	} finally {
		success(await opened.shutdown())
	}
})

it.each(['wrapped', 'replaced'] as const)('handles %s setup rollback without losing safe history failures', async (mode) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	await adapter.recordMigration({ table: '_equipped_migrations' }, 'legacy-synthetic-PROTECTED', 0)
	const original = adapter.session.bind(adapter)
	const session = original
	adapter.session = async function (work) {
		try {
			return await session(work)
		} catch (error) {
			throw mode === 'wrapped'
				? new EquippedError('synthetic-PROTECTED', { operation: 'session' }, error)
				: new Error('synthetic-PROTECTED')
		}
	}
	try {
		expect(await opened.setup()).toEqual({
			ok: false,
			error: { type: mode === 'wrapped' ? 'schema-metadata-invalid' : 'storage-operation-failed' },
		})
		adapter.session = original
		expect(await opened.setup()).toEqual({
			ok: false,
			error: { type: mode === 'wrapped' ? 'schema-metadata-invalid' : 'storage-operation-failed' },
		})
	} finally {
		adapter.session = original
		success(await opened.shutdown())
	}
})

it.each([
	['legacy-synthetic-PROTECTED', 0, 'schema-metadata-invalid'],
	['01k00000000000000000000001', 0, 'schema-version-unrecognized'],
	['01m76d124c6e848k2hfvb4mar2', -1, 'schema-metadata-invalid'],
] as const)('validates history %s before factory/setup state refusals', async (id, at, type) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	await adapter.applyCreateTable({ kind: 'createTable', name: 'existing', pk: { name: 'id', type: 'string' }, fields: [] })
	await adapter.recordMigration({ table: '_equipped_migrations' }, id, at)
	const before = await adapter.introspect()
	try {
		expect(await opened.setup()).toEqual({ ok: false, error: { type } })
		expect(await PortfolioClient.new(deps)).toEqual({ ok: false, error: { type } })
		expect(await adapter.introspect()).toEqual(before)
		expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([{ id, appliedAt: at }])
	} finally {
		success(await opened.shutdown())
	}
})

it('refuses CRUD-created storage with no migration metadata', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const schema = Schema.from('existing')
		.pk('id', v.string(), () => 'test')
		.field('value', v.string())
		.build()
	const repo = Repo.from(adapter)
		.resolve((name) => ({ table: name }))
		.build()
	await repo.on(schema).one().create({ value: 'synthetic-PROTECTED' })
	expect(await PortfolioClient.new(deps)).toEqual({ ok: false, error: { type: 'storage-not-empty' } })
	expect(await repo.on(schema).all().find()).toEqual([{ id: 'test', value: 'synthetic-PROTECTED' }])
	expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
})

it('gives failed factory cleanup precedence over a history failure', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	await adapter.recordMigration({ table: '_equipped_migrations' }, 'legacy-synthetic-PROTECTED', 0)
	let cleaned = 0
	adapter.disconnect = () => {
		cleaned++
		return Promise.reject(new Error('synthetic-PROTECTED'))
	}
	try {
		expect(await PortfolioClient.new(deps)).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(cleaned).toBe(1)
	} finally {
		delete adapter.disconnect
	}
})

it('cleans up unexpected native construction exceptions as internal errors', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const pipe = adapter.schemaConfigPipe
	let connects = 0
	let disconnects = 0
	adapter.connect = () => {
		connects++
		Object.defineProperty(adapter, 'schemaConfigPipe', {
			configurable: true,
			get() {
				throw new Error('synthetic-PROTECTED')
			},
		})
		return Promise.resolve()
	}
	adapter.disconnect = () => {
		disconnects++
		return Promise.resolve()
	}
	try {
		await expect(PortfolioClient.new(deps)).resolves.toEqual({ ok: false, error: { type: 'internal-error' } })
		expect(connects).toBe(1)
		expect(disconnects).toBe(1)
	} finally {
		Object.defineProperty(adapter, 'schemaConfigPipe', { configurable: true, value: pipe })
		delete adapter.connect
		delete adapter.disconnect
	}
})

it.each(['loadMigrations', 'introspect', 'acquireMigrationLock', 'recordMigration', 'session'] as const)(
	'returns safe setup %s failures and permits retry after rollback',
	async (method) => {
		const deps = dependencies()
		const adapter = deps.storage.adapter
		const opened = success(await PortfolioClient.new(deps))
		if (opened.state !== 'uninitialized') throw new Error('Expected setup')
		const original = adapter[method]
		Object.defineProperty(adapter, method, {
			configurable: true,
			value: () => Promise.reject(new Error('synthetic-PROTECTED')),
		})
		try {
			await expect(opened.setup()).resolves.toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			Object.defineProperty(adapter, method, { configurable: true, writable: true, value: original })
			expect(await adapter.introspect()).toEqual([])
			expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
			expect(success(await opened.setup()).state).toBe('ready')
		} finally {
			Object.defineProperty(adapter, method, { configurable: true, writable: true, value: original })
			success(await opened.shutdown())
		}
	},
)

it('keeps native builder validation authoritative and cleans a construction failure', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	let cleaned = false
	adapter.disconnect = () => {
		cleaned = true
		return Promise.resolve()
	}
	const types = adapter.supportedFieldTypes
	Object.defineProperty(adapter, 'supportedFieldTypes', { configurable: true, value: ['string'] })
	try {
		await expect(PortfolioClient.new(deps)).resolves.toEqual({ ok: false, error: { type: 'internal-error' } })
		expect(cleaned).toBe(true)
		expect(await adapter.introspect()).toEqual([])
	} finally {
		Object.defineProperty(adapter, 'supportedFieldTypes', { configurable: true, value: types })
		delete adapter.disconnect
	}
})

it('rolls back setup DDL and history when a native create-table call fails', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const original = adapter.applyCreateTable.bind(adapter)
	let calls = 0
	adapter.applyCreateTable = async function (change) {
		await original.call(this, change)
		if (++calls === 2) throw new Error('synthetic-PROTECTED')
	}
	try {
		await expect(opened.setup()).resolves.toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await adapter.introspect()).toEqual([])
		expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
		adapter.applyCreateTable = original
		expect(success(await opened.setup()).state).toBe('ready')
	} finally {
		adapter.applyCreateTable = original
		success(await opened.shutdown())
	}
})

it('drains admitted setup before disconnecting and retries only failed cleanup', async () => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const entered = Promise.withResolvers<void>()
	const gate = Promise.withResolvers<void>()
	const original = adapter.applyCreateTable.bind(adapter)
	adapter.applyCreateTable = async function (change) {
		entered.resolve()
		await gate.promise
		await original.call(this, change)
	}
	let cleanup = 0
	adapter.disconnect = () => {
		cleanup++
		return cleanup === 1 ? Promise.reject(new Error('synthetic-PROTECTED')) : Promise.resolve()
	}
	try {
		const setup = opened.setup()
		await entered.promise
		const closing = opened.shutdown()
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(cleanup).toBe(0)
		gate.resolve()
		const client = success(await setup)
		expect(await closing).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		success(await client.shutdown())
		success(await opened.shutdown())
		expect(cleanup).toBe(2)
	} finally {
		gate.resolve()
		adapter.applyCreateTable = original
		delete adapter.disconnect
	}
})

it('joins shared cleanup and closes setup admission synchronously', async () => {
	const deps = dependencies()
	const opened = success(await PortfolioClient.new(deps))
	if (opened.state !== 'uninitialized') throw new Error('Expected setup')
	const ready = success(await opened.setup())
	const gate = Promise.withResolvers<void>()
	let attempts = 0
	deps.storage.adapter.disconnect = async () => {
		attempts++
		await gate.promise
	}
	try {
		const first = opened.shutdown()
		const second = ready.shutdown()
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		gate.resolve()
		expect(await Promise.all([first, second])).toEqual([
			{ ok: true, value: undefined },
			{ ok: true, value: undefined },
		])
		success(await ready.shutdown())
		expect(attempts).toBe(1)
	} finally {
		gate.resolve()
		delete deps.storage.adapter.disconnect
	}
})

it.each(['loadMigrations', 'introspect'] as const)('cleans up a factory %s failure', async (method) => {
	const deps = dependencies()
	const adapter = deps.storage.adapter
	const original = adapter[method]
	let cleaned = false
	adapter.disconnect = () => {
		cleaned = true
		return Promise.resolve()
	}
	Object.defineProperty(adapter, method, {
		configurable: true,
		value: () => Promise.reject(new Error('synthetic-PROTECTED')),
	})
	try {
		await expect(PortfolioClient.new(deps)).resolves.toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		expect(cleaned).toBe(true)
	} finally {
		Object.defineProperty(adapter, method, { configurable: true, writable: true, value: original })
		delete adapter.disconnect
	}
})

it('awaits cleanup after failed startup without exposing the exception', async () => {
	const deps = dependencies()
	const calls: string[] = []
	const gate = Promise.withResolvers<void>()
	deps.storage.adapter.connect = () => {
		calls.push('connect')
		return Promise.reject(new Error('synthetic-PROTECTED'))
	}
	deps.storage.adapter.disconnect = async () => {
		calls.push('disconnect')
		await gate.promise
	}
	try {
		let settled = false
		const pending = PortfolioClient.new(deps).then(
			(result) => {
				settled = true
				return result
			},
			(error: unknown) => {
				settled = true
				return error
			},
		)
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(calls).toEqual(['connect', 'disconnect'])
		expect(settled).toBe(false)
		gate.resolve()
		expect(await pending).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
	} finally {
		gate.resolve()
		delete deps.storage.adapter.connect
		delete deps.storage.adapter.disconnect
	}
})

it('opens current native history as ready without applying migrations', async () => {
	const deps = dependencies()
	const setup = success(await PortfolioClient.new(deps))
	if (setup.state !== 'uninitialized') throw new Error('Expected setup')
	success(await setup.setup())
	success(await setup.shutdown())
	const history = await deps.storage.adapter.loadMigrations({ table: '_equipped_migrations' })
	const reopened = success(await PortfolioClient.new(deps))
	try {
		expect(reopened.state).toBe('ready')
		expect(await deps.storage.adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual(history)
	} finally {
		success(await reopened.shutdown())
	}
})

it('explicit setup commits the full catalog and returns a fresh ready view', async () => {
	const deps = dependencies()
	const opened = success(await PortfolioClient.new(deps))
	try {
		if (opened.state !== 'uninitialized') throw new Error('Expected setup')
		const client = success(await opened.setup())
		expect(client.state).toBe('ready')
		expect(client).not.toBe(opened)
		expect(opened.state).toBe('uninitialized')
		expect((await deps.storage.adapter.introspect()).map(({ name }) => name).sort()).toEqual([
			'assets',
			'memories',
			'memory_revisions',
			'projects',
			'secrets',
		])
		expect((await deps.storage.adapter.loadMigrations({ table: '_equipped_migrations' })).map(({ id }) => id)).toEqual([
			'01m76d124c6e848k2hfvb4mar2',
		])
		expect(await opened.setup()).toEqual({ ok: false, error: { type: 'storage-already-initialized' } })
	} finally {
		success(await opened.shutdown())
	}
})

it('refuses a metadata-only application table instead of treating no rows as empty', async () => {
	const deps = dependencies()
	await deps.storage.adapter.applyCreateTable({ kind: 'createTable', name: 'existing', pk: { name: 'id', type: 'string' }, fields: [] })
	expect(await PortfolioClient.new(deps)).toEqual({ ok: false, error: { type: 'storage-not-empty' } })
	expect((await deps.storage.adapter.introspect()).map(({ name }) => name)).toEqual(['existing'])
	expect(await deps.storage.adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
})

it('requires both codecs and supported native methods before startup', async () => {
	const deps = dependencies()
	const calls: string[] = []
	deps.storage.adapter.connect = () => {
		calls.push('connect')
		return Promise.resolve()
	}
	deps.storage.adapter.disconnect = () => {
		calls.push('disconnect')
		return Promise.resolve()
	}
	try {
		const result: unknown = await Reflect.apply(PortfolioClient.new.bind(PortfolioClient), PortfolioClient, [
			{ ...deps, secrets: { encode: deps.secrets.encode, decode: 'synthetic-PROTECTED' } },
		])
		expect(result).toEqual({
			ok: false,
			error: { type: 'invalid-input', issues: [{ path: 'secrets.decode', message: 'Expected a function.' }] },
		})
		expect(calls).toEqual([])
	} finally {
		delete deps.storage.adapter.connect
		delete deps.storage.adapter.disconnect
	}
})

it('opens fresh storage without application tables, migration writes or codec calls', async () => {
	const adapter = InMemoryAdapter.create({})
	const calls: string[] = []
	const result = await PortfolioClient.new({
		storage: { adapter, resolveSchema: (name) => ({ table: name }) },
		secrets: {
			encode: () => {
				calls.push('encode')
				return Promise.resolve(null)
			},
			decode: () => {
				calls.push('decode')
				return Promise.resolve({})
			},
		},
	})
	expect(result).toMatchObject({ ok: true, value: { state: 'uninitialized' } })
	expect(await adapter.introspect()).toEqual([])
	expect(await adapter.loadMigrations({ table: '_equipped_migrations' })).toEqual([])
	expect(calls).toEqual([])
	if (result.ok) expect(await result.value.shutdown()).toEqual({ ok: true, value: undefined })
})
