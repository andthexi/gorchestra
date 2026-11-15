import type { OperationGroup } from '../../../runtime/bind-tree'
import { create } from './create'
import { find } from './find'
import { list } from './list'

export const revisions = {
	title: 'Memory Revisions',
	description: 'Immutable knowledge snapshots.',
	children: { create, find, list },
} satisfies OperationGroup
