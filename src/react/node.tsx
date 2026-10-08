import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import type { ChildList } from '@a2ui/web_core/v0_9';
import { ScopeContext, useCatalog, useScopePath, useSurface } from './context';
import { isDataBinding, resolvePath } from './resolve';

/**
 * Renders the component with the given id from the current surface.
 *
 * @param props    Component props.
 * @param props.id The component id.
 */
export function A2UINode( props: { id: string } ) {
	const { id } = props;
	const surface = useSurface();
	const catalog = useCatalog();
	const definition = surface.componentsModel.get( id );

	if ( ! definition ) {
		// Referenced but not (yet) defined: the stream may still be in flight.
		return null;
	}

	const Component = catalog[ definition.type ];
	if ( ! Component ) {
		return (
			<Notice status="warning" isDismissible={ false }>
				{ sprintf(
					/* translators: 1: component type, 2: component id */
					__(
						'Unsupported component type “%1$s” (id “%2$s”).',
						'a2ui-wp'
					),
					definition.type,
					id
				) }
			</Notice>
		);
	}

	const {
		id: _id,
		component: _component,
		...componentProps
	} = definition.properties;
	return <Component id={ id } props={ componentProps } />;
}

/**
 * Renders a `ChildList`: either a static list of ids or a template expanded
 * once per item of a list in the data model, with relative bindings scoped
 * to that item.
 *
 * @param props          Component props.
 * @param props.children The `children` property of the component.
 */
export function A2UIChildren( props: { children: ChildList | undefined } ) {
	const { children } = props;
	const surface = useSurface();
	const scopePath = useScopePath();

	if ( Array.isArray( children ) ) {
		return (
			<>
				{ children.map( ( childId ) => (
					<A2UINode key={ childId } id={ childId } />
				) ) }
			</>
		);
	}

	if (
		! children ||
		typeof children !== 'object' ||
		! isDataBinding( { path: children.path } ) ||
		! children.componentId
	) {
		return null;
	}

	const listPath = resolvePath( children.path, scopePath );
	const items = surface.dataModel.get( listPath );
	if ( ! Array.isArray( items ) ) {
		return null;
	}

	return (
		<>
			{ items.map( ( _item, index ) => {
				const itemPath = `${ listPath }/${ index }`;
				return (
					<ScopeContext.Provider key={ itemPath } value={ itemPath }>
						<A2UINode id={ children.componentId } />
					</ScopeContext.Provider>
				);
			} ) }
		</>
	);
}
