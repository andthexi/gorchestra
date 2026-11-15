import { InMemoryAdapter } from 'equipped/orm/adapters/in-memory'

export function createCountedSecretDependencies() {
	const dependencies = createTestDependencies()
	const codecCalls = { encodes: 0, decodes: 0 }
	return { dependencies, codecCalls }
}

export function createTestDependencies() {
	return {
		storage: {
			adapter: InMemoryAdapter.create({}),
			resolveSchema: (name: string) => ({ table: name }),
		},
		secrets: {
			encryptionKey: null,
		},
	}
}
