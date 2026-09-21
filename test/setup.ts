// jsdom lacks a few browser APIs that @wordpress/components touches.
if ( typeof window !== 'undefined' ) {
	if ( ! window.matchMedia ) {
		window.matchMedia = ( query: string ) =>
			( {
				matches: false,
				media: query,
				onchange: null,
				addListener: () => {},
				removeListener: () => {},
				addEventListener: () => {},
				removeEventListener: () => {},
				dispatchEvent: () => false,
			} ) as MediaQueryList;
	}
	if ( ! window.ResizeObserver ) {
		window.ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		} as unknown as typeof ResizeObserver;
	}
}

// Vitest does not expose globals, so React Testing Library cannot register
// its automatic cleanup. Do it explicitly.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach( () => {
	cleanup();
} );
