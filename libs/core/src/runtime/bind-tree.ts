import type { Pipe, PipeInput, PipeOutput } from 'valleyed'

import type { attributionPipe } from '../domain/commons'
import type { Result, SharedOperationError } from '../errors'
import type { OperationContext } from './define-operation'
import { invokeOperation } from './invoke-operation'
import type { Owner } from './owner'

type Leaf = {
	readonly title: string
	readonly description: string
	readonly input: Pipe<unknown, unknown>
	readonly output: Pipe<unknown, unknown>
	readonly error: Pipe<unknown, unknown>
	handler(input: unknown, context: OperationContext): Promise<Result<unknown, unknown>>
	readonly children?: never
}
export type OperationGroup = {
	readonly title: string
	readonly description: string
	readonly children: Readonly<Record<string, Leaf | OperationGroup>>
	readonly handler?: never
}
type BoundNode<N> = N extends OperationGroup
	? BoundTree<N['children']>
	: N extends Leaf
		? (
				...args: [PipeInput<N['input']>] extends [undefined] ? [] : [input: PipeInput<N['input']>]
			) => Promise<Result<PipeOutput<N['output']>, PipeOutput<N['error']> | SharedOperationError>>
		: never
type BoundTree<T> = { readonly [K in keyof T]: BoundNode<T[K]> }

export function bindTree<T extends OperationGroup['children']>(
	tree: T,
	owner: Owner,
	attribution: PipeOutput<typeof attributionPipe>,
): BoundTree<T> {
	// The mapped keys and leaves come from these actual entries, not a facade stub.
	return Object.fromEntries(
		Object.entries(tree).map(([key, node]) => {
			if ((node.children !== undefined) === (typeof node.handler === 'function'))
				throw new Error('Invalid operation node')
			return [
				key,
				node.children === undefined
					? (input: unknown) => invokeOperation(node, owner, attribution, input)
					: bindTree(node.children, owner, attribution),
			]
		}),
	) as BoundTree<T>
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest
	const { v } = await import('valleyed')
	it('binds a real nested definition tree with distinct accepted and parsed types', async () => {
		const { Owner } = await import('./owner')
		const { defineOperation } = await import('./define-operation')
		const { createTestDependencies } = await import('../testing/dependencies')
		const { migrations } = await import('../storage/migrations')
		const owner = new Owner(createTestDependencies(), migrations)
		owner.build()
		await owner.repo.session(() => owner.migrator.up())
		try {
			const parse = defineOperation({
				title: 'Parse',
				description: 'Synthetic nested leaf',
				input: v.object({ text: v.string().pipe((text) => text.length) }),
				output: v.string().pipe((text) => text.length),
				handler: (input, context) => {
					expect(context.stamp.by).toBe('bound')
					return Promise.resolve({ ok: true, value: input.text.toFixed() })
				},
			})
			const bound = bindTree(
				{
					nested: {
						title: 'Nested',
						description: 'Nested group',
						children: { deeper: { title: 'Deeper', description: 'Deeper group', children: { parse } } },
					},
				},
				owner,
				{ by: 'bound', cid: null },
			)
			const detached = bound.nested.deeper.parse
			const result = await detached({ text: 'four' })
			expect(result).toEqual({ ok: true, value: 1 })
			if (!result.ok) throw new Error('Expected success')
			expect(result.value.toFixed()).toBe('1')
			expect(Object.keys(bound.nested.deeper)).toEqual(['parse'])
		} finally {
			expect(await owner.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})
	it('rejects nodes with both or neither children and handler', async () => {
		const { Owner } = await import('./owner')
		const { createTestDependencies } = await import('../testing/dependencies')
		const { migrations } = await import('../storage/migrations')
		const owner = new Owner(createTestDependencies(), migrations)
		try {
			for (const node of [
				{ title: 'Neither', description: 'Invalid internal tree' },
				{
					title: 'Both',
					description: 'Invalid internal tree',
					children: {},
					handler: () => Promise.resolve({ ok: true, value: undefined }),
				},
			])
				expect(() => {
					Reflect.apply(bindTree, undefined, [{ invalid: node }, owner, { by: '', cid: null }])
				}).toThrow('Invalid operation node')
		} finally {
			expect(await owner.shutdown()).toEqual({ ok: true, value: undefined })
		}
	})
}
