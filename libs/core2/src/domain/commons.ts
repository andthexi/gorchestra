import { v, type PipeOutput } from 'valleyed'

// Validate primitives before any property access, trimming or date parsing.
export const titlePipe = v
	.custom<string>((value) => typeof value === 'string', 'Expected a title.')
	.pipe(v.asTrimmed(), v.min(1, 'Expected a nonblank title.'))

export const bodyPipe = v.custom<string>((value) => typeof value === 'string', 'Expected a body.')

export const protectedStringPipe = v
	.custom<string>((value) => typeof value === 'string', 'Expected a nonempty string.')
	.pipe(v.min(1, 'Expected a nonempty string.'))

// JavaScript $ also matches before a final newline; enforce exact length too.
export const idPipe = v
	.custom<string>((value) => typeof value === 'string', 'Expected a Core id.')
	.pipe(
		v.custom((value) => value.length === 26 && /^[0-7][0-9a-hjkmnp-tv-z]{25}$/.test(value), 'Expected a Core id.'),
	)

export const revisionVersionPipe = v
	.number('Expected a positive safe integer.')
	.pipe(v.custom((value) => Number.isSafeInteger(value) && value > 0, 'Expected a positive safe integer.'))

export const appliedAtPipe = v
	.number('Expected nonnegative safe milliseconds.')
	.pipe(v.custom((value) => Number.isSafeInteger(value) && value >= 0, 'Expected nonnegative safe milliseconds.'))

const attributionFields = {
	by: v.custom<string>((value) => typeof value === 'string', 'Expected attribution by to be a string.'),
	cid: v.nullable(
		v.custom<string>((value) => typeof value === 'string', 'Expected attribution cid to be a string or null.'),
	),
}
export const attributionPipe = v.object({ ...attributionFields, cid: v.defaults(attributionFields.cid, null) })

export const auditStampPipe = v.object({
	src: v.custom<'local'>((value) => value === 'local', 'Expected a local audit stamp.'),
	at: v
		.custom<string>((value) => typeof value === 'string', 'Expected a UTC ISO timestamp.')
		.pipe(
			v.custom<string>((value) => {
				const time = Date.parse(value)
				return Number.isFinite(time) && new Date(time).toISOString() === value
			}, 'Expected a UTC ISO timestamp.'),
		),
	...attributionFields,
})

