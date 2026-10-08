import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig( {
	oxc: {
		jsx: {
			runtime: 'automatic',
		},
	},
	resolve: {
		alias: {
			'@swissspidy/a2ui-wp': fileURLToPath(
				new URL( './packages/a2ui-wp/src/index.ts', import.meta.url )
			),
		},
	},
	test: {
		environment: 'jsdom',
		globals: false,
		include: [ 'tests/js/**/*.test.{ts,tsx}' ],
		setupFiles: [ 'tests/js/setup.ts' ],
	},
} );
