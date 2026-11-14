import type { InferAdapterConfig, OrmAdapter, OrmAdapterLike } from 'equipped/orm'

export type ServerStorageAdapter = OrmAdapter &
	OrmAdapterLike<unknown> &
	Required<
		Pick<
			OrmAdapter,
			| 'findByPk'
			| 'createMany'
			| 'findMany'
			| 'updateMany'
			| 'session'
			| 'loadMigrations'
			| 'recordMigration'
			| 'applyCreateTable'
			| 'applyAddIndex'
		>
	>

export type ServerStorageConfigResolver<A extends ServerStorageAdapter = ServerStorageAdapter> = (
	name: string,
) => InferAdapterConfig<A>

export type ServerStorageBackend<A extends ServerStorageAdapter = ServerStorageAdapter> = {
	adapter: A
	resolve: ServerStorageConfigResolver<A>
}

export type ServerStorageAdapterFactoryInput = {
	dataDir: string
}

export type ServerStorageAdapterFactory = (
	input: ServerStorageAdapterFactoryInput,
) => ServerStorageBackend | Promise<ServerStorageBackend>
