import type { PipeOutput } from 'valleyed'

import type { attributionPipe } from '../domain/commons'
import type { Result } from '../errors'
import { operations } from '../operations'
import { bindTree } from '../runtime/bind-tree'
import type { Owner } from '../runtime/owner'
import { exportSnapshot, importSnapshot } from './snapshot'
import type { SnapshotError } from './snapshot'

export let issuePortfolio: (owner: Owner, attribution: PipeOutput<typeof attributionPipe>) => Portfolio

export class Portfolio {
	readonly projects: ReturnType<typeof bindTree<typeof operations>>['projects']
	readonly secrets: ReturnType<typeof bindTree<typeof operations>>['secrets']
	readonly memories: ReturnType<typeof bindTree<typeof operations>>['memories']
	readonly export: (input: { passphrase: string }) => Promise<Result<string, SnapshotError>>
	readonly import: (input: { snapshot: string; passphrase: string }) => Promise<Result<void, SnapshotError>>
	private constructor(owner: Owner, attribution: PipeOutput<typeof attributionPipe>) {
		const bound = bindTree(operations, owner, attribution)
		this.projects = bound.projects
		this.secrets = bound.secrets
		this.memories = bound.memories
		this.export = (input) => exportSnapshot(owner, input)
		this.import = (input) => importSnapshot(owner, input)
	}
	static {
		issuePortfolio = (owner, attribution) => new Portfolio(owner, attribution)
	}
}
