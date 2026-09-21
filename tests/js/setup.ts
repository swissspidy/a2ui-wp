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

// Vitest globals are disabled, so Testing Library cannot register its
// cleanup automatically.
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

let previousIsReactActEnvironment: unknown;

beforeAll( () => {
	previousIsReactActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
} );

afterAll( () => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = previousIsReactActEnvironment;
} );

afterEach( cleanup );
