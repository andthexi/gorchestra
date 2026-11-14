import { v, type PipeError, type PipeOutput, type Pipe } from 'valleyed'

import { idPipe, revisionVersionPipe, titlePipe } from './domain/commons'

// Only Core-authored validators with static paths and non-input-echoing messages
// belong here. This projection is not a sanitizer for arbitrary PipeErrors.
export function inputIssues(error: PipeError): PipeOutput<typeof inputIssuePipe>[] {
	return error.messages.map(({ path, message }) => (path === undefined ? { message } : { path, message }))
}

// Native object stripping stays intact; only absent optional paths are omitted.
const inputIssuePipe = v
	.object({
		path: v.optional(v.custom<string>((value) => typeof value === 'string', 'Invalid input.')),
		message: v.custom<string>((value) => typeof value === 'string', 'Invalid input.'),
	})
	.pipe(({ path, message }) => (path === undefined ? { message } : { path, message }))

const invalidInputPipe = v.object({
	type: v.is('invalid-input', 'Invalid input.'),
	issues: v.array(inputIssuePipe),
})

const invalidOutputPipe = v.object({ type: v.is('invalid-output', 'Invalid input.') })
const invalidStorageOutputPipe = v.object({ type: v.is('invalid-storage-output', 'Invalid input.') })
const internalErrorPipe = v.object({ type: v.is('internal-error', 'Invalid input.') })
const storageOperationFailedPipe = v.object({ type: v.is('storage-operation-failed', 'Invalid input.') })

export const sharedOperationErrorPipe = v.discriminate(
	(error) => error.type,
	{
		'invalid-input': invalidInputPipe,
		'invalid-output': invalidOutputPipe,
		'invalid-storage-output': invalidStorageOutputPipe,
		'internal-error': internalErrorPipe,
		'storage-operation-failed': storageOperationFailedPipe,
	},
	'Invalid input.',
)
export type InvalidInputError = PipeOutput<typeof invalidInputPipe>
export type SharedOperationError = PipeOutput<typeof sharedOperationErrorPipe>

export const notFoundPipe = v.object({
	type: v.is('not-found', 'Invalid input.'),
	resource: v.in(['secret', 'project', 'asset', 'memory', 'memory-revision'], 'Invalid input.'),
	id: idPipe,
})

export const duplicateAssetPipe = v.object({ type: v.is('duplicate-asset-target', 'Invalid input.'), assetId: idPipe })

const revisionConflictPipe = v.object({
	type: v.is('revision-conflict', 'Invalid input.'),
	memoryId: idPipe,
	expectedVersion: revisionVersionPipe,
})

export const secretEncodingFailedPipe = v.object({ type: v.is('secret-encoding-failed', 'Invalid input.') })
const revisionVersionExhaustedPipe = v.object({ type: v.is('revision-version-exhausted', 'Invalid input.') })
const schemaMetadataInvalidPipe = v.object({ type: v.is('schema-metadata-invalid', 'Invalid input.') })
const schemaVersionUnrecognizedPipe = v.object({ type: v.is('schema-version-unrecognized', 'Invalid input.') })
export type SchemaMetadataInvalidError = PipeOutput<typeof schemaMetadataInvalidPipe>
export type SchemaVersionUnrecognizedError = PipeOutput<typeof schemaVersionUnrecognizedPipe>
export type StorageOperationFailedError = PipeOutput<typeof storageOperationFailedPipe>
const storageNotEmptyPipe = v.object({ type: v.is('storage-not-empty', 'Invalid input.') })
const storageAlreadyInitializedPipe = v.object({ type: v.is('storage-already-initialized', 'Invalid input.') })
const storageNotInitializedPipe = v.object({ type: v.is('storage-not-initialized', 'Invalid input.') })
const schemaAlreadyCurrentPipe = v.object({ type: v.is('schema-already-current', 'Invalid input.') })

const secretDecodingFailedPipe = v.object({ type: v.is('secret-decoding-failed', 'Invalid input.'), secretId: idPipe })
// Internal keyed-map entries do not repeat their Secret identity.
export const internalSecretDecodingFailedPipe = v.objectPick(secretDecodingFailedPipe, ['type'])

export const factoryErrorPipe = v.or([
	invalidInputPipe,
	storageOperationFailedPipe,
	schemaMetadataInvalidPipe,
	schemaVersionUnrecognizedPipe,
	storageNotEmptyPipe,
	internalErrorPipe,
])
export const setupErrorPipe = v.or([
	storageOperationFailedPipe,
	schemaMetadataInvalidPipe,
	schemaVersionUnrecognizedPipe,
	storageNotEmptyPipe,
	storageAlreadyInitializedPipe,
	internalErrorPipe,
])
export type FactoryError = PipeOutput<typeof factoryErrorPipe>
export type SetupError = PipeOutput<typeof setupErrorPipe>
export const migrationErrorPipe = v.or([
	storageOperationFailedPipe,
	schemaMetadataInvalidPipe,
	schemaVersionUnrecognizedPipe,
	storageNotEmptyPipe,
	storageNotInitializedPipe,
	schemaAlreadyCurrentPipe,
	internalErrorPipe,
])
export type MigrationError = PipeOutput<typeof migrationErrorPipe>

