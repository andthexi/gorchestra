import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto'

import type { PipeOutput } from 'valleyed'

import type { Id } from '../domain/commons'
import type { secretValuePipe } from '../domain/secret'
import type { secretProtectionPipe } from '../domain/secret-protection'

export const SECRET_PROTECTION_ID = '01k00000000000000000000000' as Id
const MARKER = Buffer.from('gorchestra-secret-protection-v1', 'utf8')
const VERIFIER_CONTEXT = 'gorchestra:secret-protection:verifier:v1'
const VALUE_CONTEXT = 'gorchestra:secret-value:v1'

type EncryptedPayload = Extract<PipeOutput<typeof secretValuePipe>, { mode: 'encrypted' }>

export function parseEncryptionKey(value: string | null): Buffer | null {
	if (value === null) return null
	if (typeof value !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(value)) throw new Error('Invalid encryption key.')
	const key = Buffer.from(value, 'base64')
	if (key.length !== 32 || key.toString('base64') !== value) throw new Error('Invalid encryption key.')
	return key
}

function aad(context: string, protectionId: Id, secretId?: Id) {
	return Buffer.from(
		secretId === undefined ? `${context}\0${protectionId}` : `${context}\0${protectionId}\0${secretId}`,
		'utf8',
	)
}

function encrypt(key: Buffer, plaintext: Buffer, associatedData: Buffer): EncryptedPayload {
	const nonce = randomBytes(12)
	const cipher = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 })
	cipher.setAAD(associatedData)
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
	return {
		mode: 'encrypted',
		nonce: nonce.toString('base64'),
		ciphertext: ciphertext.toString('base64'),
		tag: cipher.getAuthTag().toString('base64'),
	}
}

function decrypt(key: Buffer, payload: EncryptedPayload, associatedData: Buffer): Buffer {
	const nonce = Buffer.from(payload.nonce, 'base64')
	const ciphertext = Buffer.from(payload.ciphertext, 'base64')
	const tag = Buffer.from(payload.tag, 'base64')
	if (
		nonce.length !== 12 ||
		tag.length !== 16 ||
		nonce.toString('base64') !== payload.nonce ||
		tag.toString('base64') !== payload.tag ||
		ciphertext.toString('base64') !== payload.ciphertext
	)
		throw new Error('Invalid encrypted Secret value.')
	const decipher = createDecipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 })
	decipher.setAAD(associatedData)
	decipher.setAuthTag(tag)
	return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

export function createProtection(key: Buffer | null): PipeOutput<typeof secretProtectionPipe> {
	return key === null
		? { id: SECRET_PROTECTION_ID, spec: { mode: 'plaintext' } }
		: {
				id: SECRET_PROTECTION_ID,
				spec: {
					mode: 'encrypted',
					verifier: encrypt(key, MARKER, aad(VERIFIER_CONTEXT, SECRET_PROTECTION_ID)),
				},
			}
}

export function authenticateProtection(protection: PipeOutput<typeof secretProtectionPipe>, key: Buffer | null) {
	if (protection.id !== SECRET_PROTECTION_ID) throw new Error('Invalid Secret protection.')
	if (protection.spec.mode === 'plaintext') {
		if (key !== null) throw new Error('Secret protection mismatch.')
		return
	}
	if (key === null) throw new Error('Secret protection mismatch.')
	const marker = decrypt(
		key,
		{ mode: 'encrypted', ...protection.spec.verifier },
		aad(VERIFIER_CONTEXT, protection.id),
	)
	if (marker.length !== MARKER.length || !timingSafeEqual(marker, MARKER))
		throw new Error('Secret protection mismatch.')
}

export function createSecretHelpers(protection: PipeOutput<typeof secretProtectionPipe>, key: Buffer | null) {
	authenticateProtection(protection, key)
	return {
		matches(value: PipeOutput<typeof secretValuePipe>) {
			return value.mode === protection.spec.mode
		},
		encode(secretId: Id, value: string): PipeOutput<typeof secretValuePipe> {
			if (protection.spec.mode === 'plaintext') return { mode: 'plaintext', plaintext: value }
			if (key === null) throw new Error('Secret protection mismatch.')
			return encrypt(key, Buffer.from(value, 'utf16le'), aad(VALUE_CONTEXT, protection.id, secretId))
		},
		decode(secretId: Id, value: PipeOutput<typeof secretValuePipe>): string {
			if (protection.spec.mode === 'plaintext') {
				if (value.mode !== 'plaintext') throw new Error('Secret protection mismatch.')
				return value.plaintext
			}
			if (value.mode !== 'encrypted' || key === null) throw new Error('Secret protection mismatch.')
			return decrypt(key, value, aad(VALUE_CONTEXT, protection.id, secretId)).toString('utf16le')
		},
	}
}
