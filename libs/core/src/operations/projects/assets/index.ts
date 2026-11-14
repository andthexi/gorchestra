import type { OperationGroup } from '../../../runtime/bind-tree'
import { create } from './create'
import { find } from './find'
import { list } from './list'

export const assets = {
	title: 'Assets',
	description: 'Immutable configured targets owned by a Project.',
	children: { create, find, list },
} satisfies OperationGroup
