import { InMemoryAdapter } from 'equipped/orm/adapters/in-memory'

export function createCountedSecretDependencies() {
	const dependencies = createTestDependencies()
	const codecCalls = { encodes: 0, decodes: 0 }
	dependencies.secrets.encode = () => {
		codecCalls.encodes++
		return Promise.resolve('synthetic-reference')
	}
	dependencies.secrets.decode = () => {
		codecCalls.decodes++
		return Promise.resolve({})
	}
	return { dependencies, codecCalls }
}

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
