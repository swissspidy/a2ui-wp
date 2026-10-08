/**
 * External dependencies
 */
const { resolve } = require( 'node:path' );

/**
 * WordPress dependencies
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		admin: resolve( __dirname, 'src/admin/index.tsx' ),
	},
	output: {
		...defaultConfig.output,
		filename: '[name].js',
		path: resolve( __dirname, 'build' ),
	},
	resolve: {
		...defaultConfig.resolve,
		extensions: [ '.ts', '.tsx', '...' ],
		// The plugin builds the package from source; its imports use the
		// `.js` extensions Node's ESM resolution needs in the published files.
		alias: {
			...defaultConfig.resolve?.alias,
			'@swissspidy/a2ui-wp$': resolve(
				__dirname,
				'packages/a2ui-wp/src/index.ts'
			),
		},
		extensionAlias: {
			'.js': [ '.ts', '.tsx', '.js' ],
		},
	},
};
