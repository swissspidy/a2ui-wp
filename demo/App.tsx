import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Notice,
	Popover,
	SelectControl,
	SlotFillProvider,
	TextareaControl,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { A2UIProcessor, A2UIRenderer, type ClientMessage } from '../src';
import { examples, type Example } from './examples';

interface LogEntry {
	id: number;
	kind: 'action' | 'error' | 'info';
	text: string;
}

const toJsonl = ( example: Example ) => example.messages.map( ( message ) => JSON.stringify( message ) ).join( '\n' );

export function App() {
	const [ processor, setProcessor ] = useState( () => new A2UIProcessor() );
	const [ exampleName, setExampleName ] = useState( examples[ 0 ].name );
	const [ jsonl, setJsonl ] = useState( () => toJsonl( examples[ 0 ] ) );
	const [ log, setLog ] = useState< LogEntry[] >( [] );
	const [ cursor, setCursor ] = useState( 0 );
	const logId = useRef( 0 );

	const example = useMemo( () => examples.find( ( item ) => item.name === exampleName ) ?? examples[ 0 ], [ exampleName ] );
	const lines = useMemo( () => jsonl.split( /\r?\n/ ).filter( ( line ) => line.trim() ), [ jsonl ] );

	const append = useCallback( ( kind: LogEntry[ 'kind' ], text: string ) => {
		setLog( ( entries ) => [ { id: logId.current++, kind, text }, ...entries ].slice( 0, 50 ) );
	}, [] );

	const onClientMessage = useCallback(
		( message: ClientMessage ) => {
			append( 'action' in message ? 'action' : 'error', JSON.stringify( message, null, 2 ) );
			const dataModel = processor.getClientDataModel();
			if ( 'action' in message && dataModel ) {
				append( 'info', `sendDataModel snapshot:\n${ JSON.stringify( dataModel, null, 2 ) }` );
			}
		},
		[ append, processor ]
	);

	// Wire the client → server channel for the current processor instance.
	useEffect( () => processor.onClientMessage( onClientMessage ), [ processor, onClientMessage ] );

	const reset = () => {
		setProcessor( new A2UIProcessor() );
		setCursor( 0 );
		setLog( [] );
	};

	const send = ( target: A2UIProcessor, from: number, to: number ) => {
		for ( let index = from; index < to; index++ ) {
			try {
				target.processMessage( JSON.parse( lines[ index ] ) );
			} catch ( error ) {
				append( 'error', `Line ${ index + 1 }: ${ error instanceof Error ? error.message : String( error ) }` );
			}
		}
		setCursor( to );
	};

	const renderAll = () => {
		const fresh = new A2UIProcessor();
		setProcessor( fresh );
		setLog( [] );
		send( fresh, 0, lines.length );
	};

	const step = () => {
		if ( cursor >= lines.length ) {
			return;
		}
		send( processor, cursor, cursor + 1 );
	};

	const pickExample = ( name: string ) => {
		const next = examples.find( ( item ) => item.name === name ) ?? examples[ 0 ];
		setExampleName( next.name );
		setJsonl( toJsonl( next ) );
		reset();
	};

	return (
		<SlotFillProvider>
			<div className="demo">
				<aside className="demo__sidebar">
					<VStack spacing={ 4 }>
						<Card>
							<CardHeader>
								<Heading level={ 3 }>A2UI × WordPress components</Heading>
							</CardHeader>
							<CardBody>
								<VStack spacing={ 3 }>
									<Text>
										Paste an A2UI v0.9 stream (one JSON message per line) and render it with the WordPress component library. Actions the UI produces show up in the log.
									</Text>
									<SelectControl
										label="Example"
										value={ exampleName }
										options={ examples.map( ( item ) => ( { label: item.name, value: item.name } ) ) }
										onChange={ pickExample }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<Text variant="muted">{ example.description }</Text>
									<TextareaControl
										label="Messages (JSON Lines)"
										value={ jsonl }
										onChange={ setJsonl }
										rows={ 14 }
										__nextHasNoMarginBottom
									/>
									<HStack justify="flex-start" wrap>
										<Button variant="primary" onClick={ renderAll } __next40pxDefaultSize>
											Render all
										</Button>
										<Button variant="secondary" onClick={ step } disabled={ cursor >= lines.length } __next40pxDefaultSize>
											Next message ({ cursor }/{ lines.length })
										</Button>
										<Button variant="tertiary" onClick={ reset } __next40pxDefaultSize>
											Reset
										</Button>
									</HStack>
								</VStack>
							</CardBody>
						</Card>
						<Card>
							<CardHeader>
								<Heading level={ 4 }>Client → agent log</Heading>
							</CardHeader>
							<CardBody>
								{ log.length === 0 ? (
									<Text variant="muted">Interact with the rendered UI to see `action` messages here.</Text>
								) : (
									<pre className="demo__log">
										{ log.map( ( entry ) => (
											<div key={ entry.id } className={ `demo__log-entry is-${ entry.kind }` }>
												{ entry.text }
											</div>
										) ) }
									</pre>
								) }
							</CardBody>
						</Card>
					</VStack>
				</aside>
				<main className="demo__stage">
					<div className="demo__stage-inner">
						<A2UIRenderer
							processor={ processor }
							emptyState={
								<Notice status="info" isDismissible={ false }>
									No surfaces yet. Click “Render all” or step through the messages.
								</Notice>
							}
						/>
					</div>
				</main>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}
