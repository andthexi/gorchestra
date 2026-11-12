import { create } from './create'
import { find } from './find'
import { list } from './list'
import type { OperationGroup } from '../../runtime/bind-tree'

export const projects = {
	title: 'Projects',
	description: 'Continuing undertakings within this Portfolio.',
	children: { create, find, list },
} satisfies OperationGroup
