<?php
/**
 * A minimal agent: turns a request into A2UI messages with the AI Client.
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

namespace A2UIWP;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const REST_NAMESPACE = 'a2ui-wp/v1';

/**
 * Longest request the endpoint accepts, in characters.
 */
const MAX_PROMPT_LENGTH = 2000;

/**
 * Largest conversation the endpoint accepts back, in bytes of JSON.
 */
const MAX_CONTEXT_BYTES = 200000;

/**
 * Registers the agent endpoint.
 *
 * @return void
 */
function register_rest_routes(): void {
	register_rest_route(
		REST_NAMESPACE,
		'/agent',
		[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => __NAMESPACE__ . '\handle_agent_request',
			'permission_callback' => __NAMESPACE__ . '\can_use_agent',
			'args'                => [
				'prompt'    => [
					'description' => __( 'What the user asked for.', 'a2ui-wp' ),
					'type'        => 'string',
					'required'    => true,
					'minLength'   => 1,
					'maxLength'   => MAX_PROMPT_LENGTH,
				],
				'messages'  => [
					'description' => __( 'The A2UI messages the agent sent so far in this conversation.', 'a2ui-wp' ),
					'type'        => 'array',
					'items'       => [ 'type' => 'object' ],
					'default'     => [],
				],
				'action'    => [
					'description' => __( 'The action message the user triggered, if any.', 'a2ui-wp' ),
					'type'        => [ 'object', 'null' ],
					'default'     => null,
				],
				'dataModel' => [
					'description' => __( 'The client data model of the surfaces that send it.', 'a2ui-wp' ),
					'type'        => [ 'object', 'null' ],
					'default'     => null,
				],
			],
		]
	);
}

/**
 * Whether the current user may talk to the agent.
 *
 * Every request can cost money with the site's AI provider, so the endpoint
 * is limited to the users who can see the playground.
 *
 * @return bool
 */
function can_use_agent(): bool {
	return current_user_can( 'manage_options' );
}

/**
 * Whether WordPress can generate text with a configured AI provider.
 *
 * `wp_supports_ai()` only says the AI Client can run; without a provider
 * there is still no model to ask, so check for one that generates text.
 *
 * @return bool
 */
function is_ai_available(): bool {
	if ( ! function_exists( 'wp_supports_ai' ) || ! function_exists( 'wp_ai_client_prompt' ) || ! wp_supports_ai() ) {
		return false;
	}

	return wp_ai_client_prompt()->is_supported_for_text_generation();
}

/**
 * Whether the playground should offer the agent.
 *
 * @return bool
 */
function is_agent_available(): bool {
	return is_ai_available() || has_filter( 'a2ui_wp_agent_response' );
}

/**
 * Answers a request with A2UI messages.
 *
 * @param WP_REST_Request $request Request.
 * @phpstan-param WP_REST_Request<array<string, mixed>> $request
 * @return WP_REST_Response|WP_Error Response with a `messages` list, or an error.
 */
function handle_agent_request( WP_REST_Request $request ) {
	/**
	 * Request parameters, validated against the route's schema.
	 *
	 * @var array{prompt: string, messages: list<array<string, mixed>>, action: array<string, mixed>|null, dataModel: array<string, mixed>|null} $turn
	 */
	$turn = [
		'prompt'    => $request['prompt'],
		'messages'  => $request['messages'],
		'action'    => $request['action'],
		'dataModel' => $request['dataModel'],
	];

	$context = wp_json_encode( [ $turn['messages'], $turn['action'], $turn['dataModel'] ] );
	if ( false === $context || strlen( $context ) > MAX_CONTEXT_BYTES ) {
		return new WP_Error(
			'a2ui_wp_context_too_large',
			__( 'The conversation is too long. Start over with a new request.', 'a2ui-wp' ),
			[ 'status' => 413 ]
		);
	}

	/**
	 * Filters the agent's response before the AI Client is asked.
	 *
	 * Return a list of A2UI messages, or the JSON text of `{"messages": [...]}`,
	 * to answer the request without the AI Client: to plug in another agent,
	 * or to give tests a deterministic one.
	 *
	 * @param list<array<string, mixed>>|string|WP_Error|null $response Response. Default null.
	 * @param array<string, mixed>                           $turn     The request: `prompt`, `messages`, `action`, `dataModel`.
	 */
	$response = apply_filters( 'a2ui_wp_agent_response', null, $turn );

	if ( null === $response ) {
		$response = generate_messages( $turn );
	}

	if ( is_wp_error( $response ) ) {
		return $response;
	}

	$messages = parse_messages( $response );
	if ( is_wp_error( $messages ) ) {
		return $messages;
	}

	return new WP_REST_Response( [ 'messages' => $messages ] );
}

