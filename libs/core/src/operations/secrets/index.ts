import type { OperationGroup } from '../../runtime/bind-tree'
import { create } from './create'
import { find } from './find'
import { list } from './list'
import { updateValue } from './update-value'
import { usages } from './usages'

export const secrets = {
	title: 'Secrets',
	description: 'Protected credential identities within this Portfolio.',
	children: { create, find, list, updateValue, usages },
} satisfies OperationGroup
