import { create } from './create'
import { find } from './find'
import { list } from './list'
import type { OperationGroup } from '../../runtime/bind-tree'

export const secrets = {
	title: 'Secrets',
	description: 'Protected credential identities within this Portfolio.',
	children: { create, find, list },
} satisfies OperationGroup
