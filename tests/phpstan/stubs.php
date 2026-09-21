<?php
/**
 * PHPStan stubs.
 *
 * Narrows PHPDoc that WordPress core leaves looser than the callers here need.
 * Only the types are read from here; the declarations themselves still come
 * from the WordPress stubs.
 *
 * @package A2UIWP
 */

declare(strict_types = 1);

/**
 * Retrieves a URL within the plugins or mu-plugins directory.
 *
 * Core documents the return as a bare `string`, while wp_register_script()
 * accepts nothing but a non-empty one as `$src`. A path is appended to the
 * plugins URL after a slash, so with one given the result cannot be empty.
 *
 * @param string $path   Optional. Extra path appended to the end of the URL.
 * @param string $plugin Optional. A full path to a file inside a plugin or mu-plugin.
 * @return string Plugins URL link with optional paths appended.
 *
 * @phpstan-return ($path is non-empty-string ? non-empty-string : string)
 */
function plugins_url( $path = '', $plugin = '' ) {
}
