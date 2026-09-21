/**
 * WordPress dependencies
 */
const defaultConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...defaultConfig,
	testMatch: [ '<rootDir>/tests/js/**/*.test.[jt]s?(x)' ],
	// Some dependencies of @wordpress/components only ship ES modules
	// (`uuid`, and the `.mjs` builds of newer WordPress packages), which Jest
	// cannot load as-is on the Node versions this runs on. Those are handed
	// to Babel; everything else in node_modules is left alone.
	transform: {
		'\\.m?[jt]sx?$': Object.values( defaultConfig.transform )[ 0 ],
	},
	transformIgnorePatterns: [ '/node_modules/(?!uuid/)(?!.*\\.mjs$)' ],
	// Listing a `setupFiles` here replaces the preset's, so its own entry is
	// carried over rather than lost.
	setupFiles: [
		...require( '@wordpress/jest-preset-default/jest-preset' ).setupFiles,
		'<rootDir>/tests/js/setup.ts',
	],
};
