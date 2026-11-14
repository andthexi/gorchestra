import { v, type PipeOutput } from 'valleyed'

import { coreSchema, schemaToPipe } from '../utils/storage/schema'
import { idPipe, nonEmptyTrimmedStringPipe, runtimeRecordPipe } from './commons'

export const sliceArtifactConfigPipe = v.discriminate((value) => value.type, {
	'source-control': v.object({ type: v.eq('source-control'), sliceBranch: nonEmptyTrimmedStringPipe }),
})
export type SliceArtifactConfig = PipeOutput<typeof sliceArtifactConfigPipe>
export type SliceArtifactType = SliceArtifactConfig['type']
export type SourceControlSliceArtifactConfig = Extract<SliceArtifactConfig, { type: 'source-control' }>

export const sliceArtifactSchema = coreSchema('slice_artifacts')
	.field('sliceId', idPipe)
	.field('config', sliceArtifactConfigPipe)
	.field('created', runtimeRecordPipe)
	.build()
export const sliceArtifactPipe = schemaToPipe(sliceArtifactSchema)
export type SliceArtifact = PipeOutput<typeof sliceArtifactPipe>
