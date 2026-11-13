import { find } from './find'
import { list } from './list'
import type { OperationGroup } from '../../../runtime/bind-tree'

export const revisions = {
	title: 'Memory Revisions',
	description: 'Immutable knowledge snapshots.',
	children: { find, list },
} satisfies OperationGroup
