import { PortfolioClient, type Portfolio, type Result } from '../index'
import { createTestDependencies } from './dependencies'

export { createTestDependencies } from './dependencies'

export function requireSuccess<T, E>(result: Result<T, E>): T {
	if (!result.ok) throw new Error('Expected successful test operation')
	return result.value
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
