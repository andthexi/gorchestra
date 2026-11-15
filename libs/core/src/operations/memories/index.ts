import type { OperationGroup } from '../../runtime/bind-tree'
import { create } from './create'
import { find } from './find'
import { list } from './list'
import { revisions } from './revisions'

export const memories = {
	title: 'Memories',
	description: 'Reusable knowledge within this Portfolio.',
	children: { create, find, list, revisions },
} satisfies OperationGroup
