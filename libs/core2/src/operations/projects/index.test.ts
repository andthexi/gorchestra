import { describe, expect, it } from 'vitest'

import { PortfolioClient } from '../../index'
import { createTestDependencies, requireSuccess, withReadyPortfolio } from '../../testing/fixtures'

describe('projects', () => {
	it('rolls back a malformed native create result as invalid-output', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const original = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			try {
				adapter.createMany = async (...args) => (await original(...args)).map((row) => ({ ...row, title: null }))
				expect(await portfolio.projects.create({ title: 'Uncommitted', spec: { type: 'source-control' } })).toEqual({
					ok: false,
					error: { type: 'invalid-output' },
				})
				expect(requireSuccess(await portfolio.projects.list())).toEqual([])
			} finally {
				adapter.createMany = original
			}
		}, dependencies)
	})
	it('strips extra input and creates exactly one row without implicit children or codec calls', async () => {
		const dependencies = createTestDependencies()
		dependencies.secrets.encode = () => {
			throw new Error('Projects must not encode')
		}
		dependencies.secrets.decode = () => {
			throw new Error('Projects must not decode')
		}
		const adapter = dependencies.storage.adapter
		const original = adapter.createMany.bind(adapter)
		const descriptor = Object.getOwnPropertyDescriptor(adapter, 'createMany')
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const portfolio = requireSuccess(requireSuccess(await opened.setup()).as({ by: '  ', cid: '' }))
			const writes: Array<Record<string, unknown>[]> = []
			adapter.createMany = (schema, config, data) => {
				writes.push(data)
				return original(schema, config, data)
			}
			const input = {
				title: '  Example  ',
				spec: { type: 'source-control' as const, ignored: true },
				id: 'caller-owned',
				created: { by: 'forged' },
				updated: true,
				type: 'legacy',
			}
			const before = Date.now()
			const project = requireSuccess(await portfolio.projects.create(input))
			const after = Date.now()
			expect(writes).toEqual([[project]])
			expect(project.id).toMatch(/^[0-7][0-9a-hjkmnp-tv-z]{25}$/)
			expect(Date.parse(project.created.at)).toBeGreaterThanOrEqual(before)
			expect(Date.parse(project.created.at)).toBeLessThanOrEqual(after)
			expect(new Date(project.created.at).toISOString()).toBe(project.created.at)
			expect(project.created).toMatchObject({ src: 'local', by: '  ', cid: '' })
			expect(Object.keys(project).sort()).toEqual(['created', 'id', 'spec', 'title'])
			expect(project.title).toBe('Example')
			expect(project.spec).toEqual({ type: 'source-control' })
			expect(input.title).toBe('  Example  ')
			expect(input.spec.ignored).toBe(true)
			for (const table of ['assets', 'secrets', 'memories', 'memory_revisions']) expect(adapter.stores.get(table)?.size ?? 0).toBe(0)
			expect(requireSuccess(await portfolio.projects.list())).toEqual([project])
		} finally {
			if (descriptor) Object.defineProperty(adapter, 'createMany', descriptor)
			else Reflect.deleteProperty(adapter, 'createMany')
			requireSuccess(await opened.shutdown())
		}
	})
	it('rejects malformed public IDs and blank titles without native sessions', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		const original = adapter.session.bind(adapter)
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const portfolio = requireSuccess(requireSuccess(await opened.setup()).as({ by: '' }))
			adapter.session = () => {
				throw new Error('Invalid input must not enter a session')
			}
			for (const projectId of ['01K00000000000000000000001', ' 01k00000000000000000000001', '8zzzzzzzzzzzzzzzzzzzzzzzzz'])
				expect(await portfolio.projects.find({ projectId })).toEqual({
					ok: false,
					error: { type: 'invalid-input', issues: [{ path: 'projectId', message: 'Expected a Core id.' }] },
				})
			expect(await portfolio.projects.create({ title: ' \n', spec: { type: 'source-control' } })).toMatchObject({
				ok: false,
				error: { type: 'invalid-input' },
			})
		} finally {
			adapter.session = original
			requireSuccess(await opened.shutdown())
		}
	})
	it('lists every validated Project by ID rather than storage insertion order', async () => {
		const dependencies = createTestDependencies()
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const portfolio = requireSuccess(requireSuccess(await opened.setup()).as({ by: '' }))
			const project = requireSuccess(await portfolio.projects.create({ title: 'Template', spec: { type: 'source-control' } }))
			const rows = dependencies.storage.adapter.stores.get('projects')
			if (!rows) throw new Error('Expected stored Projects')
			rows.clear()
			const expected = Array.from({ length: 125 }, (_, index) => ({ ...project, id: `01k${index.toString().padStart(23, '0')}` }))
			for (const row of [...expected].reverse()) rows.set(row.id, row)
			expect(requireSuccess(await portfolio.projects.list())).toEqual(expected)
		} finally {
			requireSuccess(await opened.shutdown())
		}
	})
	it('marks failed native reads as storage failures without closing admission', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const original = adapter.findMany.bind(adapter)
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const portfolio = requireSuccess(requireSuccess(await opened.setup()).as({ by: '' }))
			adapter.findMany = () => Promise.reject(new Error('synthetic-PROTECTED-read'))
			expect(await portfolio.projects.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			expect(await portfolio.projects.find({ projectId: '01k00000000000000000000001' })).toEqual({
				ok: false,
				error: { type: 'storage-operation-failed' },
			})
			adapter.findMany = original
			expect(requireSuccess(await portfolio.projects.list())).toEqual([])
		} finally {
			adapter.findMany = original
			requireSuccess(await opened.shutdown())
		}
	})
	it('marks native write failure at I/O and rolls back the write', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const original = adapter.createMany.bind(adapter)
		await withReadyPortfolio(async (portfolio) => {
			try {
				adapter.createMany = async (...args) => {
					await original.apply(adapter, args)
					throw new Error('synthetic-PROTECTED-write')
				}
				expect(await portfolio.projects.create({ title: 'Lost write', spec: { type: 'source-control' } })).toEqual({
					ok: false,
					error: { type: 'storage-operation-failed' },
				})
				expect(requireSuccess(await portfolio.projects.list())).toEqual([])
			} finally {
				adapter.createMany = original
			}
		}, dependencies)
	})
	it('distinguishes malformed stored Projects from missing records and final output', async () => {
		const dependencies = createTestDependencies()
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const client = requireSuccess(await opened.setup())
			const portfolio = requireSuccess(client.as({ by: '' }))
			const project = requireSuccess(await portfolio.projects.create({ title: 'Corrupt', spec: { type: 'source-control' } }))
			requireSuccess(await portfolio.projects.create({ title: 'Valid sibling', spec: { type: 'source-control' } }))
			const rows = dependencies.storage.adapter.stores.get('projects')
			if (!rows) throw new Error('Expected stored Projects')
			rows.set(project.id, { ...project, created: { src: 'local', by: '', at: project.created.at } })
			expect(await portfolio.projects.find({ projectId: project.id })).toEqual({
				ok: false,
				error: { type: 'invalid-storage-output' },
			})
			expect(await portfolio.projects.list()).toEqual({ ok: false, error: { type: 'invalid-storage-output' } })
		} finally {
			requireSuccess(await opened.shutdown())
		}
	})
	it('reports a missing Project without closing admission', async () => {
		await withReadyPortfolio(async (portfolio) => {
			const projectId = '01k00000000000000000000001'
			expect(await portfolio.projects.find({ projectId })).toEqual({
				ok: false,
				error: { type: 'not-found', resource: 'project', id: projectId },
			})
			expect(requireSuccess(await portfolio.projects.list())).toEqual([])
		})
	})
	it('creates and reads the trimmed Project', async () => {
		await withReadyPortfolio(async (portfolio) => {
			const project = requireSuccess(await portfolio.projects.create({ title: '  Example  ', spec: { type: 'source-control' } }))
			expect(project.title).toBe('Example')
			expect(project.spec).toEqual({ type: 'source-control' })
			expect(project.created).toMatchObject({ src: 'local', by: 'test-author', cid: 'test-call' })
			expect(requireSuccess(await portfolio.projects.find({ projectId: project.id }))).toEqual(project)
			expect(requireSuccess(await portfolio.projects.list())).toEqual([project])
		})
	})
})
