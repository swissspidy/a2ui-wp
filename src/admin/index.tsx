/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Playground } from './playground';
import './admin.css';

domReady( () => {
	const root = document.getElementById( 'a2ui-wp-root' );

	if ( root ) {
		createRoot( root ).render(
			<StrictMode>
				<Playground />
			</StrictMode>
		);
	}
} );
