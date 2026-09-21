<?php
/**
 * Tests for the plugin functions.
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

namespace A2UIWP\Tests;

use WP_UnitTestCase;

use function A2UIWP\add_admin_menu;
use function A2UIWP\enqueue_admin_assets;
use function A2UIWP\get_asset_meta;
use function A2UIWP\register_assets;
use function A2UIWP\render_admin_page;

/**
 * Tests for the plugin's functions.
 */
class Test_Functions extends WP_UnitTestCase {
	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static int $admin_id;

	/**
	 * Sets up shared fixtures.
	 *
	 * @param \WP_UnitTest_Factory $factory Factory.
	 * @return void
	 */
	public static function wpSetUpBeforeClass( $factory ): void {
		self::$admin_id = $factory->user->create( [ 'role' => 'administrator' ] );
	}

	/**
	 * Resets enqueued assets and menus between tests.
	 *
	 * @return void
	 */
	public function tear_down(): void {
		unset( $GLOBALS['wp_scripts'], $GLOBALS['wp_styles'], $GLOBALS['submenu'], $GLOBALS['menu'], $GLOBALS['_registered_pages'] );

		parent::tear_down();
	}

	/**
	 * @covers \A2UIWP\register_assets
	 */
	public function test_register_assets_registers_script_and_style(): void {
		register_assets();

		$this->assertTrue( wp_script_is( 'a2ui-wp-admin', 'registered' ) );
		$this->assertTrue( wp_style_is( 'a2ui-wp-admin', 'registered' ) );
		$this->assertContains( 'wp-components', wp_styles()->registered['a2ui-wp-admin']->deps );
	}

	/**
	 * @covers \A2UIWP\get_asset_meta
	 */
	public function test_get_asset_meta_falls_back_without_a_build(): void {
		$meta = get_asset_meta( 'does-not-exist' );

		$this->assertSame( [], $meta['dependencies'] );
		$this->assertSame( \A2UIWP\VERSION, $meta['version'] );
	}

	/**
	 * @covers \A2UIWP\add_admin_menu
	 */
	public function test_add_admin_menu_adds_page_under_tools(): void {
		wp_set_current_user( self::$admin_id );
		set_current_screen( 'tools.php' );

		add_admin_menu();

		$slugs = array_column( $GLOBALS['submenu']['tools.php'] ?? [], 2 );

		$this->assertContains( 'a2ui-wp', $slugs );

		// The test suite never loads wp-admin/menu.php, so the suffix lacks the
		// `tools_page_` prefix it has in a real admin request; what matters is
		// that the plugin hooks whatever suffix WordPress handed it.
		$hook_suffix = get_plugin_page_hookname( 'a2ui-wp', 'tools.php' );

		$this->assertSame( 10, has_action( "load-$hook_suffix", 'A2UIWP\enqueue_admin_assets' ) );
	}

	/**
	 * @covers \A2UIWP\add_admin_menu
	 */
	public function test_add_admin_menu_does_nothing_for_users_without_capability(): void {
		wp_set_current_user( self::factory()->user->create( [ 'role' => 'subscriber' ] ) );
		set_current_screen( 'tools.php' );

		add_admin_menu();

		$slugs = array_column( $GLOBALS['submenu']['tools.php'] ?? [], 2 );

		$this->assertNotContains( 'a2ui-wp', $slugs );

		$hook_suffix = get_plugin_page_hookname( 'a2ui-wp', 'tools.php' );

		$this->assertFalse( has_action( "load-$hook_suffix", 'A2UIWP\enqueue_admin_assets' ) );
	}

	/**
	 * @covers \A2UIWP\enqueue_admin_assets
	 */
	public function test_enqueue_admin_assets_enqueues_registered_assets(): void {
		register_assets();

		$this->assertFalse( wp_script_is( 'a2ui-wp-admin', 'enqueued' ) );

		enqueue_admin_assets();

		$this->assertTrue( wp_script_is( 'a2ui-wp-admin', 'enqueued' ) );
		$this->assertTrue( wp_style_is( 'a2ui-wp-admin', 'enqueued' ) );
	}

	/**
	 * @covers \A2UIWP\render_admin_page
	 */
	public function test_render_admin_page_outputs_mount_point(): void {
		$output = get_echo( '\A2UIWP\render_admin_page' );

		$this->assertStringContainsString( 'id="a2ui-wp-root"', $output );
	}
}
