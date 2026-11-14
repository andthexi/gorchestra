import { Instance } from 'equipped'
import { v } from 'valleyed'

import { assetPipe, assetSchema } from '../../../domain/asset'
import { secretPipe, secretSchema } from '../../../domain/secret'
import { duplicateAssetPipe, notFoundPipe } from '../../../errors'
import { defineOperation } from '../../../runtime/define-operation'
import { stored, storageCall } from '../../../storage/read'
import { withExplicitId } from '../../../storage/schema'
import { requireProject } from '../require-project'

export const create = defineOperation({
	title: 'Create Asset',
	description: 'Configure an immutable repository target for a Project.',
	input: v.object({ projectId: assetSchema.fields.projectId.pipe, spec: assetSchema.fields.spec.pipe }),
	output: assetPipe,
	error: v.or([v.merge(notFoundPipe, v.object({ resource: v.in(['project', 'secret']) })), duplicateAssetPipe]),
	handler: async (input, context) => {
		const project = await requireProject(context.storage, input.projectId)
		if (!project.ok) return project
		const secretQuery = context.storage.on(secretSchema).one().id(input.spec.source.secretId)
		const secretRead = await storageCall(() => secretQuery.find())
		if (!secretRead.ok) return secretRead
		if (secretRead.value === null)
			return {
				ok: false,
				error: { type: 'not-found', resource: 'secret' as const, id: input.spec.source.secretId },
			}
		const secret = stored(secretPipe, secretRead.value)
		if (!secret.ok) return secret

		const candidatesQuery = context.storage
			.on(assetSchema)
			.all()
			.where((q) => q.eq(assetSchema.fields.projectId, input.projectId))
		const candidatesRead = await storageCall(() => candidatesQuery.find())
		if (!candidatesRead.ok) return candidatesRead
		const candidates = stored(v.array(assetPipe), candidatesRead.value)
		if (!candidates.ok) return candidates
		const duplicate = candidates.value.find(
			(asset) =>
				asset.spec.source.owner.toLowerCase() === input.spec.source.owner.toLowerCase() &&
				asset.spec.source.name.toLowerCase() === input.spec.source.name.toLowerCase(),
		)
		if (duplicate) return { ok: false, error: { type: 'duplicate-asset-target', assetId: duplicate.id } }
		const id = Instance.createId()
		const query = context.storage.on(assetSchema).one()
		return withExplicitId(id, () =>
			storageCall(() =>
				query.create({ id, projectId: input.projectId, spec: input.spec, created: context.stamp }),
			),
		)
	},
})
