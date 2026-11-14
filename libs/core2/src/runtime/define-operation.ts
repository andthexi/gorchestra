import type { Repo } from 'equipped/orm'
import { v, type Pipe, type PipeInput, type PipeOutput } from 'valleyed'

import type { StorageAdapter } from '../dependencies'
import type { AuditStamp } from '../domain/commons'
import { sharedOperationErrorPipe, type Result } from '../errors'
import type { createSecretHelpers } from './secrets'

export type OperationContext = {
	readonly storage: Repo<StorageAdapter>
	readonly stamp: AuditStamp
	readonly secrets: ReturnType<typeof createSecretHelpers>
}

export type Operation<
	I extends Pipe<unknown, unknown>,
	O extends Pipe<unknown, unknown>,
	E extends Pipe<unknown, unknown>,
> = {
	readonly title: string
	readonly description: string
	readonly input: I
	readonly output: O
	readonly error: E
	readonly handler: (input: PipeOutput<I>, context: OperationContext) => Promise<Result<PipeInput<O>, PipeInput<E>>>
	readonly children?: never
}

export function defineOperation<II, IO, OI, OO, EI = never, EO = never>(definition: {
	readonly title: string
	readonly description: string
	readonly input: Pipe<II, IO>
	readonly output: Pipe<OI, OO>
	readonly error?: Pipe<EI, EO>
	readonly children?: never
	readonly handler: (
		input: NoInfer<IO>,
		context: OperationContext,
	) => Promise<NoInfer<Result<OI, EI | PipeInput<typeof sharedOperationErrorPipe>>>>
}): Operation<
	Pipe<II, IO>,
	Pipe<OI, OO>,
	Pipe<EI | PipeInput<typeof sharedOperationErrorPipe>, EO | PipeOutput<typeof sharedOperationErrorPipe>>
> {
	const error =
		definition.error === undefined ? sharedOperationErrorPipe : v.or([sharedOperationErrorPipe, definition.error])
	return { ...definition, error }
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest
	const { resultPipe } = await import('../errors')
	it('normalizes omitted errors to the shared pipe itself', () => {
		const definition = defineOperation({
			title: 'No input',
			description: 'Synthetic definition',
			input: v.eq(undefined),
			output: v.eq(undefined),
			handler: () => Promise.resolve({ ok: true, value: undefined }),
		})
		expect(Object.keys(definition).sort()).toEqual(['description', 'error', 'handler', 'input', 'output', 'title'])
		expect(definition.error).toBe(sharedOperationErrorPipe)
		expect(
			v.validate(definition.error, { type: 'storage-operation-failed', cause: 'synthetic-PROTECTED' }),
		).toEqual({
			valid: true,
			value: { type: 'storage-operation-failed' },
		})
	})
	it('composes specific failures once and returns transformed stripped Results', () => {
		let parses = 0
		const specific = v.object({
			type: v.eq('synthetic-failure'),
			detail: v.string().pipe((text) => {
				parses++
				return text.length
			}),
		})
		const definition = defineOperation({
			title: 'Specific',
			description: 'Synthetic definition',
			input: v.eq(undefined),
			output: v.string().pipe((text) => text.length),
			error: specific,
			handler: () => Promise.resolve({ ok: false, error: { type: 'synthetic-failure', detail: 'four' } }),
		})
		const envelope = resultPipe(definition.output, definition.error)
		expect(
			v.validate(envelope, {
				ok: false,
				error: { type: 'synthetic-failure', detail: 'four', cause: 'synthetic-PROTECTED' },
				value: 'wrong branch',
				raw: 'synthetic-PROTECTED',
			}),
		).toEqual({ valid: true, value: { ok: false, error: { type: 'synthetic-failure', detail: 4 } } })
		expect(parses).toBe(1)
		expect(v.validate(envelope, { ok: true, value: 'parsed', error: { type: 'unknown' }, extra: true })).toEqual({
			valid: true,
			value: { ok: true, value: 6 },
		})
		expect(v.validate(envelope, { ok: false, error: { type: 'undeclared' } }).valid).toBe(false)
	})
}