// Keep input and parsed output types distinct for transforming branch pipes.
export function resultPipe<I, O, EI, EO>(value: Pipe<I, O>, error: Pipe<EI, EO>) {
	return v.discriminate(
		(result) => {
			switch (result.ok) {
				case true:
					return 'success'
				case false:
					return 'failure'
				default:
					throw new Error('Invalid Result discriminator.')
			}
		},
		{
			success: v.object({ ok: v.is(true, 'Invalid Result.'), value }),
			failure: v.object({ ok: v.is(false, 'Invalid Result.'), error }),
		},
		'Invalid Result.',
	)
}

export type Result<T, E> = PipeOutput<ReturnType<typeof resultPipe<T, T, E, E>>>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('retains transformed success types and supports an undefined success value', () => {
		const lengthPipe = resultPipe(
			v.string().pipe((value) => value.length),
			internalErrorPipe,
		)
		const parsed = v.validate(lengthPipe, { ok: true, value: 'Notes' })
		if (!parsed.valid) throw new Error('Expected parsed Result in test')
		const result: Result<number, PipeOutput<typeof internalErrorPipe>> = parsed.value
		switch (result.ok) {
			case true:
				expect(result.value.toFixed(1)).toBe('5.0')
				break
			case false:
				throw new Error('Expected success in test')
			default:
				throw new Error('Unexpected Result in test')
		}
		const empty = resultPipe(v.undefined(), internalErrorPipe)
		expect(v.validate(empty, { ok: true, value: undefined, cause: 'synthetic-secret' })).toEqual({
			valid: true,
			value: { ok: true, value: undefined },
		})
		expect(v.validate(empty, { ok: true, value: null }).valid).toBe(false)
	})

	it('preserves native object messages and absent root paths', () => {
		const invalid = v.validate(v.object({ title: titlePipe }), 'synthetic-secret')
		if (invalid.valid) throw new Error('Expected invalid input in test')
		const issues = inputIssues(invalid.error)
		expect(issues).toEqual([{ message: 'is not an object' }])
		expect(issues[0]).not.toHaveProperty('path')
		expect(v.validate(invalidInputPipe, { type: 'invalid-input', issues })).toEqual({
			valid: true,
			value: { type: 'invalid-input', issues: [{ message: 'is not an object' }] },
		})
	})

	it('preserves schema-authored wording without an independent catalog', () => {
		const invalid = v.validate(v.object({ title: v.custom<string>((value) => typeof value === 'string', 'Expected title text.') }), {
			title: null,
		})
		if (invalid.valid) throw new Error('Expected invalid input in test')
		expect(inputIssues(invalid.error)).toEqual([{ path: 'title', message: 'Expected title text.' }])
	})

	it('parses only the selected Result branch with native stripping and transforms', () => {
		const pipe = resultPipe(v.object({ title: titlePipe }), revisionConflictPipe)
		expect(
			v.validate(pipe, {
				ok: true,
				value: { title: '  Notes  ', valueRef: 'synthetic-secret' },
				cause: 'synthetic-error',
				error: { type: 'revision-conflict', memoryId: '01k00000000000000000000001', expectedVersion: 1 },
			}),
		).toEqual({ valid: true, value: { ok: true, value: { title: 'Notes' } } })
		expect(
			v.validate(pipe, {
				ok: false,
				value: 'ignored wrong-branch value',
				error: { type: 'revision-conflict', memoryId: '01k00000000000000000000001', expectedVersion: 1, actualVersion: 2 },
				raw: 'synthetic-secret',
			}),
		).toEqual({
			valid: true,
			value: { ok: false, error: { type: 'revision-conflict', memoryId: '01k00000000000000000000001', expectedVersion: 1 } },
		})
		for (const candidate of [
			null,
			[],
			{},
			{ ok: 'true', value: { title: 'Notes' } },
			{ ok: 1, value: { title: 'Notes' } },
			{ ok: true },
			{ ok: true, value: { title: 1 } },
			{ ok: false },
			{ ok: false, error: { type: 'internal-error' } },
			{ ok: false, error: { type: 'revision-conflict', memoryId: 'invalid', expectedVersion: 1 } },
		]) {
			expect(v.validate(pipe, candidate).valid).toBe(false)
		}
	})

	it('keeps internal decoding-map failures type-only while public failures require identity', () => {
		const value = { type: 'secret-decoding-failed', secretId: '01k00000000000000000000001', cause: 'synthetic-PROTECTED' }
		expect(v.validate(internalSecretDecodingFailedPipe, value)).toEqual({ valid: true, value: { type: 'secret-decoding-failed' } })
		expect(v.validate(secretDecodingFailedPipe, { type: 'secret-decoding-failed' }).valid).toBe(false)
	})

	it('limits decoding failures to the validated secret id', () => {
		const error = { type: 'secret-decoding-failed', secretId: '01k00000000000000000000001' }
		expect(
			v.validate(secretDecodingFailedPipe, {
				...error,
				value: 'synthetic-secret',
				valueRef: 'synthetic-reference',
				cause: 'synthetic-error',
			}),
		).toEqual({ valid: true, value: error })
		for (const secretId of ['', '01K00000000000000000000001', undefined]) {
			expect(v.validate(secretDecodingFailedPipe, { ...error, secretId }).valid).toBe(false)
		}
	})

	it.each([
		['secret-encoding-failed', secretEncodingFailedPipe],
		['revision-version-exhausted', revisionVersionExhaustedPipe],
		['schema-metadata-invalid', schemaMetadataInvalidPipe],
		['schema-version-unrecognized', schemaVersionUnrecognizedPipe],
		['storage-not-empty', storageNotEmptyPipe],
		['storage-already-initialized', storageAlreadyInitializedPipe],
		['storage-not-initialized', storageNotInitializedPipe],
		['schema-already-current', schemaAlreadyCurrentPipe],
	])('keeps %s type-only without diagnostics', (type, pipe) => {
		expect(v.validate(pipe, { type, id: 'synthetic-secret', cause: 'synthetic-reference', issues: ['synthetic-error'] })).toEqual({
			valid: true,
			value: { type },
		})
		expect(v.validate(pipe, { type: 'other-error' }).valid).toBe(false)
		expect(v.validate(pipe, {}).valid).toBe(false)
	})

	it('reports conflicts with exact memory identity and expected version only', () => {
		const error = { type: 'revision-conflict', memoryId: '01k00000000000000000000001', expectedVersion: 9007199254740991 }
		expect(v.validate(revisionConflictPipe, { ...error, actualVersion: 2, cause: 'synthetic-secret' })).toEqual({
			valid: true,
			value: error,
		})
		for (const expectedVersion of [0, 1.5, 9007199254740992, NaN, '1', undefined]) {
			expect(v.validate(revisionConflictPipe, { ...error, expectedVersion }).valid).toBe(false)
		}
		for (const memoryId of ['', '01K00000000000000000000001', null]) {
			expect(v.validate(revisionConflictPipe, { ...error, memoryId }).valid).toBe(false)
		}
	})

	it('reports duplicate targets with only the existing asset id', () => {
		const error = { type: 'duplicate-asset-target', assetId: '01k00000000000000000000001' }
		expect(v.validate(duplicateAssetPipe, { ...error, secretId: 'synthetic-secret', owner: 'synthetic-owner' })).toEqual({
			valid: true,
			value: error,
		})
		for (const assetId of ['', '01K00000000000000000000001', '8zzzzzzzzzzzzzzzzzzzzzzzzz', null, undefined]) {
			expect(v.validate(duplicateAssetPipe, { ...error, assetId }).valid).toBe(false)
		}
	})

	it('requires a singular missing resource and exact Core id without owner disclosure', () => {
		for (const resource of ['secret', 'project', 'asset', 'memory', 'memory-revision']) {
			const error = { type: 'not-found', resource, id: '01k00000000000000000000001' }
			expect(v.validate(notFoundPipe, { ...error, actualOwner: 'synthetic-secret' })).toEqual({ valid: true, value: error })
		}
		for (const candidate of [
			{ type: 'not-found', resource: 'secrets', id: '01k00000000000000000000001' },
			{ type: 'not-found', resource: 'secret', id: ' 01k00000000000000000000001' },
			{ type: 'not-found', resource: 'secret', id: '8zzzzzzzzzzzzzzzzzzzzzzzzz' },
			{ type: 'not-found', resource: 'secret' },
			{ type: 'missing', resource: 'secret', id: '01k00000000000000000000001' },
		])
			expect(v.validate(notFoundPipe, candidate).valid).toBe(false)
	})

	it('composes exactly the five shared domain error variants', () => {
		for (const error of [
			{ type: 'invalid-input', issues: [] },
			{ type: 'invalid-output' },
			{ type: 'invalid-storage-output' },
			{ type: 'internal-error' },
			{ type: 'storage-operation-failed' },
		]) {
			expect(v.validate(sharedOperationErrorPipe, error)).toEqual({ valid: true, value: error })
		}
		for (const error of [null, {}, { type: 'invalid-input' }, { type: 'schema-mismatch' }, { type: 'not-found' }]) {
			expect(v.validate(sharedOperationErrorPipe, error).valid).toBe(false)
		}
	})

	it.each([
		['invalid-output', invalidOutputPipe],
		['invalid-storage-output', invalidStorageOutputPipe],
		['internal-error', internalErrorPipe],
		['storage-operation-failed', storageOperationFailedPipe],
	])('keeps shared failure %s type-only and exact', (type, pipe) => {
		expect(v.validate(pipe, { type, message: 'synthetic-secret', cause: 'synthetic-ref', stack: 'synthetic-stack' })).toEqual({
			valid: true,
			value: { type },
		})
		expect(v.validate(pipe, { type: 'unrecognized' }).valid).toBe(false)
		expect(v.validate(pipe, {}).valid).toBe(false)
	})

	it('validates structural invalid-input issues without rewriting paths or messages', () => {
		const boxed: unknown = Object('Invalid input.')
		const candidate = {
			type: 'invalid-input',
			issues: [
				{ message: 'Expected a nonempty string.', value: 'synthetic-secret', cause: 'synthetic-reference' },
				{ path: 'created.by', message: 'Expected attribution by to be a string.' },
				{ path: '', message: 'Expected title text.' },
				{ path: undefined, message: 'is not an object' },
			],
			cause: 'synthetic-error',
		}
		const expected = {
			type: 'invalid-input',
			issues: [
				{ message: 'Expected a nonempty string.' },
				{ path: 'created.by', message: 'Expected attribution by to be a string.' },
				{ path: '', message: 'Expected title text.' },
				{ message: 'is not an object' },
			],
		}
		const parsed = v.validate(invalidInputPipe, candidate)
		expect(parsed).toEqual({ valid: true, value: expected })
		if (!parsed.valid) throw new Error('Expected parsed error in test')
		expect(parsed.value.issues[0]).not.toHaveProperty('path')
		for (const issues of [
			undefined,
			null,
			[null],
			[{ message: 1 }],
			[{}],
			[{ path: null, message: 'Invalid input.' }],
			[{ path: 1, message: 'Invalid input.' }],
			[{ message: { constructor: { name: 'String' } } }],
			[{ path: { constructor: { name: 'String' } }, message: 'Invalid input.' }],
			[{ message: boxed }],
			[{ path: boxed, message: 'Invalid input.' }],
		]) {
			expect(v.validate(invalidInputPipe, { type: 'invalid-input', issues }).valid).toBe(false)
		}
	})

	it('projects ordered static primitive issues without protected values or extra input keys', () => {
		const sentinel = 'synthetic-SECRET-reference'
		const pipe = v.object({ revision: v.object({ id: idPipe, title: titlePipe, version: revisionVersionPipe }) })
		// Collect on this fixture only to exercise projection order; production keeps Valleyed defaults.
		v.compile(pipe, { allErrors: true })
		const invalid = v.validate(pipe, {
			revision: { id: sentinel, title: { [sentinel]: sentinel }, version: { cause: sentinel }, [sentinel]: sentinel },
			value: sentinel,
			valueRef: sentinel,
			cause: sentinel,
			[sentinel]: sentinel,
		})
		if (invalid.valid) throw new Error('Expected invalid input in test')
		const issues = inputIssues(invalid.error)
		const expected = [
			{ path: 'revision.id', message: 'Expected a Core id.' },
			{ path: 'revision.title', message: 'Expected a title.' },
			{ path: 'revision.version', message: 'Expected a positive safe integer.' },
		]
		expect(issues).toEqual(expected)
		expect(v.validate(invalidInputPipe, { type: 'invalid-input', issues })).toEqual({
			valid: true,
			value: { type: 'invalid-input', issues: expected },
		})
		expect(JSON.stringify(issues)).not.toContain(sentinel)
	})

	it('preserves default fail-early nested paths using the actual primitive validators', () => {
		const sentinel = 'synthetic-raw-secret'
		const result = v.validate(v.object({ revision: v.object({ title: titlePipe, id: idPipe }) }), {
			revision: { title: { value: sentinel, [sentinel]: sentinel }, id: sentinel },
		})
		if (result.valid) throw new Error('Expected invalid input in test')
		expect(inputIssues(result.error)).toEqual([{ path: 'revision.title', message: 'Expected a title.' }])
		expect(JSON.stringify(inputIssues(result.error))).not.toContain(sentinel)
		const root = v.validate(titlePipe, { value: sentinel })
		if (root.valid) throw new Error('Expected invalid input in test')
		expect(inputIssues(root.error)).toEqual([{ message: 'Expected a title.' }])
		expect(inputIssues(root.error)[0]).not.toHaveProperty('path')
		expect(JSON.stringify(inputIssues(root.error))).not.toContain(sentinel)
	})
}
