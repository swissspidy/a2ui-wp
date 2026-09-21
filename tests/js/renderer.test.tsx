import { act, fireEvent, render, screen } from '@testing-library/react';
import { A2UIProcessor } from '../../src/core/processor';
import { A2UIRenderer } from '../../src/react/renderer';
import type { ActionMessage } from '../../src/core/types';

const CATALOG =
	'https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json';

function setup() {
	const processor = new A2UIProcessor();
	const actions: ActionMessage[] = [];
	processor.onAction( ( message ) => actions.push( message ) );
	processor.processMessages( [
		{
			version: 'v0.9.1',
			createSurface: { surfaceId: 's', catalogId: CATALOG },
		},
		{
			version: 'v0.9.1',
			updateComponents: {
				surfaceId: 's',
				components: [
					{
						id: 'root',
						component: 'Column',
						children: [
							'title',
							'list',
							'field',
							'echo',
							'submit',
						],
					},
					{
						id: 'title',
						component: 'Text',
						variant: 'h2',
						text: {
							call: 'formatString',
							args: { value: 'Hello ${/user}' },
						},
					},
					{
						id: 'list',
						component: 'List',
						children: { path: '/items', componentId: 'item' },
					},
					{ id: 'item', component: 'Text', text: { path: 'name' } },
					{
						id: 'field',
						component: 'TextField',
						label: 'Name',
						value: { path: '/user' },
					},
					{
						id: 'echo',
						component: 'Text',
						text: {
							call: 'formatString',
							args: { value: 'Echo: ${/user}' },
						},
					},
					{ id: 'submit-label', component: 'Text', text: 'Submit' },
					{
						id: 'submit',
						component: 'Button',
						child: 'submit-label',
						checks: [
							{
								condition: {
									call: 'required',
									args: { value: { path: '/user' } },
								},
								message: 'Name required',
							},
						],
						action: {
							event: {
								name: 'submit',
								context: { user: { path: '/user' } },
							},
						},
					},
				],
			},
		},
		{
			version: 'v0.9.1',
			updateDataModel: {
				surfaceId: 's',
				value: {
					user: 'Ada',
					items: [ { name: 'One' }, { name: 'Two' } ],
				},
			},
		},
	] );
	return { processor, actions };
}

describe( 'A2UIRenderer', () => {
	it( 'renders the surface with WordPress components and expands templates', () => {
		const { processor } = setup();
		render( <A2UIRenderer processor={ processor } /> );
		expect( screen.getByRole( 'heading', { level: 2 } ).textContent ).toBe(
			'Hello Ada'
		);
		expect( screen.getByText( 'One' ) ).toBeTruthy();
		expect( screen.getByText( 'Two' ) ).toBeTruthy();
		expect(
			( screen.getByLabelText( 'Name' ) as HTMLInputElement ).value
		).toBe( 'Ada' );
	} );

	it( 'two-way binds inputs and re-renders on data model updates', () => {
		const { processor } = setup();
		render( <A2UIRenderer processor={ processor } /> );
		fireEvent.change( screen.getByLabelText( 'Name' ), {
			target: { value: 'Grace' },
		} );
		expect( processor.getSurface( 's' )?.dataModel.get( '/user' ) ).toBe(
			'Grace'
		);
		expect( screen.getByText( 'Echo: Grace' ) ).toBeTruthy();

		act( () => {
			processor.processMessage( {
				version: 'v0.9.1',
				updateDataModel: {
					surfaceId: 's',
					path: '/items/2',
					value: { name: 'Three' },
				},
			} );
		} );
		expect( screen.getByText( 'Three' ) ).toBeTruthy();
	} );

	it( 'dispatches button actions and disables buttons whose checks fail', () => {
		const { processor, actions } = setup();
		render( <A2UIRenderer processor={ processor } /> );
		const button = screen.getByRole( 'button', { name: /Submit/ } );
		fireEvent.click( button );
		expect( actions ).toHaveLength( 1 );
		expect( actions[ 0 ].action ).toMatchObject( {
			name: 'submit',
			sourceComponentId: 'submit',
			context: { user: 'Ada' },
		} );

		fireEvent.change( screen.getByLabelText( 'Name' ), {
			target: { value: '' },
		} );
		expect(
			screen
				.getByRole( 'button', { name: /Name required|Submit/ } )
				.getAttribute( 'aria-disabled' )
		).toBe( 'true' );
	} );

	it( 'renders nothing for a surface without a root and removes deleted surfaces', () => {
		const processor = new A2UIProcessor();
		processor.processMessage( {
			version: 'v0.9.1',
			createSurface: { surfaceId: 's', catalogId: CATALOG },
		} );
		const { container } = render(
			<A2UIRenderer processor={ processor } emptyState={ <p>empty</p> } />
		);
		expect( container.querySelector( '.a2ui-wp-surface' ) ).toBeNull();
		act( () => {
			processor.processMessage( {
				version: 'v0.9.1',
				deleteSurface: { surfaceId: 's' },
			} );
		} );
		expect( screen.getByText( 'empty' ) ).toBeTruthy();
	} );
} );