/**
 * Asks the site's AI provider for A2UI messages.
 *
 * @param array<string, mixed> $turn The request.
 * @phpstan-param array{prompt: string, messages: list<array<string, mixed>>, action: array<string, mixed>|null, dataModel: array<string, mixed>|null} $turn
 * @return string|WP_Error JSON text, or an error.
 */
function generate_messages( array $turn ) {
	if ( ! is_ai_available() ) {
		return new WP_Error(
			'a2ui_wp_ai_unavailable',
			__( 'No AI provider is available. Configure one for the WordPress AI Client first.', 'a2ui-wp' ),
			[ 'status' => 501 ]
		);
	}

	$text = wp_ai_client_prompt( build_prompt( $turn ) )
		->using_system_instruction( get_instructions() )
		->as_json_response(
			[
				'type'       => 'object',
				'properties' => [
					'messages' => [
						'type'  => 'array',
						'items' => [ 'type' => 'object' ],
					],
				],
				'required'   => [ 'messages' ],
			]
		)
		->generate_text();

	if ( is_wp_error( $text ) ) {
		$text->add_data( [ 'status' => 502 ] );
	}

	return $text;
}

/**
 * Returns the system instruction that teaches the model A2UI.
 *
 * @return string
 */
function get_instructions(): string {
	$instructions = (string) file_get_contents( A2UI_WP_DIR . '/inc/agent-instructions.md' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- A local file.

	/**
	 * Filters the system instruction the agent sends to the model.
	 *
	 * @param string $instructions System instruction.
	 */
	return (string) apply_filters( 'a2ui_wp_agent_instructions', $instructions );
}

/**
 * Builds the user prompt for one turn.
 *
 * The endpoint is stateless: the client sends back what the agent said so
 * far, and a follow-up turn repeats it, so the model can answer an action
 * in the context of the surface it built.
 *
 * @param array<string, mixed> $turn The request.
 * @phpstan-param array{prompt: string, messages: list<array<string, mixed>>, action: array<string, mixed>|null, dataModel: array<string, mixed>|null} $turn
 * @return string
 */
function build_prompt( array $turn ): string {
	$prompt = $turn['prompt'];

	if ( empty( $turn['action'] ) ) {
		return $prompt;
	}

	return implode(
		"\n\n",
		[
			'The original request: ' . $prompt,
			'The messages you sent so far: ' . wp_json_encode( $turn['messages'] ),
			'The user triggered this action: ' . wp_json_encode( $turn['action'] ),
			'The current data model: ' . wp_json_encode( $turn['dataModel'] ),
			'Reply with the messages that update the UI.',
		]
	);
}

/**
 * Turns the agent's response into a list of messages.
 *
 * @param mixed $response A list of messages, or the JSON text of `{"messages": [...]}`.
 * @return list<array<string, mixed>>|WP_Error
 */
function parse_messages( $response ) {
	if ( is_string( $response ) ) {
		// Some models wrap JSON in a Markdown code fence despite being asked not to.
		$json     = (string) preg_replace( '/^\s*```(?:json)?\s*|\s*```\s*$/', '', $response );
		$response = json_decode( $json, true );
	}

	if ( is_array( $response ) && isset( $response['messages'] ) ) {
		$response = $response['messages'];
	}

	if ( ! is_list( $response ) ) {
		return new WP_Error(
			'a2ui_wp_invalid_response',
			__( 'The agent did not answer with a list of A2UI messages.', 'a2ui-wp' ),
			[ 'status' => 502 ]
		);
	}

	foreach ( $response as $message ) {
		if ( ! is_array( $message ) || ( [] !== $message && is_list( $message ) ) ) {
			return new WP_Error(
				'a2ui_wp_invalid_response',
				__( 'The agent did not answer with a list of A2UI messages.', 'a2ui-wp' ),
				[ 'status' => 502 ]
			);
		}
	}

	/**
	 * Messages, each an object.
	 *
	 * @var list<array<string, mixed>> $response
	 */
	return $response;
}

/**
 * Whether a value is an array with consecutive integer keys from 0.
 *
 * @param mixed $value Value.
 * @return bool
 * @phpstan-assert-if-true list<mixed> $value
 */
function is_list( $value ): bool {
	return is_array( $value ) && array_values( $value ) === $value;
}
