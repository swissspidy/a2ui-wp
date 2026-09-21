<?php
/**
 * Adding actions and filters.
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

namespace A2UIWP;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', __NAMESPACE__ . '\register_assets' );
add_action( 'admin_menu', __NAMESPACE__ . '\add_admin_menu' );
add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\enqueue_admin_assets' );
