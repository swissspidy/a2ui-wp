import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { A2UIProcessor } from '@swissspidy/a2ui-wp';

const instructions = readFileSync(
	resolve( __dirname, '../../inc/agent-instructions.md' ),
	'utf8'
);

describe( 'agent instructions', () => {
	it( 'contain an example answer the processor accepts', () => {
		const start = instructions.lastIndexOf( '{"messages": [' );
		expect( start ).toBeGreaterThan( -1 );
		const { messages } = JSON.parse( instructions.slice( start ) );

		const processor = new A2UIProcessor();
		processor.processMessages( messages );

		const surface = processor.getSurface( 'main' );
		expect( surface?.componentsModel.has( surface.rootId ) ).toBe( true );
		expect( surface?.dataModel.get( '/form/email' ) ).toBe( '' );
	} );
} );
