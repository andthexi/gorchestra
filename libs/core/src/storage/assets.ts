import { v } from 'valleyed'

import { assetPipe } from '../domain/asset'
import { stored } from './read'

export function storedAssets(value: unknown) {
	const assets = stored(v.array(assetPipe), value)
	if (!assets.ok) return assets
	assets.value.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
	return assets
}
