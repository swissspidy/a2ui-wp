/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'A2UI playground', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.visitAdminPage( 'tools.php', 'page=a2ui-wp' );
	} );

	test( 'renders an example with WordPress components and reports actions', async ( {
		page,
	} ) => {
		await page.getByRole( 'button', { name: 'Render all' } ).click();

		const stage = page.locator( '.a2ui-wp-surface' );

		await expect(
			stage.getByRole( 'heading', { name: 'Matt Wordsworth' } )
		).toBeVisible();

		await stage.getByRole( 'button', { name: 'Follow' } ).click();

		const log = page.locator( '.a2ui-wp-playground__log' );

		await expect( log ).toContainText( '"name": "follow_user"' );
		await expect( log ).toContainText( '"userId": "u_42"' );
	} );

	test( 'binds inputs to the data model and gates the submit button', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'combobox', { name: 'Example' } )
			.selectOption( { label: 'Sign-up form (validation)' } );
		await page.getByRole( 'button', { name: 'Render all' } ).click();

		const stage = page.locator( '.a2ui-wp-surface' );
		const submit = stage.getByRole( 'button', { name: 'Create account' } );

		await expect( submit ).toHaveAttribute( 'aria-disabled', 'true' );

		await stage
			.getByRole( 'textbox', { name: 'Display name' } )
			.fill( 'Ada Lovelace' );
		await stage
			.getByRole( 'textbox', { name: 'Email' } )
			.fill( 'ada@example.com' );
		await stage
			.getByRole( 'checkbox', {
				name: 'I agree to the terms of service',
			} )
			.check();

		await expect( submit ).not.toHaveAttribute( 'aria-disabled', 'true' );

		await submit.click();

		const log = page.locator( '.a2ui-wp-playground__log' );

		await expect( log ).toContainText( '"name": "create_account"' );
		await expect( log ).toContainText( '"email": "ada@example.com"' );
	} );

	test( 'steps through a stream one message at a time', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'combobox', { name: 'Example' } )
			.selectOption( { label: 'Live updates (stream)' } );

		const next = page.getByRole( 'button', { name: /Next message/ } );

		// createSurface, a component without a root, and the data model.
		await next.click();
		await next.click();
		await next.click();
		await expect( page.locator( '.a2ui-wp-surface' ) ).toHaveCount( 0 );

		// The root arrives.
		await next.click();
		await expect(
			page.getByRole( 'heading', { name: 'Deploying example.com — 0%' } )
		).toBeVisible();

		// A data model patch re-renders the bound text.
		await next.click();
		await expect(
			page.getByRole( 'heading', { name: 'Deploying example.com — 35%' } )
		).toBeVisible();
	} );
} );
