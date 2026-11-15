import { Schema } from 'equipped/orm'
import { v } from 'valleyed'

import { requireExplicitId, schemaPipe } from '../storage/schema'
import { canonicalBase64Pipe, idPipe } from './commons'

const encryptedPayloadPipe = v.object({
	nonce: canonicalBase64Pipe(12),
	ciphertext: canonicalBase64Pipe(),
	tag: canonicalBase64Pipe(16),
})

const secretProtectionSpecPipe = v.discriminate(
	(value) => value.mode,
	{
		plaintext: v.object({ mode: v.eq('plaintext') }),
		encrypted: v.object({ mode: v.eq('encrypted'), verifier: encryptedPayloadPipe }),
	},
	'Expected Secret protection.',
)

export const secretProtectionSchema = Schema.from('secret_protection')
	.pk('id', idPipe, requireExplicitId)
	.field('spec', secretProtectionSpecPipe)
	.build()

export const secretProtectionPipe = schemaPipe(secretProtectionSchema)
