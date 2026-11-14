import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { v } from 'valleyed'

function pnpm(args) {
	const result = spawnSync('pnpm', ['--npmrc-auth-file=/dev/null', ...args], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
		timeout: 60_000,
		maxBuffer: 16 * 1024 * 1024,
	})
	if (result.error || result.status !== 0) throw new Error('Dependency policy command failed')
	return result.stdout
}

const manifest = v.validate(
	v.fromJson(
		v.object({
			packageManager: v
				.string()
				.pipe(v.custom((value) => /^pnpm@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))),
		}),
	),
	readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
if (!manifest.valid) throw new Error('Invalid pinned packageManager')

const pnpmVersion = pnpm(['--version']).trim()
if (manifest.value.packageManager !== `pnpm@${pnpmVersion}`) throw new Error('pnpm does not match packageManager')

const nodeVersion = v.validate(v.fromJson(v.string()), pnpm(['config', 'get', 'nodeVersion', '--json']))
if (!nodeVersion.valid) throw new Error('Missing Node compatibility version')
if (process.versions.node !== nodeVersion.value)
	throw new Error('Node does not match the configured compatibility version')

const overrides = v.validate(
	v.fromJson(v.object({ equipped: v.string(), valleyed: v.string() })),
	pnpm(['config', 'get', 'overrides', '--json']),
)
if (!overrides.valid) throw new Error('Missing canonical dependency overrides')

const tree = v.lazy(() =>
	v.object({
		version: v.optional(v.string()),
		dependencies: v.optional(v.record(v.string(), tree)),
		devDependencies: v.optional(v.record(v.string(), tree)),
		optionalDependencies: v.optional(v.record(v.string(), tree)),
	}),
)
const list = v.fromJson(v.array(tree).pipe(v.min(1)))
const result = v.validate(
	list,
	pnpm([
		'--filter',
		'@gorchestra/core2',
		'--fail-if-no-match',
		'list',
		'equipped',
		'valleyed',
		'--depth',
		'Infinity',
		'--json',
	]),
)
if (!result.valid) throw new Error('Invalid dependency listing')

const pending = [...result.value]
const counts = { equipped: 0, valleyed: 0 }
while (pending.length) {
	const node = pending.pop()
	for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
		for (const [name, dependency] of Object.entries(node[section] ?? {})) {
			if (Object.hasOwn(counts, name)) {
				if (dependency.version !== overrides.value[name])
					throw new Error('Dependency does not match its canonical override')
				counts[name]++
			}
			pending.push(dependency)
		}
	}
}
if (!counts.equipped || !counts.valleyed) throw new Error('Dependency listing is incomplete')
process.stdout.write(`Core2 resolutions verified: ${JSON.stringify(counts)}\n`)
process.stdout.write(`Toolchain verified: Node ${process.versions.node}, pnpm ${pnpmVersion}\n`)
