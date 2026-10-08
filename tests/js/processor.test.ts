import { describe, expect, it, vi } from 'vitest';
import { createFunctionImplementation } from '@a2ui/web_core/v0_9';
import { OpenUrlApi } from '@a2ui/web_core/v0_9/basic_catalog';
import {
	A2UIProcessor,
	type ActionMessage,
	type ClientMessage,
} from '@swissspidy/a2ui-wp';

const CATALOG =
	'https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json';

const create = ( surfaceId = 's1' ) => ( {
	version: 'v0.9.1',
	createSurface: { surfaceId, catalogId: CATALOG, sendDataModel: true },
} );

describe( 'A2UIProcessor', () => {
	it( 'notifies subscribers about surfaces, components and data', () => {
		const processor = new A2UIProcessor();
		const listener = vi.fn();
		processor.subscribe( listener );

		processor.processMessage( create() );
		expect( processor.getSurface( 's1' ) ).toBeDefined();
		const calls = () => listener.mock.calls.length;
		let seen = calls();
		expect( seen ).toBeGreaterThan( 0 );

		processor.processMessage( {
			version: 'v0.9.1',
			updateComponents: {
				surfaceId: 's1',
				components: [ { id: 'root', component: 'Text', text: 'hi' } ],
			},
		} );
		expect(
			processor.getSurface( 's1' )?.componentsModel.get( 'root' )?.type
		).toBe( 'Text' );
		expect( calls() ).toBeGreaterThan( seen );
		seen = calls();

		processor.processMessage( {
			version: 'v0.9.1',
			updateComponents: {
				surfaceId: 's1',
				components: [ { id: 'root', component: 'Text', text: 'ho' } ],
			},
		} );
		expect( calls() ).toBeGreaterThan( seen );
		seen = calls();

		processor.processMessage( {
			version: 'v0.9.1',
			updateDataModel: { surfaceId: 's1', path: '/a/b', value: 1 },
		} );
		expect( processor.getSurface( 's1' )?.dataModel.get( '/a/b' ) ).toBe(
			1
		);
		expect( calls() ).toBeGreaterThan( seen );
		seen = calls();

		processor.processMessage( {
			version: 'v0.9.1',
			deleteSurface: { surfaceId: 's1' },
		} );
		expect( processor.getSurface( 's1' ) ).toBeUndefined();
		expect( calls() ).toBeGreaterThan( seen );
		expect( processor.getVersion() ).toBe( calls() );
	} );

	it( 'rejects invalid messages', () => {
		const processor = new A2UIProcessor();
		expect( () =>
			processor.processMessage( {
				version: 'v0.9.1',
				updateComponents: { surfaceId: 'nope', components: [] },
			} )
		).toThrow();
		processor.processMessage( create() );
		expect( () => processor.processMessage( create() ) ).toThrow();
	} );

	it( 'processes JSON Lines and collects errors without stopping', () => {
		const processor = new A2UIProcessor();
		const errors = processor.processJsonl(
			[
				JSON.stringify( create() ),
				'not json',
				'',
				JSON.stringify( {
					version: 'v0.9.1',
					updateDataModel: { surfaceId: 's1', value: { ok: true } },
				} ),
			].join( '\n' )
		);
		expect( errors ).toHaveLength( 1 );
		expect( errors[ 0 ].line ).toBe( 2 );
		expect( processor.getSurface( 's1' )?.dataModel.get( '/ok' ) ).toBe(
			true
		);
	} );

	it( 'dispatches actions with context resolved in scope', async () => {
		const processor = new A2UIProcessor();
		const actions: ActionMessage[] = [];
		const messages: ClientMessage[] = [];
		processor.onAction( ( message ) => actions.push( message ) );
		processor.onClientMessage( ( message ) => messages.push( message ) );
		processor.processMessages( [
			create(),
			{
				version: 'v0.9.1',
				updateComponents: {
					surfaceId: 's1',
					components: [ { id: 'btn', component: 'Text', text: '' } ],
				},
			},
			{
				version: 'v0.9.1',
				updateDataModel: {
					surfaceId: 's1',
					value: {
						items: [ { id: 'i1' }, { id: 'i2' } ],
						note: 'n',
					},
				},
			},
		] );

		processor.dispatchAction(
			's1',
			'btn',
			{
				event: {
					name: 'pick',
					context: {
						id: { path: 'id' },
						note: { path: '/note' },
						fixed: 1,
					},
				},
			},
			'/items/1'
		);
		await Promise.resolve();

		expect( actions ).toHaveLength( 1 );
		expect( actions[ 0 ].version ).toBe( 'v0.9.1' );
		expect( actions[ 0 ].action ).toMatchObject( {
			name: 'pick',
			surfaceId: 's1',
			sourceComponentId: 'btn',
			context: { id: 'i2', note: 'n', fixed: 1 },
		} );
		expect( messages ).toEqual( actions );
	} );

	it( 'runs local function-call actions', () => {
		const openUrl = vi.fn();
		const processor = new A2UIProcessor( {
			functions: [
				createFunctionImplementation( OpenUrlApi, ( args ) =>
					openUrl( args.url )
				),
			],
		} );
		processor.processMessages( [
			create(),
			{
				version: 'v0.9.1',
				updateComponents: {
					surfaceId: 's1',
					components: [ { id: 'btn', component: 'Text', text: '' } ],
				},
			},
		] );
		processor.dispatchAction( 's1', 'btn', {
			functionCall: {
				call: 'openUrl',
				args: { url: 'https://wordpress.org/' },
			},
		} );
		expect( openUrl ).toHaveBeenCalledWith( 'https://wordpress.org/' );
	} );

	it( 'exposes the client data model', () => {
		const processor = new A2UIProcessor();
		processor.processMessages( [
			create(),
			{
				version: 'v0.9.1',
				createSurface: { surfaceId: 's2', catalogId: CATALOG },
			},
			{
				version: 'v0.9.1',
				updateDataModel: { surfaceId: 's1', value: { a: 1 } },
			},
		] );
		expect( processor.getClientDataModel() ).toEqual( {
			version: 'v0.9.1',
			surfaces: { s1: { a: 1 } },
		} );
	} );
} );
