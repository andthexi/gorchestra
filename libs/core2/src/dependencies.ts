import { OrmAdapter, type AnySchema, type InferAdapterConfig, type Migration } from 'equipped/orm'
import { v, PipeError } from 'valleyed'

import type { Id } from './domain/commons'
import type { migrations } from './storage/migrations'

export type StorageAdapter = OrmAdapter &
	Required<
		Pick<
			OrmAdapter,
			| 'use'
			| 'session'
			| 'findByPk'
			| 'findMany'
			| 'createMany'
			| 'updateByPk'
			| 'updateMany'
			| 'loadMigrations'
			| 'recordMigration'
			| 'introspect'
			| 'acquireMigrationLock'
			| 'applyCreateTable'
		>
	>

// Admission proves the supplied implementation supports the fixed Core
// contract. Preserve A here, not in the owner or returned lifecycle views.
type CatalogChange = (typeof migrations)[number]['changes'][number]
type RequiredField = CatalogChange['pk']['type'] | CatalogChange['fields'][number]['type']
type DeclaresField<T extends readonly unknown[], F> = [T] extends [never]
	? false
	: 0 extends 1 & T
		? false
		: T extends readonly [infer Head, ...infer Rest]
			? 0 extends 1 & Head
				? DeclaresField<Rest, F>
				: [Head, F] extends [F, Head]
					? true
					: DeclaresField<Rest, F>
			: false
type MissingFields<T extends readonly unknown[], F = RequiredField> = F extends unknown
	? [DeclaresField<T, F>] extends [true]
		? never
		: F
	: never
type AdapterFitsStorage<A extends StorageAdapter> = A extends unknown
	? [typeof migrations] extends [readonly Migration<A>[]]
		? [MissingFields<A['supportedFieldTypes']>] extends [never]
			? true
			: false
		: false
	: never
// Compare each member with the original whole type. Capability compatibility
// alone cannot keep independently selected adapter/config unions paired.
type IsUnion<A, Whole = A> = A extends unknown ? ([Whole] extends [A] ? false : true) : never
type StorageAdmission<A extends StorageAdapter> = 0 extends 1 & A
	? never
	: [A] extends [never]
		? never
		: [IsUnion<A>] extends [false]
			? [AdapterFitsStorage<A>] extends [true]
				? unknown
				: never
			: never

// Successful custom-pipe values must not collide with Valleyed's error channel.
const isCallback = (value: unknown) => typeof value === 'function' && !(value instanceof PipeError)
const methodPipe = v.custom<(...args: never[]) => unknown>(isCallback, 'Expected a function.')
const adapterMethods = v.object({
	supportedFieldTypes: v
		.array(
			v
				.custom<string>((value) => typeof value === 'string')
				.pipe(v.in(['string', 'number', 'boolean', 'null', 'object', 'array', 'date'])),
		)
		.pipe(v.min(1)),
	use: methodPipe,
	session: methodPipe,
	findByPk: methodPipe,
	findMany: methodPipe,
	createMany: methodPipe,
	updateByPk: methodPipe,
	updateMany: methodPipe,
	loadMigrations: methodPipe,
	recordMigration: methodPipe,
	introspect: methodPipe,
	acquireMigrationLock: methodPipe,
	applyCreateTable: methodPipe,
	connect: v.optional(methodPipe),
	disconnect: v.optional(methodPipe),
})

export function dependenciesPipe() {
	return v.object({
		storage: v.object({
			// Validate without cloning/stripping the native class or losing its receiver.
			adapter: v.custom<StorageAdapter>(
				(value) => value instanceof OrmAdapter && v.validate(adapterMethods, value).valid,
				'Expected a supported native storage adapter.',
			),
			resolveSchema: v.custom<RuntimeDependencies['storage']['resolveSchema']>(isCallback, 'Expected a function.'),
		}),
		secrets: v.object({
			encode: v.custom<RuntimeDependencies['secrets']['encode']>(isCallback, 'Expected a function.'),
			decode: v.custom<RuntimeDependencies['secrets']['decode']>(isCallback, 'Expected a function.'),
		}),
	})
}

// Internal opaque resolver result: only the paired native adapter interprets it.
// Never re-pair a resolver with another adapter or manufacture configurations.
export type RuntimeDependencies = {
	storage: { adapter: StorageAdapter; resolveSchema: (schema: AnySchema) => unknown }
	secrets: {
		encode: (input: { secretId: Id; value: string }) => Promise<string | null>
		decode: (input: { secrets: Array<{ secretId: Id; valueRef: string }> }) => Promise<Record<Id, string | null>>
	}
}

export type CoreDependencies<A extends StorageAdapter> = Omit<RuntimeDependencies, 'storage'> & {
	storage: { adapter: A; resolveSchema: (schema: AnySchema) => InferAdapterConfig<NoInfer<A>> }
} & StorageAdmission<NoInfer<A>>
