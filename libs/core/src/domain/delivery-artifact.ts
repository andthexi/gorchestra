import { v, type PipeOutput } from 'valleyed'

import { coreSchema, schemaToPipe } from '../utils/storage/schema'
import { idPipe, nonEmptyTrimmedStringPipe, runtimeRecordPipe } from './commons'

export const deliveryArtifactConfigPipe = v.discriminate((value) => value.type, {
	'source-control': v.object({ type: v.eq('source-control'), deliveryBranch: nonEmptyTrimmedStringPipe }),
})
export type DeliveryArtifactConfig = PipeOutput<typeof deliveryArtifactConfigPipe>
export type DeliveryArtifactType = DeliveryArtifactConfig['type']
export type SourceControlDeliveryArtifactConfig = Extract<DeliveryArtifactConfig, { type: 'source-control' }>

export const deliveryArtifactSchema = coreSchema('delivery_artifacts')
	.field('deliveryId', idPipe)
	.field('config', deliveryArtifactConfigPipe)
	.field('created', runtimeRecordPipe)
	.build()
export const deliveryArtifactPipe = schemaToPipe(deliveryArtifactSchema)
export type DeliveryArtifact = PipeOutput<typeof deliveryArtifactPipe>
