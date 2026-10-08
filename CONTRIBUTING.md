# How to Contribute

We would love to accept your patches and contributions to this project.

## Contribution process

### Building the plugin

Run `npm install` and `npm run build` to build the JavaScript and CSS.

### Running the tests

- `npm run test:unit` runs the JavaScript unit tests for the processor wrapper, the example streams and the renderer.
- `composer lint` and `composer phpstan` check the PHP.

`npm run wp-env start` brings up WordPress with the plugin. With that running:

- `npm run wp-env run tests-cli --env-cwd=wp-content/plugins/a2ui-wp vendor/bin/phpunit` runs the PHP unit tests.
- `npm run test:e2e` runs the browser tests.

### Licensing

This project is dual-licensed under Apache-2.0 OR GPL-2.0-or-later. Unless you explicitly state otherwise, any contribution you submit is licensed under both, without any additional terms or conditions.

### Code Reviews

All submissions, including submissions by project members, require review. We use [GitHub pull requests](https://docs.github.com/articles/about-pull-requests) for this purpose.
