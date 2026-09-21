<?php
/**
 * Plugin Name:       A2UI for WordPress
 * Plugin URI:        https://github.com/swissspidy/a2ui-wp
 * Description:       Renders agent-generated A2UI surfaces inside wp-admin with the WordPress component library.
 * Version:           0.1.0
 * Author:            Pascal Birchler
 * Author URI:        https://pascalbirchler.com
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * Text Domain:       a2ui-wp
 * Requires at least: 6.8
 * Requires PHP:      8.0
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

namespace A2UIWP;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const VERSION = '0.1.0';

define( 'A2UI_WP_FILE', __FILE__ );
define( 'A2UI_WP_DIR', __DIR__ );

require_once __DIR__ . '/inc/functions.php';
require_once __DIR__ . '/inc/default-filters.php';
