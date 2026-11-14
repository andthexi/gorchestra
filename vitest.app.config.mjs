import { defineConfig } from 'vitest/config'

export default defineConfig({
	envDir: false,
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		includeSource: ['src/**/*.ts'],
		exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
		pool: 'threads',
	},
})
