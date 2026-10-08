/**
 * A thin wrapper around the reference A2UI implementation
 * (`@a2ui/web_core`). The protocol itself (message processing, surfaces,
 * the data model, data binding, expressions and the basic catalog
 * functions) is upstream's; this class only adds what the React layer and
 * the playground need on top:
 *
 * - a change counter for React's `useSyncExternalStore`,
 * - outgoing `action` and `error` messages wrapped in their envelope,
 * - JSON Lines input that keeps going past bad lines.
 */

import {
	Catalog,
	ComponentContext,
	DataContext,
	MessageProcessor,
	type A2uiClientAction,
	type A2uiClientMessage,
	type A2uiVersionCapabilities,
	type Action,
	type ComponentApi,
	type FunctionImplementation,
	type SurfaceModel,
} from '@a2ui/web_core/v0_9';
import {
	BASIC_COMPONENTS,
	createBasicCatalogFunctions,
} from '@a2ui/web_core/v0_9/basic_catalog';

export const BASIC_CATALOG_IDS = [
	'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
	'https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json',
];

export const DEFAULT_PROTOCOL_VERSION = 'v0.9.1';

export type Surface = SurfaceModel< ComponentApi >;
export type ActionMessage = { version: string; action: A2uiClientAction };
export type ClientMessage = A2uiClientMessage;

export interface ProcessorOptions {
	/** Locale for the formatting functions. Defaults to the runtime's. */
	locale?: string;
	/** Extra client-side functions, or replacements for basic ones by name. */
	functions?: FunctionImplementation[];
	/** Catalogs this client accepts. Defaults to the basic catalog. */
	catalogs?: Catalog< ComponentApi >[];
}

export type ActionListener = ( message: ActionMessage ) => void;
export type ClientMessageListener = ( message: ClientMessage ) => void;
export type ChangeListener = () => void;

/**
 * Builds the basic catalog under every id it is published as.
 * @param options Locale and extra functions.
 */
export function createBasicCatalogs(
	options: Pick< ProcessorOptions, 'locale' | 'functions' > = {}
): Catalog< ComponentApi >[] {
	const functions = new Map(
		[
			...createBasicCatalogFunctions( { locale: options.locale } ),
			...( options.functions ?? [] ),
		].map( ( fn ) => [ fn.name, fn ] )
	);
	return BASIC_CATALOG_IDS.map(
		( id ) =>
			new Catalog( id, 'v0.9', BASIC_COMPONENTS, [
				...functions.values(),
			] )
	);
}

export class A2UIProcessor {
	readonly inner: MessageProcessor< ComponentApi >;

	private version = 0;
	private readonly changeListeners = new Set< ChangeListener >();
	private readonly actionListeners = new Set< ActionListener >();
	private readonly clientMessageListeners =
		new Set< ClientMessageListener >();
	private readonly surfaceUnsubscribers = new Map<
		string,
		Array< () => void >
	>();

	constructor( options: ProcessorOptions = {} ) {
		this.inner = new MessageProcessor(
			options.catalogs ?? createBasicCatalogs( options ),
			( action ) => this.emitAction( action as A2uiClientAction )
		);
		this.inner.onSurfaceCreated( ( surface ) => {
			this.watchSurface( surface );
			this.notify();
		} );
		this.inner.onSurfaceDeleted( ( surfaceId ) => {
			this.surfaceUnsubscribers
				.get( surfaceId )
				?.forEach( ( unsubscribe ) => unsubscribe() );
			this.surfaceUnsubscribers.delete( surfaceId );
			this.notify();
		} );
	}

	// -- Change notification --------------------------------------------------

	subscribe( listener: ChangeListener ): () => void {
		this.changeListeners.add( listener );
		return () => {
			this.changeListeners.delete( listener );
		};
	}

	getVersion(): number {
		return this.version;
	}

	private notify() {
		this.version++;
		for ( const listener of this.changeListeners ) {
			listener();
		}
	}

	private watchSurface( surface: Surface ) {
		const notify = () => this.notify();
		const components = surface.componentsModel;
		const componentSubscriptions = new Map< string, () => void >();
		const watchComponent = ( id: string ) => {
			const model = components.get( id );
			if ( model ) {
				const subscription = model.onUpdated.subscribe( notify );
				componentSubscriptions.set( id, () =>
					subscription.unsubscribe()
				);
			}
		};
		for ( const id of components.keys ) {
			watchComponent( id );
		}
		const subscriptions = [
			surface.dataModel.subscribe( '/', notify ),
			components.onCreated.subscribe( ( model ) => {
				watchComponent( model.id );
				notify();
			} ),
			components.onDeleted.subscribe( ( id ) => {
				componentSubscriptions.get( id )?.();
				componentSubscriptions.delete( id );
				notify();
			} ),
			surface.onError.subscribe( ( error ) =>
				this.emitClientMessage( {
					version: DEFAULT_PROTOCOL_VERSION,
					error: {
						code: error.code,
						message: error.message,
						surfaceId: error.surfaceId ?? surface.id,
					},
				} as ClientMessage )
			),
		];
		this.surfaceUnsubscribers.set( surface.id, [
			...subscriptions.map( ( s ) => () => s.unsubscribe() ),
			() => componentSubscriptions.forEach( ( off ) => off() ),
		] );
	}

