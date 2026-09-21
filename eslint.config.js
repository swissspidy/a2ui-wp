/**
 * WordPress dependencies
 */
const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaultConfig,

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
