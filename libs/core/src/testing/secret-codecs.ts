// Synthetic boundary faults only; never a protection implementation.
export const nonStringValues: Array<{ name: string; value: unknown }> = [
	{ name: 'undefined', value: undefined },
	{ name: 'null', value: null },
	{ name: 'number', value: 7 },
	{ name: 'object', value: { value: 'synthetic-PROTECTED' } },
	{ name: 'array', value: [] },
	{ name: 'boxed string', value: Object('synthetic-PROTECTED') },
	{ name: 'spoofed string', value: { constructor: { name: 'String' }, length: 1 } },
	{
		name: 'hostile constructor',
		value: {
			get constructor(): never {
				throw new Error('synthetic-PROTECTED')
			},
		},
	},
]

export function hostileDiagnostics() {
	let reads = 0
	const touch = (): never => {
		reads++
		throw new Error('Diagnostics must not be read')
	}
	const error = Object.defineProperty(new Error(), 'message', { get: touch })
	const rejection: unknown = {
		get message() {
			return touch()
		},
		get cause() {
			return touch()
		},
		get stack() {
			return touch()
		},
		[Symbol.toPrimitive]: touch,
	}
	return { error, rejection, reads: () => reads }
}
