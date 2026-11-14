import { defineConfig } from 'eslint/config'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import tseslint from 'typescript-eslint'
import node from 'xi-configs/eslint/node-ts'

const typedFiles = ['**/*.{ts,tsx,mts,cts}']
const typedRules = Object.assign({}, ...tseslint.configs.recommendedTypeCheckedOnly.map((config) => config.rules))

export default defineConfig([
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/coverage/**',
			'**/.cache/**',
			'**/.fallow/**',
			'.husky/_/**',
			'.trowel/**',
			'dev/**',
		],
	},
	{
		files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
		extends: [node],
	},
	{
		files: typedFiles,
		rules: typedRules,
		settings: {
			'import-x/resolver-next': [
				createTypeScriptImportResolver({ project: ['tsconfig.json', 'libs/*/tsconfig.json'] }),
			],
		},
		languageOptions: {
			parserOptions: {
				project: true,
				projectService: false,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
])
