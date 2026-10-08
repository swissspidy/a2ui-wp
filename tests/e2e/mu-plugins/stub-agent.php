<?php
/**
 * Plugin Name: A2UI stub agent (tests only)
 * Description: Answers the A2UI agent endpoint without an AI provider, so the end-to-end tests are deterministic.
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

namespace A2UIWP\Tests;

/**
 * Answers a request like a model would, from a fixed script.
 *
 * The first turn builds a sign-up card titled after the request. A
 * `subscribe` action adds a confirmation that echoes the email address.
 *
 * @param mixed                $response Response so far.
 * @param array<string, mixed> $turn     The request.
 * @return list<array<string, mixed>>
 */
function stub_agent_response( $response, array $turn ): array {
	$version = 'v0.9.1';
	$action  = is_array( $turn['action'] ) ? ( $turn['action']['action'] ?? [] ) : [];

	if ( 'subscribe' === ( $action['name'] ?? null ) ) {
		return [
			[
				'version'         => $version,
				'updateDataModel' => [
					'surfaceId' => 'main',
					'path'      => '/status',
					'value'     => 'Subscribed ' . ( $action['context']['email'] ?? '' ),
				],
			],
			[
				'version'          => $version,
				'updateComponents' => [
					'surfaceId'  => 'main',
					'components' => [
						[
							'id'        => 'body',
							'component' => 'Column',
							'children'  => [ 'title', 'email', 'submit', 'status' ],
						],
						[
							'id'        => 'status',
							'component' => 'Text',
							'text'      => [ 'path' => '/status' ],
						],
					],
				],
			],
		];
	}

	return [
		[
			'version'       => $version,
			'createSurface' => [
				'surfaceId'     => 'main',
				'catalogId'     => 'https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json',
				'sendDataModel' => true,
			],
		],
		[
			'version'          => $version,
			'updateComponents' => [
				'surfaceId'  => 'main',
				'components' => [
					[
						'id'        => 'root',
						'component' => 'Card',
						'child'     => 'body',
					],
					[
						'id'        => 'body',
						'component' => 'Column',
						'children'  => [ 'title', 'email', 'submit' ],
					],
					[
						'id'        => 'title',
						'component' => 'Text',
						'variant'   => 'h3',
						'text'      => (string) $turn['prompt'],
					],
					[
						'id'        => 'email',
						'component' => 'TextField',
						'label'     => 'Email',
						'value'     => [ 'path' => '/form/email' ],
					],
					[
						'id'        => 'submit-label',
						'component' => 'Text',
						'text'      => 'Subscribe',
					],
					[
						'id'        => 'submit',
						'component' => 'Button',
						'variant'   => 'primary',
						'child'     => 'submit-label',
						'action'    => [
							'event' => [
								'name'    => 'subscribe',
								'context' => [ 'email' => [ 'path' => '/form/email' ] ],
							],
						],
					],
				],
			],
		],
		[
			'version'         => $version,
			'updateDataModel' => [
				'surfaceId' => 'main',
				'value'     => [ 'form' => [ 'email' => '' ] ],
			],
		],
	];
}

add_filter( 'a2ui_wp_agent_response', __NAMESPACE__ . '\stub_agent_response', 10, 2 );
