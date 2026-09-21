# a2ui-wp

An [A2UI](https://a2ui.org/) renderer built on the WordPress component library ([`@wordpress/components`](https://github.com/WordPress/gutenberg/tree/trunk/packages/components)). Proof of concept.

A2UI (Agent-to-User Interface) is a protocol that lets an agent describe a user interface as a flat, streamable JSON structure that the host renders with its own native components. This project is the "native components" half for WordPress: it takes A2UI v0.9.x messages and renders them with the same components wp-admin and the block editor use, so agent-generated UI looks and behaves like the rest of the admin.

## What is here

- `src/core/` is a framework-agnostic implementation of the A2UI v0.9.1 client side: message processing (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`), the per-surface data model (RFC 6901 JSON Pointers), data binding (`{ "path": ... }`), the `${...}` expression syntax, the basic catalog's client-side functions (`formatString`, `formatCurrency`, `required`, `regex`, `and`, `openUrl`, and the rest), `checks`, and outgoing `action` messages. It has no dependencies.
- `src/react/` is the React layer: `<A2UIRenderer>` / `<A2UISurface>`, hooks for catalog components (`useDynamicString`, `useBoundValue`, `useChecks`, `useAction`), and the component catalog that maps every basic catalog component onto `@wordpress/components`.
- `demo/` is a playground: pick an example stream or paste your own JSON Lines, render it all at once or one message at a time, and watch the `action` messages the UI produces.
- `test/` covers the core with unit tests and the React layer with a jsdom integration test.

## Component mapping

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

## Usage

```tsx
import { A2UIProcessor, A2UIRenderer } from 'a2ui-wp';
import '@wordpress/components/build-style/style.css';

const processor = new A2UIProcessor();

// Feed it messages from whatever transport you use (REST, SSE, WebSocket, A2A, MCP).
processor.processMessages( messagesFromTheAgent );
// or, for a JSON Lines stream:
processor.processJsonl( chunk );

// Send user actions back to the agent.
processor.onAction( ( message ) => transport.send( message ) );

// Render every surface the processor knows about.
<A2UIRenderer processor={ processor } />;
```

`<A2UISurface processor surfaceId>` renders a single surface if you want to place surfaces yourself. `processor.getClientCapabilities()` and `processor.getClientDataModel()` give you the metadata the transport bindings ask for (`a2uiClientCapabilities`, and the data model snapshot for surfaces created with `sendDataModel: true`).

### Extending the catalog

Catalog components are plain React components receiving `{ id, props }`. Use `createCatalog()` to add components or replace the defaults:

```tsx
import { createCatalog, useDynamicString, A2UIRenderer } from 'a2ui-wp';

const catalog = createCatalog( {
	Badge: ( { props } ) => <span className="my-badge">{ useDynamicString( props.text ) }</span>,
} );

<A2UIRenderer processor={ processor } catalog={ catalog } />;
```

Custom client-side functions go through the processor: `new A2UIProcessor( { functions: { upper: ( { value } ) => String( value ).toUpperCase() } } )`.

## Development

```bash
npm install
npm run dev        # playground at http://localhost:5173
npm test           # vitest
npm run typecheck
npm run build      # library to dist/, playground to demo-dist/
```

## Transport and hosting notes

The processor is transport-agnostic on purpose. A2UI is designed for progressive rendering over a stream, but nothing here needs streaming: `processMessages()` takes a complete array, which is what a REST round-trip returns. On typical WordPress hosting, where an agent runs in PHP (for example through the WordPress AI Client) and long-lived responses are awkward, a REST endpoint that returns the whole message list per turn is the pragmatic default. Streaming via SSE or a JSON Lines response stays an option where the host supports it, and `processJsonl()` covers that case.

In this setup wp-admin is the *host*: it renders surfaces and sends `action` messages back. It is not an A2UI *server*. An external agent reaching a site through the WordPress MCP adapter is a different situation: those hosts speak MCP Apps (`ui://` resources rendered in an iframe), not A2UI, so A2UI payloads would be opaque to them. This renderer therefore serves in-admin agents first. The [A2UI and MCP Apps patterns](https://developers.googleblog.com/a2ui-and-mcp-apps/) leave room for a later bridge that wraps a surface rendered by this package as a `ui://` resource for external hosts; the flat surface model makes that a packaging question rather than a rendering one.

## Status and known gaps

- Targets A2UI **v0.9.1** (messages tagged `v0.9` are accepted too). The v1.0 candidate is not implemented.
- `Text` renders plain text with preserved line breaks; the Markdown subset the reference renderers support is not rendered yet.
- `Modal` opens on a click anywhere inside its `trigger`, so a trigger `Button` also fires its own action, matching the reference Lit renderer.
- `DateTimeInput` stores whatever the WordPress pickers emit (a local ISO-like string without a zone offset).
- The icon map covers the basic catalog's names with the closest `@wordpress/icons` equivalent; a few (`volume*`, `print`, `stop`) are approximations.
- Component properties are not schema-validated against the catalog JSON; unknown component types render a warning `Notice`, missing references render nothing (they may still be in flight).
- Not yet packaged as a WordPress plugin. In a plugin build, `@wordpress/scripts` with its dependency extraction turns the `@wordpress/components` import into the `wp.components` global automatically.

## License

GPL-2.0-or-later, like Gutenberg. See [`LICENSE`](./LICENSE).

This is an independent implementation of the A2UI protocol written from the published specification; it does not vendor code from the Apache-2.0 licensed [a2ui-project/a2ui](https://github.com/a2ui-project/a2ui) repository. The only Apache-2.0 material involved is the specification itself.
