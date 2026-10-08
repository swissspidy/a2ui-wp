<?php
/**
 * Tests for the agent endpoint.
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

namespace A2UIWP\Tests;

use WP_REST_Request;
use WP_REST_Server;
use WP_UnitTestCase;

use function A2UIWP\build_prompt;
use function A2UIWP\parse_messages;

/**
 * Tests for the agent endpoint.
 */
class Test_Agent extends WP_UnitTestCase {
	private const ROUTE = '/a2ui-wp/v1/agent';

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static int $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	protected static int $subscriber_id;

	/**
	 * Sets up shared fixtures.
	 *
	 * @param \WP_UnitTest_Factory $factory Factory.
	 * @return void
	 */
	public static function wpSetUpBeforeClass( $factory ): void {
		self::$admin_id      = $factory->user->create( [ 'role' => 'administrator' ] );
		self::$subscriber_id = $factory->user->create( [ 'role' => 'subscriber' ] );
	}

	/**
	 * Sets up a fresh REST server for each test.
	 *
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	/**
	 * Resets the REST server.
	 *
	 * @return void
	 */
	public function tear_down(): void {
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Sends a request to the agent endpoint.
	 *
	 * @param array<string, mixed> $body Request body.
	 * @return \WP_REST_Response
	 */
	private function post( array $body ): \WP_REST_Response {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( (string) wp_json_encode( $body ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Answers every request with the given response.
	 *
	 * @param mixed $response Response for the filter to return.
	 * @return void
	 */
	private function answer_with( $response ): void {
		add_filter(
			'a2ui_wp_agent_response',
			static function () use ( $response ) {
				return $response;
			}
		);
	}

	/**
	 * @covers \A2UIWP\register_rest_routes
	 */
	public function test_route_is_registered(): void {
		$this->assertArrayHasKey( self::ROUTE, rest_get_server()->get_routes() );
	}

	/**
	 * @covers \A2UIWP\can_use_agent
	 */
	public function test_requires_manage_options(): void {
		wp_set_current_user( self::$subscriber_id );
		$this->answer_with( [] );

		$response = $this->post( [ 'prompt' => 'A form' ] );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * @covers \A2UIWP\handle_agent_request
	 */
	public function test_rejects_a_missing_prompt(): void {
		wp_set_current_user( self::$admin_id );
		$this->answer_with( [] );

		$response = $this->post( [] );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * @covers \A2UIWP\handle_agent_request
	 */
	public function test_returns_the_messages_of_a_filtered_response(): void {
		wp_set_current_user( self::$admin_id );
		$messages = [
			[
				'version'       => 'v0.9.1',
				'deleteSurface' => [ 'surfaceId' => 'main' ],
			],
		];
		$this->answer_with( $messages );

		$response = $this->post( [ 'prompt' => 'A form' ] );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( [ 'messages' => $messages ], $response->get_data() );
	}

	/**
	 * @covers \A2UIWP\handle_agent_request
	 */
	public function test_passes_the_turn_to_the_filter(): void {
		wp_set_current_user( self::$admin_id );
		$received = null;
		add_filter(
			'a2ui_wp_agent_response',
			static function ( $response, array $turn ) use ( &$received ) {
				$received = $turn;
				return [];
			},
			10,
			2
		);

		$this->post(
			[
				'prompt'    => 'A form',
				'action'    => [ 'action' => [ 'name' => 'save' ] ],
				'dataModel' => [ 'surfaces' => [] ],
			]
		);

		$this->assertIsArray( $received );
		$this->assertSame( 'A form', $received['prompt'] );
		$this->assertSame( [], $received['messages'] );
		$this->assertSame( [ 'action' => [ 'name' => 'save' ] ], $received['action'] );
	}

	/**
	 * @covers \A2UIWP\handle_agent_request
	 */
	public function test_reports_an_invalid_response(): void {
		wp_set_current_user( self::$admin_id );
		$this->answer_with( 'Sorry, I cannot help with that.' );

		$response = $this->post( [ 'prompt' => 'A form' ] );

		$this->assertSame( 502, $response->get_status() );
		$this->assertSame( 'a2ui_wp_invalid_response', $response->as_error()->get_error_code() );
	}

	/**
	 * @covers \A2UIWP\parse_messages
	 */
	public function test_parse_messages_accepts_fenced_json(): void {
		$messages = parse_messages( "```json\n{\"messages\": [{\"version\": \"v0.9.1\"}]}\n```" );

		$this->assertSame( [ [ 'version' => 'v0.9.1' ] ], $messages );
	}

	/**
	 * @covers \A2UIWP\parse_messages
	 */
	public function test_parse_messages_accepts_a_bare_list(): void {
		$messages = parse_messages( '[{"version": "v0.9.1"}]' );

		$this->assertSame( [ [ 'version' => 'v0.9.1' ] ], $messages );
	}

	/**
	 * @covers \A2UIWP\parse_messages
	 */
	public function test_parse_messages_rejects_a_list_of_non_objects(): void {
		$this->assertWPError( parse_messages( '{"messages": ["a", "b"]}' ) );
	}

	/**
	 * @covers \A2UIWP\build_prompt
	 */
	public function test_build_prompt_is_the_request_on_the_first_turn(): void {
		$this->assertSame(
			'A form',
			build_prompt(
				[
					'prompt'    => 'A form',
					'messages'  => [],
					'action'    => null,
					'dataModel' => null,
				]
			)
		);
	}

	/**
	 * @covers \A2UIWP\build_prompt
	 */
	public function test_build_prompt_includes_the_action_on_a_follow_up(): void {
		$prompt = build_prompt(
			[
				'prompt'    => 'A form',
				'messages'  => [ [ 'version' => 'v0.9.1' ] ],
				'action'    => [ 'action' => [ 'name' => 'save' ] ],
				'dataModel' => [ 'surfaces' => [ 'main' => [ 'title' => 'Hi' ] ] ],
			]
		);

		$this->assertStringContainsString( 'The original request: A form', $prompt );
		$this->assertStringContainsString( '"name":"save"', $prompt );
		$this->assertStringContainsString( '"title":"Hi"', $prompt );
	}
}
