import { describe, expect, it } from 'vitest';
import { A2UIProcessor } from '@swissspidy/a2ui-wp';
import { examples } from '../../src/admin/examples';

describe( 'playground examples', () => {
	it.each( examples.map( ( example ) => [ example.name, example ] ) )(
		'%s processes and has a root',
		( _name, example ) => {
			const processor = new A2UIProcessor();
			processor.processMessages( example.messages );
			for ( const surface of processor.surfaces.values() ) {
				expect( surface.componentsModel.has( surface.rootId ) ).toBe(
					true
				);
			}
		}
	);
} );
