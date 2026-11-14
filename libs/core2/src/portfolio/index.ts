import type { PipeOutput } from 'valleyed'

import type { attributionPipe } from '../domain/commons'
import { operations } from '../operations'
import { bindTree } from '../runtime/bind-tree'
import type { Owner } from '../runtime/owner'

export let issuePortfolio: (owner: Owner, attribution: PipeOutput<typeof attributionPipe>) => Portfolio

export class Portfolio {
	readonly projects: ReturnType<typeof bindTree<typeof operations>>['projects']
	readonly secrets: ReturnType<typeof bindTree<typeof operations>>['secrets']
	private constructor(owner: Owner, attribution: PipeOutput<typeof attributionPipe>) {
		const bound = bindTree(operations, owner, attribution)
		this.projects = bound.projects
		this.secrets = bound.secrets
	}
	static {
		issuePortfolio = (owner, attribution) => new Portfolio(owner, attribution)
	}
}
