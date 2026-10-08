# @swissspidy/a2ui-wp

Render [A2UI](https://a2ui.org/) surfaces with the WordPress component library.

A2UI lets an AI agent describe a user interface as JSON that the client renders with its own native components. This package is a client for WordPress: it processes A2UI messages with [`@a2ui/web_core`](https://www.npmjs.com/package/@a2ui/web_core), the reference implementation, and renders every component of the basic catalog with `@wordpress/components`, so agent-generated UI looks like the rest of wp-admin and the block editor.

## Installation

```sh
npm install @swissspidy/a2ui-wp
```

`@wordpress/components`, `@wordpress/element`, `@wordpress/i18n`, `@wordpress/icons` and `react` are peer dependencies. In a plugin built with `@wordpress/scripts`, the first three come from WordPress at runtime.

## Usage

```tsx
import { A2UIProcessor, A2UIRenderer } from '@swissspidy/a2ui-wp';

const processor = new A2UIProcessor();

// Feed it messages from whatever transport you use.
processor.processMessages( messagesFromTheAgent );

// Send user actions back to the agent.
processor.onAction( ( message ) => transport.send( message ) );

<A2UIRenderer processor={ processor } />;
```

- `processor.processJsonl( text )` reads a JSON Lines stream and returns the lines it could not process instead of throwing.
- `processor.getClientCapabilities()` and `processor.getClientDataModel()` return the metadata the transport bindings ask for.
- Catalog components are React components receiving `{ id, props }`. `createCatalog()` adds or replaces them; pass the result to `<A2UIRenderer catalog={ … }>`.
- Custom client-side functions, built with `createFunctionImplementation()` from `@a2ui/web_core/v0_9`, go through `new A2UIProcessor( { functions } )`.

`A2UIProcessor` has no React or DOM dependency, so it also runs headless, for example in Node.

## License

Apache-2.0
