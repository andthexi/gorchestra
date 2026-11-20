import { v, type PipeOutput } from 'valleyed'

export const titlePipe = v.string().pipe(v.asTrimmed(), v.min(1))

export const bodyPipe = v.string()

export const protectedStringPipe = v.string().pipe(v.min(1))

export function canonicalBase64Pipe(byteLength?: number) {
	return protectedStringPipe.pipe(
		v.custom((value) => {
			const decoded = Buffer.from(value, 'base64')
			return (
				decoded.toString('base64') === value &&
				decoded.length > 0 &&
				(byteLength === undefined || decoded.length === byteLength)
			)
		}, 'Expected canonical base64 bytes.'),
	)
}

// JavaScript $ also matches before a final newline; enforce exact length too.
export const idPipe = v.string().pipe(
	v.has(26),
	v.custom((value) => /^[0-7][0-9a-hjkmnp-tv-z]{25}$/.test(value), 'Expected a Core id.'),
)

export const revisionVersionPipe = v
	.number()
	.pipe(v.gt(0), v.custom<number>(Number.isSafeInteger, 'Expected a safe integer.'))

export const appliedAtPipe = v
	.number()
	.pipe(v.gte(0), v.custom<number>(Number.isSafeInteger, 'Expected safe integer milliseconds.'))

const attributionFields = {
	by: v.string(),
	cid: v.nullable(v.string()),
}
export const attributionPipe = v.object({ ...attributionFields, cid: v.defaults(attributionFields.cid, null) })

const utcTimestampPipe = v.string().pipe(
	v.custom<string>((value) => {
		const time = Date.parse(value)
		return Number.isFinite(time) && new Date(time).toISOString() === value
	}, 'Expected a UTC ISO timestamp.'),
)
const localAuditStampPipe = v.object({
	src: v.eq('local'),
	at: utcTimestampPipe,
	...attributionFields,
})
const importedAuditStampPipe = v.object({
	src: v.eq('imported'),
	at: utcTimestampPipe,
	iat: utcTimestampPipe,
})
export const auditStampPipe = v.discriminate((value) => value.src, {
	local: localAuditStampPipe,
	imported: importedAuditStampPipe,
})

export type Id = PipeOutput<typeof idPipe>
export type AuditStamp = PipeOutput<typeof auditStampPipe>

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest

	it('exposes the shared domain constraints in generated schemas', () => {
		expect(v.schema(titlePipe)).toMatchObject({ type: 'string', minLength: 1 })
		expect(v.schema(protectedStringPipe)).toMatchObject({ type: 'string', minLength: 1 })
		expect(v.schema(idPipe)).toMatchObject({ type: 'string', minLength: 26, maxLength: 26 })
		expect(v.schema(revisionVersionPipe)).toMatchObject({ type: 'number', exclusiveMinimum: 0 })
		expect(v.schema(appliedAtPipe)).toMatchObject({ type: 'number', minimum: 0 })
		expect(v.schema(attributionPipe)).toMatchObject({
			properties: { by: { type: 'string' }, cid: { oneOf: [{ type: 'string' }, { type: 'null' }] } },
		})
		expect(v.schema(utcTimestampPipe)).toMatchObject({ type: 'string' })
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
				error: { messages: [{ path: 'cid' }] },
			})
		}
		for (const cid of [null, '', '  correlation É\n']) {
			expect(v.validate(auditStampPipe, { ...stamp, cid })).toEqual({ valid: true, value: { ...stamp, cid } })
		}
		expect(stamp).not.toHaveProperty('cid')
	})

	it('validates imported audit stamps, preserves both times, and strips local fields', () => {
		const stamp = {
			src: 'imported' as const,
			at: '2024-02-29T12:34:56.789Z',
			iat: '2026-11-15T01:02:03.004Z',
		}
		expect(v.validate(auditStampPipe, { ...stamp, by: 'removed', cid: 'removed', ignored: true })).toEqual({
			valid: true,
			value: stamp,
		})
		for (const candidate of [
			{ ...stamp, at: '2024-02-29' },
			{ ...stamp, iat: '2026-11-15T01:02:03Z' },
			{ src: 'imported', at: stamp.at },
			{ ...stamp, src: 'other' },
		]) {
			expect(v.validate(auditStampPipe, candidate).valid).toBe(false)
		}
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
