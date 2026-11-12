import { InMemoryAdapter } from 'equipped/orm/adapters/in-memory'

export function createTestDependencies() {
	const protectedValues = new Map<string, string>()
	return {
		storage: {
			adapter: InMemoryAdapter.create({}),
			resolveSchema: (schema: { name: string }) => ({ table: schema.name }),
		},
		secrets: {
			encode: ({ secretId, value }: { secretId: string; value: string }) => {
				const reference = `test-ref:${secretId}`
				protectedValues.set(reference, value)
				return Promise.resolve(reference)
			},
			decode: ({ secrets }: { secrets: { secretId: string; valueRef: string }[] }) =>
				Promise.resolve(
					Object.fromEntries(secrets.map(({ secretId, valueRef }) => [secretId, protectedValues.get(valueRef) ?? null])),
				),
		},
	}
}
