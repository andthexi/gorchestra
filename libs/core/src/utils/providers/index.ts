import type { CoreServices } from '../../services'
import type { CoreTransactions } from '../transactions'
import { createModelProviderProtocolProviders, type ModelProviderProtocolProviders } from './model-provider-protocol'
import { createSourceControlProviders, type SourceControlProviders } from './source-control'

export interface CoreProviders {
	sourceControl: SourceControlProviders
	modelProviderProtocols: ModelProviderProtocolProviders
}

export function createCoreProviders(services: CoreServices, transactions: CoreTransactions): CoreProviders {
	return {
		sourceControl: createSourceControlProviders(services),
		modelProviderProtocols: createModelProviderProtocolProviders(services, transactions),
	}
}
