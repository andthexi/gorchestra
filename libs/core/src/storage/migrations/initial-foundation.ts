import type { Migration } from 'equipped/orm'

import type { StorageAdapter } from '../../dependencies'

// Released snapshot: never import current models or edit this ID/definition.
// Future schema changes belong in new catalog entries.
export const initialFoundationMigration = {
	id: '01m8h0t7m21v7t5bs8d9r9zq1a',
	tx: true,
	changes: [
		{
			kind: 'createTable',
			name: 'secrets',
			pk: { name: 'id', type: 'string' },
			fields: [
				{ name: 'title', type: 'string' },
				{ name: 'value', type: 'object' },
				{ name: 'created', type: 'object' },
				{ name: 'valueUpdated', type: 'object' },
			],
		},
		{
			kind: 'createTable',
			name: 'secret_protection',
			pk: { name: 'id', type: 'string' },
			fields: [{ name: 'spec', type: 'object' }],
		},
		{
			kind: 'createTable',
			name: 'projects',
			pk: { name: 'id', type: 'string' },
			fields: [
				{ name: 'title', type: 'string' },
				{ name: 'spec', type: 'object' },
				{ name: 'created', type: 'object' },
			],
		},
		{
			kind: 'createTable',
			name: 'assets',
			pk: { name: 'id', type: 'string' },
			fields: [
				{ name: 'projectId', type: 'string' },
				{ name: 'spec', type: 'object' },
				{ name: 'created', type: 'object' },
			],
		},
		{
			kind: 'createTable',
			name: 'memories',
			pk: { name: 'id', type: 'string' },
			fields: [
				{ name: 'parentId', type: 'string', nullable: true },
				{ name: 'revision', type: 'object' },
				{ name: 'created', type: 'object' },
			],
		},
		{
			kind: 'createTable',
			name: 'memory_revisions',
			pk: { name: 'id', type: 'string' },
			fields: [
				{ name: 'memoryId', type: 'string' },
				{ name: 'version', type: 'number' },
				{ name: 'title', type: 'string' },
				{ name: 'body', type: 'string' },
				{ name: 'created', type: 'object' },
			],
		},
	],
} as const satisfies Migration<StorageAdapter>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest
	const { default: expected } = await import('./initial-foundation.expected.json')

	it('retains the released literal foundation snapshot independently of current models', () => {
		expect(initialFoundationMigration).toEqual(expected)
	})
}
