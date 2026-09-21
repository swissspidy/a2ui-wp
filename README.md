# A2UI for WordPress

[![License](https://img.shields.io/github/license/swissspidy/a2ui-wp)](https://github.com/swissspidy/a2ui-wp/blob/main/LICENSE)

Renders agent-generated [A2UI](https://a2ui.org/) surfaces inside wp-admin with the WordPress component library. Proof of concept.

A2UI (Agent-to-User Interface) is a protocol that lets an agent describe a user interface as a flat, streamable JSON structure that the host renders with its own native components. This plugin is the "native components" half for WordPress: it takes A2UI v0.9.x messages and renders them with [`@wordpress/components`](https://github.com/WordPress/gutenberg/tree/trunk/packages/components), the same components wp-admin and the block editor use, so agent-generated UI looks and behaves like the rest of the admin.

## Quick Start

Install and activate the latest nightly build on your WordPress website, then open **Tools → A2UI**. Pick one of the bundled example streams, or paste your own, and click **Render all**. Everything the rendered UI would send back to an agent shows up in the log next to it.

[![Download latest nightly build](https://img.shields.io/badge/Download%20latest%20nightly-24282D?style=for-the-badge&logo=Files&logoColor=ffffff)](https://swissspidy.github.io/a2ui-wp/nightly.zip)

Note: Requires **WordPress 7.1+** and **PHP 8.0+**.

### Using WordPress Playground

Use [WordPress Playground](https://wordpress.org/playground/) to try this plugin directly in the browser, without installing it on your site:

[![Test on WordPress Playground](https://img.shields.io/badge/Test%20on%20WordPress%20Playground-3F57E1?style=for-the-badge&logo=WordPress&logoColor=ffffff)](https://playground.wordpress.net/?mode=seamless&blueprint-url=https://raw.githubusercontent.com/swissspidy/a2ui-wp/main/blueprints/playground.json)

## How it works

The plugin registers one admin page and one script. The script contains three layers:

- `src/core/` is a framework-agnostic implementation of the A2UI v0.9.1 client side: message processing (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`), the per-surface data model (RFC 6901 JSON Pointers), data binding (`{ "path": ... }`), the `${...}` expression syntax, the basic catalog's client-side functions (`formatString`, `formatCurrency`, `required`, `regex`, `and`, `openUrl`, and the rest), `checks`, and outgoing `action` messages. It has no dependencies.
- `src/react/` is the React layer: `<A2UIRenderer>` / `<A2UISurface>`, hooks for catalog components (`useDynamicString`, `useBoundValue`, `useChecks`, `useAction`), and the component catalog that maps every basic catalog component onto `@wordpress/components`.
- `src/admin/` is the playground page, with the example streams as hard-coded JSON.

The bundle is built with `@wordpress/scripts`, so `@wordpress/components`, `@wordpress/element` and `@wordpress/i18n` resolve to the copies WordPress already loads rather than being bundled. What ships is the protocol core, the catalog, and the playground.

### Component mapping

| A2UI (basic catalog v0.9.1) | `@wordpress/components` |
| --- | --- |
| `Text` (`h1`–`h5`, `body`, `caption`) | `Heading`, `Text` |
| `Image` (`icon`, `avatar`, `*Feature`, `header`) | `<img>` sized per variant |
| `Icon` | `Icon` with [`@wordpress/icons`](https://github.com/WordPress/gutenberg/tree/trunk/packages/icons) (see `src/react/catalog/icons.ts` for the name map) |
| `Video`, `AudioPlayer` | native `<video>` / `<audio>` |
| `Row`, `Column` | `HStack`, `VStack` (`justify` and `align` mapped to flexbox) |
| `List` (static or template children) | scrollable `VStack` / `HStack` |
| `Card` | `Card` + `CardBody` |
| `Tabs` | `TabPanel` |
| `Modal` | `Modal`, opened by a click on the `trigger` child |
| `Divider` | `Divider` |
| `Button` (`default`, `primary`, `borderless`) | `Button` (`secondary`, `primary`, `tertiary`); disabled while its `checks` fail |
| `TextField` (`shortText`, `longText`, `number`, `obscured`) | `TextControl`, `TextareaControl`; `checks` and `validationRegexp` shown as help text once touched |
| `CheckBox` | `CheckboxControl` |
| `ChoicePicker` (`mutuallyExclusive` / `multipleSelection` × `checkbox` / `chips`, `filterable`) | `RadioControl`, `ToggleGroupControl`, `CheckboxControl` list, toggle `Button`s, plus `SearchControl` for filtering |
| `Slider` | `RangeControl` |
| `DateTimeInput` | `DatePicker`, `TimePicker`, `DateTimePicker` inside a `Dropdown` |

Theme parameters from `createSurface` are honoured where they map onto something in the design system: `primaryColor` is applied through `--wp-admin-theme-color` and the `--wp-components-color-accent` variables on the surface wrapper, so buttons, focus rings and toggles pick it up.

### Using the renderer elsewhere

The `a2ui-wp-admin` script handle is registered on `init`, so another screen can enqueue it. The exports in `src/index.ts` are what the playground itself uses:

```tsx
import { A2UIProcessor, A2UIRenderer } from '../index';

const processor = new A2UIProcessor();

// Feed it messages from whatever transport you use.
processor.processMessages( messagesFromTheAgent );

// Send user actions back to the agent.
processor.onAction( ( message ) => transport.send( message ) );

<A2UIRenderer processor={ processor } />;
```

`processor.getClientCapabilities()` and `processor.getClientDataModel()` give you the metadata the transport bindings ask for. Catalog components are plain React components receiving `{ id, props }`; `createCatalog()` adds or replaces them, and custom client-side functions go through `new A2UIProcessor( { functions } )`.

## Architecture notes

**wp-admin is the host, not the server.** The plugin renders surfaces and produces `action` messages; it does not run an agent. An external agent reaching a site through the WordPress MCP adapter is a different situation: those hosts speak MCP Apps (`ui://` resources rendered in an iframe), not A2UI, so A2UI payloads would be opaque to them. This renderer therefore serves in-admin agents first. The [A2UI and MCP Apps patterns](https://developers.googleblog.com/a2ui-and-mcp-apps/) leave room for a later bridge that wraps a surface rendered by this plugin as a `ui://` resource for external hosts.

**Streaming is optional.** A2UI is designed for progressive rendering over a stream, but nothing here needs it: `processMessages()` takes a complete array, which is what a REST round-trip returns. On typical WordPress hosting, where an agent runs in PHP and long-lived responses are awkward, a REST endpoint that returns the whole message list per turn is the pragmatic default. `processJsonl()` covers hosts that can stream. Out-of-order delivery works either way: components referenced before they are defined render nothing until they arrive, and nothing renders until the `root` component exists.

**No agent yet.** The playground renders bundled and pasted streams. Connecting it to an agent running inside WordPress through the AI Client is the intended next step; the processor's API is what that integration would call.

## Status and known gaps

- Targets A2UI **v0.9.1** (messages tagged `v0.9` are accepted too). The v1.0 candidate is not implemented.
- `Text` renders plain text with preserved line breaks; the Markdown subset the reference renderers support is not rendered yet.
- `Modal` opens on a click anywhere inside its `trigger`, so a trigger `Button` also fires its own action, matching the reference Lit renderer.
- `DateTimeInput` stores whatever the WordPress pickers emit (a local ISO-like string without a zone offset).
- The icon map covers the basic catalog's names with the closest `@wordpress/icons` equivalent; a few (`volume*`, `print`, `stop`) are approximations.
- Component properties are not schema-validated against the catalog JSON; unknown component types render a warning `Notice`, missing references render nothing.

## License

GPL-2.0-or-later, like WordPress. See [`LICENSE`](./LICENSE).

This is an independent implementation of the A2UI protocol written from the published specification; it does not vendor code from the Apache-2.0 licensed [a2ui-project/a2ui](https://github.com/a2ui-project/a2ui) repository.
