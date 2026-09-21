/**
 * WordPress dependencies
 */
const wpPlugin = require( '@wordpress/eslint-plugin' );
const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaultConfig,

	// The default config only applies the unit test globals to JavaScript
	// files; the tests here are TypeScript.
	...wpPlugin.configs[ 'test-unit' ].map( ( config ) => ( {
		...config,
		files: [ 'tests/js/**/*.{ts,tsx}' ],
	} ) ),

	{
		files: [ 'src/**/*.{ts,tsx}' ],
		rules: {
			// The layout primitives the renderer is built on (HStack, VStack,
			// Text, Heading, Divider, ToggleGroupControl) are only exported
			// under experimental names. They have been stable in practice for
			// years and are what wp-admin itself uses; the risk is accepted.
			'@wordpress/no-unsafe-wp-apis': 'off',
		},
	},
];
