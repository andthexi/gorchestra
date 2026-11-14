import type { OperationGroup } from '../../runtime/bind-tree'
import { assets } from './assets'
import { create } from './create'
import { find } from './find'
import { list } from './list'

export const projects = {
	title: 'Projects',
	description: 'Continuing undertakings within this Portfolio.',
	children: { create, find, list, assets },
} satisfies OperationGroup
