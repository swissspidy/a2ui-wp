<?php
/**
 * PHPStan bootstrap file.
 *
 * Defines the constants the plugin sets at runtime, without running the plugin
 * file itself, as that would call WordPress functions that do not exist during
 * analysis.
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

define( 'A2UI_WP_FILE', dirname( __DIR__, 2 ) . '/a2ui-wp.php' );
define( 'A2UI_WP_DIR', dirname( __DIR__, 2 ) );
