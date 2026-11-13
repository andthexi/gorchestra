import { v, PipeError, type PipeOutput } from 'valleyed'

import type { RuntimeDependencies } from '../dependencies'
import { idPipe, protectedStringPipe, type Id } from '../domain/commons'
import { type Result, type secretEncodingFailedPipe, type internalSecretDecodingFailedPipe } from '../errors'

const decodedValuesPipe = v.record(idPipe, v.nullable(v.custom<string>((value) => typeof value === 'string', 'Expected decoded text.')))
type DecodedResult = Result<string, PipeOutput<typeof internalSecretDecodingFailedPipe>>

export function createSecretHelpers(callbacks: RuntimeDependencies['secrets']) {
	return {
		async decode(this: void, input: Parameters<RuntimeDependencies['secrets']['decode']>[0]): Promise<Record<Id, DecodedResult>> {
			// Callers supply identities/references from already validated records.
			const references = new Map<Id, string>()
			for (const { secretId, valueRef } of input.secrets) {
				if (references.has(secretId) && references.get(secretId) !== valueRef) throw new Error('Conflicting Secret references.')
				references.set(secretId, valueRef)
			}
			if (references.size === 0) return {}
			const captured = [...references].map(([secretId, valueRef]) => ({ secretId, valueRef }))
			const ids = new Set(references.keys())
			try {
				const response = await callbacks.decode({ secrets: captured.map((secret) => ({ ...secret })) })
				const parseKeys = v.compile(
					v.custom<Record<Id, string | null>>((value) => {
						if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
						const keys = Object.keys(value)
						return keys.length === ids.size && keys.every((key) => ids.has(key))
					}, 'Expected the requested Secret keys.'),
				)
				const matchingKeys = parseKeys(response)
				if (!(matchingKeys instanceof PipeError)) {
					const values = v.compile(decodedValuesPipe)(matchingKeys)
					// A proxy can change keys between the raw key check and native record parsing.
					if (!(values instanceof PipeError) && !(parseKeys(values) instanceof PipeError))
						return Object.fromEntries(
							Object.entries(values).map(([secretId, value]) => {
								const result: DecodedResult =
									value === null ? { ok: false, error: { type: 'secret-decoding-failed' } } : { ok: true, value }
								return [secretId, result]
							}),
						)
				}
			} catch {
				// Callback diagnostics are deliberately never inspected.
			}
			return Object.fromEntries(captured.map(({ secretId }) => [secretId, { ok: false, error: { type: 'secret-decoding-failed' } }]))
		},
		async encode(
			this: void,
			input: Parameters<RuntimeDependencies['secrets']['encode']>[0],
		): Promise<Result<string, PipeOutput<typeof secretEncodingFailedPipe>>> {
			try {
				const reference = v.compile(protectedStringPipe)(await callbacks.encode(input))
				if (!(reference instanceof PipeError)) return { ok: true, value: reference }
			} catch {
				// Callback diagnostics are deliberately never inspected.
			}
			return { ok: false, error: { type: 'secret-encoding-failed' } }
		},
	}
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest
	const { createTestDependencies } = await import('../testing/dependencies')
	const { nonStringValues, hostileDiagnostics } = await import('../testing/secret-codecs')
	const a = '01k00000000000000000000001'
	const b = '01k00000000000000000000002'
	const c = '01k00000000000000000000003'

	it.each(nonStringValues.filter(({ value }) => value !== null))('fails the whole decoded batch for a $name value', async ({ value }) => {
		const dependencies = createTestDependencies()
		Object.defineProperty(dependencies.secrets, 'decode', { value: () => Promise.resolve({ [a]: 'valid', [b]: value }) })
		expect(
			await createSecretHelpers(dependencies.secrets).decode({
				secrets: [
					{ secretId: a, valueRef: 'ref' },
					{ secretId: b, valueRef: 'ref' },
				],
			}),
		).toEqual({
			[a]: { ok: false, error: { type: 'secret-decoding-failed' } },
			[b]: { ok: false, error: { type: 'secret-decoding-failed' } },
		})
	})

	it.each(['null', 'array', 'string', 'throw', 'reject', 'getter', 'ownKeys', 'extra-getter'] as const)(
		'safely rejects malformed decoder response: %s',
		async (mode) => {
			const dependencies = createTestDependencies()
			const diagnostics = hostileDiagnostics()
			let unexpectedReads = 0
			Object.defineProperty(dependencies.secrets, 'decode', {
				value: () => {
					switch (mode) {
						case 'null':
							return Promise.resolve(null)
						case 'array':
							return Promise.resolve([])
						case 'string':
							return Promise.resolve('synthetic-PROTECTED')
						case 'throw':
							throw diagnostics.error
						case 'reject': {
							const rejected = Promise.withResolvers<never>()
							rejected.reject(diagnostics.rejection)
							return rejected.promise
						}
						case 'getter':
							return Promise.resolve({
								[a]: 'valid',
								get [b]() {
									throw diagnostics.error
								},
							})
						case 'ownKeys':
							return Promise.resolve(
								new Proxy(
									{},
									{
										ownKeys() {
											throw diagnostics.rejection
										},
									},
								),
							)
						case 'extra-getter':
							return Promise.resolve({
								[a]: 'valid',
								[b]: null,
								get [c]() {
									unexpectedReads++
									throw diagnostics.error
								},
							})
						default:
							throw new Error('Unexpected test mode')
					}
				},
			})
			expect(
				await createSecretHelpers(dependencies.secrets).decode({
					secrets: [
						{ secretId: a, valueRef: 'ref' },
						{ secretId: b, valueRef: 'ref' },
					],
				}),
			).toEqual({
				[a]: { ok: false, error: { type: 'secret-decoding-failed' } },
				[b]: { ok: false, error: { type: 'secret-decoding-failed' } },
			})
			expect(diagnostics.reads()).toBe(0)
			expect(unexpectedReads).toBe(0)
		},
	)

	it.each(['success', 'wrong-key', 'reject'] as const)(
		'keeps captured identity independent of callback and caller mutation: %s',
		async (mode) => {
			const dependencies = createTestDependencies()
			const entered = Promise.withResolvers<void>()
			const gate = Promise.withResolvers<void>()
			const request = {
				secrets: [
					{ secretId: a, valueRef: ' exact-ref\n' },
					{ secretId: b, valueRef: ' exact-ref\n' },
				],
			}
			const original = structuredClone(request)
			dependencies.secrets.decode = async (input) => {
				expect(input).toEqual(original)
				expect(input).not.toBe(request)
				expect(input.secrets).not.toBe(request.secrets)
				input.secrets[0]!.secretId = c
				input.secrets[0]!.valueRef = 'mutated'
				input.secrets.length = 1
				entered.resolve()
				await gate.promise
				switch (mode) {
					case 'success':
						return { [a]: 'a-value', [b]: '' }
					case 'wrong-key':
						return { [c]: 'synthetic-PROTECTED' }
					case 'reject':
						throw new Error('synthetic-PROTECTED')
					default:
						throw new Error('Unexpected test mode')
				}
			}
			const result = createSecretHelpers(dependencies.secrets).decode(request)
			try {
				await entered.promise
				expect(request).toEqual(original)
				request.secrets.length = 0
				gate.resolve()
				expect(await result).toEqual(
					mode === 'success'
						? { [a]: { ok: true, value: 'a-value' }, [b]: { ok: true, value: '' } }
						: {
								[a]: { ok: false, error: { type: 'secret-decoding-failed' } },
								[b]: { ok: false, error: { type: 'secret-decoding-failed' } },
							},
				)
			} finally {
				gate.resolve()
				await result
			}
		},
	)

	it('fails all captured IDs when response keys change during native record parsing', async () => {
		const dependencies = createTestDependencies()
		let calls = 0
		const response = new Proxy(
			{ [a]: 'valid', [b]: null, [c]: 'unexpected' },
			{
				ownKeys: () => (++calls === 1 ? [a, b] : [a, c]),
			},
		)
		dependencies.secrets.decode = () => Promise.resolve(response)
		expect(
			await createSecretHelpers(dependencies.secrets).decode({
				secrets: [
					{ secretId: a, valueRef: 'ref' },
					{ secretId: b, valueRef: 'ref' },
				],
			}),
		).toEqual({
			[a]: { ok: false, error: { type: 'secret-decoding-failed' } },
			[b]: { ok: false, error: { type: 'secret-decoding-failed' } },
		})
	})

	it('uses own enumerable string record semantics without reading unrelated properties', async () => {
		const dependencies = createTestDependencies()
		const response = { [a]: '', [Symbol('unrelated')]: 'ignored' }
		Object.defineProperty(response, 'unrelated', {
			get() {
				throw new Error('Must not read nonenumerable properties')
			},
		})
		dependencies.secrets.decode = () => Promise.resolve(response)
		expect(await createSecretHelpers(dependencies.secrets).decode({ secrets: [{ secretId: a, valueRef: 'ref' }] })).toEqual({
			[a]: { ok: true, value: '' },
		})
	})

	it.each(['empty', 'identical', 'conflicting'] as const)('captures decoder identities once before callback: %s', async (mode) => {
		const dependencies = createTestDependencies()
		const calls: unknown[] = []
		dependencies.secrets.decode = (input) => {
			calls.push(input)
			return Promise.resolve({ [a]: 'resolved' })
		}
		const helpers = createSecretHelpers(dependencies.secrets)
		switch (mode) {
			case 'empty':
				expect(await helpers.decode({ secrets: [] })).toEqual({})
				expect(calls).toEqual([])
				break
			case 'identical':
				expect(
					await helpers.decode({
						secrets: [
							{ secretId: a, valueRef: 'ref' },
							{ secretId: a, valueRef: 'ref' },
						],
					}),
				).toEqual({ [a]: { ok: true, value: 'resolved' } })
				expect(calls).toEqual([{ secrets: [{ secretId: a, valueRef: 'ref' }] }])
				break
			case 'conflicting':
				await expect(
					helpers.decode({
						secrets: [
							{ secretId: a, valueRef: 'ref' },
							{ secretId: a, valueRef: 'different' },
						],
					}),
				).rejects.toThrow('Conflicting Secret references.')
				expect(calls).toEqual([])
				break
			default:
				throw new Error('Unexpected test mode')
		}
	})

	it.each(['missing', 'extra', 'wrong-case', 'inherited'] as const)('fails the whole decode batch for %s response keys', async (mode) => {
		const dependencies = createTestDependencies()
		let response: Record<string, string | null>
		switch (mode) {
			case 'missing':
				response = { [a]: 'synthetic-raw' }
				break
			case 'extra':
				response = { [a]: 'synthetic-raw', [b]: null, [c]: 'unexpected' }
				break
			case 'wrong-case':
				response = { [a.toUpperCase()]: 'synthetic-raw', [b]: null }
				break
			case 'inherited':
				response = { [b]: null }
				Object.setPrototypeOf(response, { [a]: 'synthetic-raw' })
				break
			default:
				throw new Error('Unexpected test mode')
		}
		dependencies.secrets.decode = () => Promise.resolve(response)
		expect(
			await createSecretHelpers(dependencies.secrets).decode({
				secrets: [
					{ secretId: a, valueRef: 'ref' },
					{ secretId: b, valueRef: 'ref' },
				],
			}),
		).toEqual({
			[a]: { ok: false, error: { type: 'secret-decoding-failed' } },
			[b]: { ok: false, error: { type: 'secret-decoding-failed' } },
		})
	})

	it('decodes one ID-keyed batch with exact shared references and mixed empty-string/null results', async () => {
		const dependencies = createTestDependencies()
		const secrets = [
			{ secretId: a, valueRef: ' shared\n' },
			{ secretId: b, valueRef: ' shared\n' },
			{ secretId: c, valueRef: ' other	' },
		]
		const calls: unknown[] = []
		dependencies.secrets.encode = () => {
			throw new Error('Decode must not encode')
		}
		dependencies.secrets.decode = (input) => {
			calls.push(input)
			return Promise.resolve({ [c]: null, [b]: '', [a]: ' exact-É-value\n' })
		}
		const result = await createSecretHelpers(dependencies.secrets).decode({ secrets })
		expect(calls).toEqual([{ secrets }])
		expect(result).toEqual({
			[a]: { ok: true, value: ' exact-É-value\n' },
			[b]: { ok: true, value: '' },
			[c]: { ok: false, error: { type: 'secret-decoding-failed' } },
		})
	})
}