export type Id = PipeOutput<typeof idPipe>
export type AuditStamp = PipeOutput<typeof auditStampPipe>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it.each([
		['title', titlePipe, '  Notes É\n', 'Expected a title.'],
		['body', bodyPipe, '  Body É\n', 'Expected a body.'],
		['protected string', protectedStringPipe, '  synthetic-secret É\n', 'Expected a nonempty string.'],
		['id', idPipe, '01k00000000000000000000001', 'Expected a Core id.'],
	])('rejects nonprimitive %s before inspecting or transforming it', (_name, pipe, text, message) => {
		const spoof: unknown = JSON.parse(
			'{"constructor":{"name":"String"},"length":26,"payload":"synthetic-NONSTRING"}',
		)
		const boxed: unknown = Object(text)
		const hostile = {
			get constructor() {
				throw new Error('synthetic-constructor-secret')
			},
		}
		for (const value of [spoof, boxed, hostile]) {
			expect.soft(v.validate(pipe, value)).toMatchObject({ valid: false, error: { messages: [{ message }] } })
		}
	})

	it('rejects spoofed and boxed caller strings before inspecting them', () => {
		const spoof: unknown = JSON.parse('{"constructor":{"name":"String"},"payload":"synthetic-NONSTRING"}')
		const boxed: unknown = Object('  caller É\n')
		const hostile = {
			get constructor() {
				throw new Error('synthetic-constructor-secret')
			},
		}
		for (const value of [spoof, boxed, hostile]) {
			expect.soft(v.validate(attributionPipe, { by: value })).toMatchObject({
				valid: false,
				error: { messages: [{ path: 'by', message: 'Expected attribution by to be a string.' }] },
			})
			expect.soft(v.validate(attributionPipe, { by: '', cid: value })).toMatchObject({
				valid: false,
				error: { messages: [{ path: 'cid', message: 'Expected attribution cid to be a string or null.' }] },
			})
		}
	})

	it.each([
		['src', 'local', 'Expected a local audit stamp.'],
		['by', '  caller É\n', 'Expected attribution by to be a string.'],
		['cid', '  correlation É\n', 'Expected attribution cid to be a string or null.'],
		['at', '2024-02-29T12:34:56.789Z', 'Expected a UTC ISO timestamp.'],
	])('rejects nonprimitive audit %s before inspecting it', (field, text, message) => {
		const stamp = { src: 'local', at: '2024-02-29T12:34:56.789Z', by: '', cid: null }
		const spoof: unknown = JSON.parse('{"constructor":{"name":"String"},"payload":"synthetic-NONSTRING"}')
		const boxed: unknown = Object(text)
		const hostile = {
			get constructor() {
				throw new Error('synthetic-constructor-secret')
			},
		}
		for (const value of [spoof, boxed, hostile]) {
			expect.soft(v.validate(auditStampPipe, { ...stamp, [field]: value })).toMatchObject({
				valid: false,
				error: { messages: [{ path: field, message }] },
			})
		}
	})

	it('keeps nested attribution and protected-string diagnostics schema-owned', () => {
		const sentinel = 'synthetic-PROTECTED-input'
		const pipe = v.object({
			created: attributionPipe,
			content: v.object({ body: bodyPipe, value: protectedStringPipe, valueRef: protectedStringPipe }),
		})
		v.compile(pipe, { allErrors: true })
		const invalidValue = { constructor: { name: 'String' }, length: 1, value: sentinel, [sentinel]: sentinel }
		const invalid = v.validate(pipe, {
			created: { by: invalidValue, cid: invalidValue, [sentinel]: sentinel },
			content: { body: invalidValue, value: invalidValue, valueRef: invalidValue, [sentinel]: sentinel },
			[sentinel]: sentinel,
		})
		if (invalid.valid) throw new Error('Expected invalid input in test')
		expect(invalid.error.messages).toMatchObject([
			{ path: 'created.by', message: 'Expected attribution by to be a string.' },
			{ path: 'created.cid', message: 'Expected attribution cid to be a string or null.' },
			{ path: 'content.body', message: 'Expected a body.' },
			{ path: 'content.value', message: 'Expected a nonempty string.' },
			{ path: 'content.valueRef', message: 'Expected a nonempty string.' },
		])
	})

	it('validates exact local UTC ISO audit stamps and strips undeclared fields', () => {
		const stamp = { src: 'local', at: '2024-02-29T12:34:56.789Z', by: '', cid: '  call\n' }
		expect(v.validate(auditStampPipe, { ...stamp, ignored: 'synthetic-protected' })).toEqual({
			valid: true,
			value: stamp,
		})
		expect(
			v.validate(auditStampPipe, { src: 'local', at: '1970-01-01T00:00:00.000Z', by: ' ', cid: null }),
		).toEqual({
			valid: true,
			value: { src: 'local', at: '1970-01-01T00:00:00.000Z', by: ' ', cid: null },
		})
		for (const at of [
			'2024-02-30T12:34:56.789Z',
			'2024-02-29',
			'2024-02-29T12:34:56.789+00:00',
			' 2024-02-29T12:34:56.789Z',
			'2024-02-29T12:34:56.789Z\n',
			'2024-02-29T12:34:56Z',
			'invalid',
			0,
			new Date(0),
		]) {
			expect(v.validate(auditStampPipe, { ...stamp, at }).valid).toBe(false)
		}
		for (const value of [
			{ ...stamp, src: 'imported' },
			{ ...stamp, by: null },
			{ src: 'local', at: stamp.at },
			null,
		]) {
			expect(v.validate(auditStampPipe, value).valid).toBe(false)
		}
	})

	it('requires stored audit cid instead of defaulting missing or undefined values', () => {
		const stamp = { src: 'local', at: '2024-02-29T12:34:56.789Z', by: '  caller É\n' }
		for (const candidate of [stamp, { ...stamp, cid: undefined }]) {
			expect.soft(v.validate(auditStampPipe, candidate)).toMatchObject({
				valid: false,
				error: { messages: [{ path: 'cid', message: 'Expected attribution cid to be a string or null.' }] },
			})
		}
		for (const cid of [null, '', '  correlation É\n']) {
			expect(v.validate(auditStampPipe, { ...stamp, cid })).toEqual({ valid: true, value: { ...stamp, cid } })
		}
		expect(stamp).not.toHaveProperty('cid')
	})

	it('copies exact caller strings and defaults only omitted cid to null', () => {
		expect(v.validate(attributionPipe, { by: '' })).toEqual({ valid: true, value: { by: '', cid: null } })
		for (const cid of ['', ' 	\n ', null, undefined]) {
			const input = { by: '  caller É\n', cid, ignored: 'synthetic-secret' }
			expect(v.validate(attributionPipe, input)).toEqual({
				valid: true,
				value: { by: '  caller É\n', cid: cid ?? null },
			})
		}
		for (const value of [{}, { by: null }, { by: 1 }, { by: '', cid: 1 }, { by: '', cid: {} }]) {
			expect(v.validate(attributionPipe, value).valid).toBe(false)
		}
	})

	it('accepts nonnegative safe millisecond timestamps without coercion', () => {
		for (const value of [0, 1, 1735689600000, 9007199254740991]) {
			expect(v.validate(appliedAtPipe, value)).toEqual({ valid: true, value })
		}
		for (const value of [-1, 1.5, 9007199254740992, NaN, Infinity, '0', 0n, null]) {
			expect(v.validate(appliedAtPipe, value).valid).toBe(false)
		}
	})

	it('requires positive safe integer revisions without coercion', () => {
		for (const value of [1, 2, 9007199254740991]) {
			expect(v.validate(revisionVersionPipe, value)).toEqual({ valid: true, value })
		}
		for (const value of [0, -0, -1, 1.5, 9007199254740992, NaN, Infinity, -Infinity, '1', 1n, null]) {
			expect(v.validate(revisionVersionPipe, value).valid).toBe(false)
		}
	})

	it('accepts only exact lowercase ULIDs without overflow or repair', () => {
		for (const value of [
			'00000000000000000000000000',
			'01k00000000000000000000001',
			'7zzzzzzzzzzzzzzzzzzzzzzzzz',
		]) {
			expect(v.validate(idPipe, value)).toEqual({ valid: true, value })
		}
		for (const value of [
			'',
			'01K00000000000000000000001',
			' 01k00000000000000000000001',
			'01k00000000000000000000001 ',
			'01k00000000000000000000001\n',
			'8zzzzzzzzzzzzzzzzzzzzzzzzz',
			'01k0000000000000000000000',
			'01k000000000000000000000001',
			'01i00000000000000000000001',
			'01l00000000000000000000001',
			'01o00000000000000000000001',
			'01u00000000000000000000001',
			1,
			null,
		]) {
			expect(v.validate(idPipe, value).valid, String(value)).toBe(false)
		}
	})

	it('requires nonempty raw values and references without changing whitespace', () => {
		expect(v.validate(protectedStringPipe, '').valid).toBe(false)
		for (const value of ['   ', '	\r\n', '  synthetic:protected-É\n']) {
			expect(v.validate(protectedStringPipe, value)).toEqual({ valid: true, value })
		}
		for (const value of [null, undefined, 1, {}, ['secret']]) {
			expect(v.validate(protectedStringPipe, value).valid).toBe(false)
		}
	})

	it('preserves exact bodies including empty text', () => {
		for (const value of ['', ' 	\n', '  Body\r\nÉ  ']) {
			expect(v.validate(bodyPipe, value)).toEqual({ valid: true, value })
		}
		for (const value of [null, undefined, 1, {}, ['body']]) {
			expect(v.validate(bodyPipe, value).valid).toBe(false)
		}
	})

	it('trims only title edges and rejects blank titles', () => {
		expect(v.validate(titlePipe, ' \t Notes  É\nSecond line \r\n')).toEqual({
			valid: true,
			value: 'Notes  É\nSecond line',
		})
		expect(v.validate(titlePipe, ' \t\n').valid).toBe(false)
		expect(v.validate(titlePipe, '').valid).toBe(false)
		for (const value of [null, undefined, 1, {}, ['Notes']]) {
			expect(v.validate(titlePipe, value).valid).toBe(false)
		}
	})
}
