import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig( {
	plugins: [ react() ],
	root: 'demo',
	base: './',
	build: {
		outDir: '../demo-dist',
		emptyOutDir: true,
	},
	test: {
		root: '.',
		environment: 'jsdom',
		include: [ 'test/**/*.test.{ts,tsx}' ],
		setupFiles: [ 'test/setup.ts' ],
		css: false,
	},
} );
