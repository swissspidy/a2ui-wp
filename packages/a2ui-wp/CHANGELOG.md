# @swissspidy/a2ui-wp

## 0.2.0

### Minor Changes

- [#21](https://github.com/swissspidy/a2ui-wp/pull/21) [`172cb2f`](https://github.com/swissspidy/a2ui-wp/commit/172cb2ff9bacedb2fa62261f7fa720a886e82acd) Thanks [@swissspidy](https://github.com/swissspidy)! - Requires `@a2ui/web_core` 0.14 (was 0.12). Apps that build catalogs with web_core themselves must move to 0.14 too, so both resolve to one copy. Peer ranges now also allow `@wordpress/components` 42–43, `@wordpress/element` 9–10, `@wordpress/i18n` 7 and `@wordpress/icons` 18–19.

## 0.1.1

### Patch Changes

- [#12](https://github.com/swissspidy/a2ui-wp/pull/12) [`1c5496b`](https://github.com/swissspidy/a2ui-wp/commit/1c5496b18bd8fbe2124db3bbd1cf71abcf0495c9) Thanks [@swissspidy](https://github.com/swissspidy)! - Ship `dist/`: 0.1.0 was published without its build. The package now builds before every pack or publish (`prepack`).

- [#12](https://github.com/swissspidy/a2ui-wp/pull/12) [`1c5496b`](https://github.com/swissspidy/a2ui-wp/commit/1c5496b18bd8fbe2124db3bbd1cf71abcf0495c9) Thanks [@swissspidy](https://github.com/swissspidy)! - Label long text fields: `TextareaControl` labels its own instance id, so the `id` a2ui-wp passed reached the textarea but not its label.
