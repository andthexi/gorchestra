import { defineConfig } from 'eslint/config'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import tseslint from 'typescript-eslint'
import browser from 'xi-configs/eslint/browser-ts'
import node from 'xi-configs/eslint/node-ts'
import vue from 'xi-configs/eslint/vue-ts'

const typedFiles = ['src/**/*.ts', 'libs/**/*.ts', 'consumers/**/*.ts']
const clientFiles = ['consumers/server/src/client/**/*.{ts,vue}']
const typedRules = Object.assign({}, ...tseslint.configs.recommendedTypeCheckedOnly.map((config) => config.rules))
const resolver = createTypeScriptImportResolver({
	project: ['tsconfig.eslint.json', 'consumers/server/tsconfig.json'],
})

export default defineConfig([
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/coverage/**',
			'.husky/_/**',
			'.trowel/**',
			'**/.nuxt/**',
			'**/.output/**',
		],
	},
	{
		files: [
			'src/**/*.ts',
			'libs/core/**/*.ts',
			'libs/core2/**/*.ts',
			'libs/form-draft/*.ts',
			'consumers/server/src/server/**/*.ts',
			'consumers/server/*.ts',
			'*.{mjs,cjs}',
			'scripts/*.mjs',
		],
		extends: [node],
	},
	{
		files: ['libs/form-draft/src/**/*.ts', 'consumers/server/src/shared/**/*.ts'],
		extends: [browser],
	},
	{ files: clientFiles, extends: [vue] },
	{
		files: [...typedFiles, ...clientFiles],
		settings: { 'import-x/resolver-next': [resolver] },
	},
	{
		files: typedFiles,
		// Preserve typed checks on TS files; template-only SFCs have no TS program.
		rules: typedRules,
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
				projectService: false,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: clientFiles,
		languageOptions: {
			parserOptions: {
				project: './consumers/server/tsconfig.json',
				projectService: false,
				extraFileExtensions: ['.vue'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ['libs/core2/src/**/*.ts'],
		settings: {
			'import-x/resolver-next': [createTypeScriptImportResolver({ project: 'libs/core2/tsconfig.json' })],
		},
		languageOptions: {
			parserOptions: {
				project: './libs/core2/tsconfig.json',
				projectService: false,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
])
