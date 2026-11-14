import { describe, expect, it, vi } from 'vitest'

import { PortfolioClient } from '../index'
import { createTestDependencies, requireSuccess, withReadyPortfolio } from '../testing/fixtures'

describe('attributed Portfolio', () => {
	it('keeps detached domain methods bound without exposing lifecycle controls or placeholder namespaces', async () => {
		await withReadyPortfolio(async (portfolio) => {
			const { create, find, list } = portfolio.projects
			const project = requireSuccess(await create({ title: 'Detached', spec: { type: 'source-control' } }))
			expect(requireSuccess(await find({ projectId: project.id }))).toEqual(project)
			expect(requireSuccess(await list())).toEqual([project])
			expect(Object.keys(portfolio)).toEqual(['projects', 'secrets', 'memories'])
			expect(Object.keys(portfolio.projects).sort()).toEqual(['assets', 'create', 'find', 'list'])
			expect(Object.keys(portfolio.projects.assets).sort()).toEqual(['create', 'find', 'list'])
			for (const key of ['as', 'shutdown', 'setup', 'migrate']) expect(portfolio).not.toHaveProperty(key)
			expect(Object.keys(portfolio.secrets).sort()).toEqual(['create', 'find', 'list', 'updateValue', 'usages'])
			expect(Object.keys(portfolio.memories).sort()).toEqual(['create', 'find', 'list', 'revisions'])
			expect(Object.keys(portfolio.memories.revisions).sort()).toEqual(['create', 'find', 'list'])
			expect(Object.isFrozen(portfolio)).toBe(false)
			expect(Object.isFrozen(portfolio.projects)).toBe(false)
		})
	})
	it('copies distinct exact attribution synchronously without storage I/O', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		const session = adapter.session.bind(adapter)
		const history = adapter.loadMigrations.bind(adapter)
		const inspect = adapter.introspect.bind(adapter)
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const client = requireSuccess(await opened.setup())
			adapter.session = () => {
				throw new Error('Binding must not enter a session')
			}
			adapter.loadMigrations = () => {
				throw new Error('Binding must not load history')
			}
			adapter.introspect = () => {
				throw new Error('Binding must not inspect storage')
			}
			const input = { by: '  author É\n', cid: '  correlation\n', ignored: true }
			const first = client.as(input)
			expect(first).not.toBeInstanceOf(Promise)
			const portfolio = requireSuccess(first)
			const other = requireSuccess(client.as({ by: '' }))
			input.by = 'Changed'
			input.cid = 'Changed'
			adapter.session = session
			const a = requireSuccess(await portfolio.projects.create({ title: 'A', spec: { type: 'source-control' } }))
			const b = requireSuccess(await other.projects.create({ title: 'B', spec: { type: 'source-control' } }))
			expect(a.created).toMatchObject({ by: '  author É\n', cid: '  correlation\n' })
			expect(b.created).toMatchObject({ by: '', cid: null })
			expect(a.id).not.toBe(b.id)
			expect(requireSuccess(await other.projects.find({ projectId: a.id }))).toEqual(a)
			expect(requireSuccess(await other.projects.list())).toHaveLength(2)
		} finally {
			adapter.session = session
			adapter.loadMigrations = history
			adapter.introspect = inspect
			requireSuccess(await opened.shutdown())
		}
	})
	it('does not read migration history or inspect storage during ordinary Project and Memory operations', async () => {
		const dependencies = createTestDependencies()
		await withReadyPortfolio(async (portfolio) => {
			const history = vi.spyOn(dependencies.storage.adapter, 'loadMigrations')
			const inspect = vi.spyOn(dependencies.storage.adapter, 'introspect')
			try {
				const project = requireSuccess(
					await portfolio.projects.create({ title: 'Project', spec: { type: 'source-control' } }),
				)
				const { memory } = requireSuccess(
					await portfolio.memories.create({ parentId: null, title: 'Memory', body: '' }),
				)
				expect(requireSuccess(await portfolio.projects.list())).toEqual([project])
				expect(requireSuccess(await portfolio.memories.list({ parentId: null }))).toEqual([memory])
				expect(history).not.toHaveBeenCalled()
				expect(inspect).not.toHaveBeenCalled()
			} finally {
				history.mockRestore()
				inspect.mockRestore()
			}
		}, dependencies)
	})
	it('validates attribution and operation input before closed admission', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		const session = adapter.session.bind(adapter)
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const client = requireSuccess(await opened.setup())
			const portfolio = requireSuccess(client.as({ by: '' }))
			requireSuccess(await opened.shutdown())
			adapter.session = () => {
				throw new Error('Closed admission must not enter a session')
			}
			expect(client.as({ by: '' })).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			const invalid: unknown = Reflect.apply(client.as.bind(client), undefined, [{ by: 1 }])
			expect(invalid).toEqual({
				ok: false,
				error: {
					type: 'invalid-input',
					issues: [{ path: 'by', message: 'Expected attribution by to be a string.' }],
				},
			})
			expect(await portfolio.projects.create({ title: '  ', spec: { type: 'source-control' } })).toEqual({
				ok: false,
				error: { type: 'invalid-input', issues: [{ path: 'title', message: 'Expected a nonblank title.' }] },
			})
			expect(await portfolio.projects.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			const id = '01k00000000000000000000001'
			const { create, find, list } = portfolio.projects.assets
			const { usages } = portfolio.secrets
			for (const result of [
				await create({
					projectId: id,
					spec: {
						type: 'repository',
						source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: id },
					},
				}),
				await find({ projectId: id, assetId: id }),
				await list({ projectId: id }),
				await usages({ secretId: id }),
				await portfolio.memories.create({ parentId: null, title: 'Closed', body: '' }),
				await portfolio.memories.find({ memoryId: id }),
				await portfolio.memories.list({ parentId: null }),
				await portfolio.memories.revisions.find({ revisionId: id }),
				await portfolio.memories.revisions.list({ memoryId: id }),
				await portfolio.memories.revisions.create({
					memoryId: id,
					expectedVersion: 1,
					title: 'Closed',
					body: '',
				}),
			])
				expect(result).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			expect(await list({ projectId: 'invalid' })).toEqual({
				ok: false,
				error: { type: 'invalid-input', issues: [{ path: 'projectId', message: 'Expected a Core id.' }] },
			})
		} finally {
			adapter.session = session
			requireSuccess(await opened.shutdown())
		}
	})
	it('closes admission for a non-Equipped session lookalike with the invocation abort as its cause', async () => {
		const dependencies = createTestDependencies()
		const adapter = dependencies.storage.adapter
		const session = adapter.session.bind(adapter)
		const opened = requireSuccess(await PortfolioClient.new(dependencies))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const client = requireSuccess(await opened.setup())
			const portfolio = requireSuccess(client.as({ by: 'test' }))
			let wrapped = false
			adapter.session = async (work) => {
				try {
					return await session(work)
				} catch (cause) {
					wrapped = true
					throw Object.assign(new Error('Core operation aborted', { cause }), {
						context: { operation: 'session' },
					})
				}
			}
			expect(await portfolio.projects.find({ projectId: '01k00000000000000000000001' })).toEqual({
				ok: false,
				error: { type: 'storage-operation-failed' },
			})
			expect(wrapped).toBe(true)
			adapter.session = session
			expect(client.as({ by: 'test' })).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
			expect(await portfolio.projects.list()).toEqual({ ok: false, error: { type: 'storage-operation-failed' } })
		} finally {
			adapter.session = session
			expect(await opened.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})
	it('rejects a throwing attribution getter without exposing its value', async () => {
		const opened = requireSuccess(await PortfolioClient.new(createTestDependencies()))
		try {
			if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
			const client = requireSuccess(await opened.setup())
			const result = client.as({
				get by(): string {
					throw new Error('synthetic-PROTECTED-attribution')
				},
			})
			expect(result).toMatchObject({ ok: false, error: { type: 'invalid-input' } })
			expect(JSON.stringify(result)).not.toContain('synthetic-PROTECTED')
		} finally {
			requireSuccess(await opened.shutdown())
		}
	})
})
