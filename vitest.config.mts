import { defineConfig } from 'vitest/config';

export default defineConfig( {
	oxc: {
		jsx: {
			runtime: 'automatic',
		},
	},
	test: {
		environment: 'jsdom',
		globals: false,
		include: [ 'tests/js/**/*.test.{ts,tsx}' ],
		setupFiles: [ 'tests/js/setup.ts' ],
	},
} );
