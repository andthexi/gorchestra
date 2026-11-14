import { PortfolioClient, type Portfolio, type Result } from '../index'
import { createTestDependencies } from './dependencies'

export { createTestDependencies } from './dependencies'

export function requireSuccess<T, E>(result: Result<T, E>): T {
	if (!result.ok) throw new Error('Expected successful test operation')
	return result.value
}

export async function createMemoryFixture(portfolio: Portfolio) {
	const parent = requireSuccess(await portfolio.memories.create({ parentId: null, title: 'Parent', body: 'parent body' }))
	const child = requireSuccess(await portfolio.memories.create({ parentId: parent.memory.id, title: 'Child', body: 'child body' }))
	return { parent, child }
}

export async function createAssetPrerequisites(portfolio: Portfolio) {
	const project = requireSuccess(await portfolio.projects.create({ title: 'App', spec: { type: 'source-control' } }))
	const secret = requireSuccess(await portfolio.secrets.create({ title: 'Access', value: 'synthetic-pat' }))
	const input: Parameters<Portfolio['projects']['assets']['create']>[0] = {
		projectId: project.id,
		spec: {
			type: 'repository',
			source: { provider: 'github', owner: 'Owner', name: 'Repo', secretId: secret.id },
		},
	}
	return { project, secret, input }
}

export async function createAssetFixture(portfolio: Portfolio) {
	const prerequisites = await createAssetPrerequisites(portfolio)
	const asset = requireSuccess(await portfolio.projects.assets.create(prerequisites.input))
	return { ...prerequisites, asset }
}

export async function createProjectPair(portfolio: Portfolio) {
	const project = requireSuccess(await portfolio.projects.create({ title: 'App', spec: { type: 'source-control' } }))
	const other = requireSuccess(await portfolio.projects.create({ title: 'Other', spec: { type: 'source-control' } }))
	return { project, other }
}

export async function withReadyPortfolio<T>(
	work: (portfolio: Portfolio) => Promise<T>,
	dependencies = createTestDependencies(),
): Promise<T> {
	const opened = requireSuccess(await PortfolioClient.new(dependencies))
	try {
		if (opened.state !== 'uninitialized') throw new Error('Expected fresh storage')
		const client = requireSuccess(await opened.setup())
		return await work(requireSuccess(client.as({ by: 'test-author', cid: 'test-call' })))
	} finally {
		requireSuccess(await opened.shutdown())
	}
}
