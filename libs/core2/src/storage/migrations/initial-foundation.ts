import type { Migration } from 'equipped/orm'

import type { StorageAdapter } from '../../dependencies'

// Released snapshot: never import current models or edit this ID/definition.
// Future schema changes belong in new catalog entries.
export const initialFoundationMigration = {
	id: '01m76d124c6e848k2hfvb4mar2',
	tx: true,
	changes: [
		{
			kind: 'createTable',
			name: 'secrets',
			pk: { name: 'id', type: 'string' },
			fields: [
				{ name: 'title', type: 'string' },
				{ name: 'valueRef', type: 'string' },
				{ name: 'created', type: 'object' },
				{ name: 'valueUpdated', type: 'object' },
			],
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

	it('retains the released literal foundation snapshot independently of current models', () => {
		expect(initialFoundationMigration).toEqual({
			id: '01m76d124c6e848k2hfvb4mar2',
			tx: true,
			changes: [
				{
					kind: 'createTable',
					name: 'secrets',
					pk: { name: 'id', type: 'string' },
					fields: [
						{ name: 'title', type: 'string' },
						{ name: 'valueRef', type: 'string' },
						{ name: 'created', type: 'object' },
						{ name: 'valueUpdated', type: 'object' },
					],
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
		})
	})
}