	// -- Outbound messages ----------------------------------------------------

	/**
	 * Listen for `action` messages that should be sent to the agent.
	 * @param listener Callback.
	 */
	onAction( listener: ActionListener ): () => void {
		this.actionListeners.add( listener );
		return () => {
			this.actionListeners.delete( listener );
		};
	}

	/**
	 * Listen for every client → server message (`action` and `error`).
	 * @param listener Callback.
	 */
	onClientMessage( listener: ClientMessageListener ): () => void {
		this.clientMessageListeners.add( listener );
		return () => {
			this.clientMessageListeners.delete( listener );
		};
	}

	private emitAction( action: A2uiClientAction ) {
		const message: ActionMessage = {
			version: DEFAULT_PROTOCOL_VERSION,
			action,
		};
		for ( const listener of this.actionListeners ) {
			listener( message );
		}
		this.emitClientMessage( message as ClientMessage );
	}

	private emitClientMessage( message: ClientMessage ) {
		for ( const listener of this.clientMessageListeners ) {
			listener( message );
		}
	}

	// -- Inbound messages -----------------------------------------------------

	/**
	 * Processes one message. Throws on invalid input.
	 * @param message A parsed server message.
	 */
	processMessage( message: unknown ): void {
		this.processMessages( [ message ] );
	}

	/**
	 * Processes several messages. Throws on the first invalid one.
	 * @param messages Messages, or a wrapper object with a `messages` array.
	 */
	processMessages( messages: unknown[] | { messages: unknown[] } ): void {
		this.inner.processMessages( messages as never );
	}

	/**
	 * Processes a JSON Lines stream (one message per line). Invalid lines are
	 * collected and returned instead of thrown so a stream keeps flowing.
	 * @param text JSON Lines text.
	 */
	processJsonl( text: string ): Array< { line: number; error: Error } > {
		const errors: Array< { line: number; error: Error } > = [];
		text.split( /\r?\n/ ).forEach( ( raw, index ) => {
			const line = raw.trim();
			if ( ! line ) {
				return;
			}
			try {
				this.processMessage( JSON.parse( line ) );
			} catch ( error ) {
				errors.push( {
					line: index + 1,
					error:
						error instanceof Error
							? error
							: new Error( String( error ) ),
				} );
			}
		} );
		return errors;
	}

	// -- Rendering helpers ----------------------------------------------------

	get surfaces(): ReadonlyMap< string, Surface > {
		return this.inner.getSurfaces();
	}

	getSurface( surfaceId: string ): Surface | undefined {
		return this.inner.getSurface( surfaceId );
	}

	/**
	 * The data context a component inside `surface` resolves values in.
	 * @param surface   Surface the component belongs to.
	 * @param scopePath Absolute pointer that relative bindings resolve against.
	 */
	createScope( surface: Surface, scopePath?: string ): DataContext {
		return new DataContext( surface, scopePath ?? '/' );
	}

	/**
	 * Writes user input into a surface's data model (two-way binding).
	 * @param surfaceId Surface id.
	 * @param path      JSON Pointer.
	 * @param value     New value, or `undefined` to remove the key.
	 */
	setValue( surfaceId: string, path: string, value: unknown ): void {
		this.requireSurface( surfaceId ).dataModel.set( path, value );
	}

	/**
	 * Runs a component's `action`: a server event becomes an `action`
	 * message; a `functionCall` runs locally.
	 * @param surfaceId         Surface id.
	 * @param sourceComponentId Id of the component that triggered the action.
	 * @param action            The component's `action`.
	 * @param scopePath         Absolute pointer that relative bindings resolve against.
	 */
	dispatchAction(
		surfaceId: string,
		sourceComponentId: string,
		action: Action,
		scopePath?: string
	): void {
		const surface = this.requireSurface( surfaceId );
		const context = new ComponentContext(
			surface,
			sourceComponentId,
			scopePath ?? '/'
		);
		// Resolving a function call runs it; an event resolves to its payload.
		const resolved = context.dataContext.resolveAction( action );
		if ( 'event' in action ) {
			void context.dispatchAction( resolved as Action );
		}
	}

	private requireSurface( surfaceId: string ): Surface {
		const surface = this.getSurface( surfaceId );
		if ( ! surface ) {
			throw new Error( `Surface '${ surfaceId }' does not exist.` );
		}
		return surface;
	}

	// -- Capabilities & data model exchange -----------------------------------

	getClientCapabilities(
		version = DEFAULT_PROTOCOL_VERSION
	): Record< string, A2uiVersionCapabilities > {
		return this.inner.getClientCapabilities( {
			versions: [ version ],
		} ) as Record< string, A2uiVersionCapabilities >;
	}

	/**
	 * Data models of every surface created with `sendDataModel: true`.
	 * @param version Protocol version to tag the message with.
	 */
	getClientDataModel( version = DEFAULT_PROTOCOL_VERSION ) {
		return this.inner.getClientDataModel( version );
	}
}
