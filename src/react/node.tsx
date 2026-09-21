import { Notice } from '@wordpress/components';
import type { ChildList } from '../core/types';
import { isDataBinding, resolvePath } from '../core/resolver';
import { ScopeContext, useCatalog, useSurface } from './context';
import { useResolveScope } from './hooks';

/** Renders the component with the given id from the current surface. */
export function A2UINode( { id }: { id: string } ) {
	const surface = useSurface();
	const catalog = useCatalog();
	const definition = surface.getComponent( id );

	if ( ! definition ) {
		// Referenced but not (yet) defined: the stream may still be in flight.
		return null;
	}

	const Component = catalog[ definition.component ];
	if ( ! Component ) {
		return (
			<Notice status="warning" isDismissible={ false }>
				Unsupported component type <code>{ definition.component }</code> (id <code>{ id }</code>).
			</Notice>
		);
	}

	const { id: _id, component: _component, ...props } = definition;
	return <Component id={ id } props={ props } />;
}

/**
 * Renders a `ChildList`: either a static list of ids or a template expanded
 * once per item of a list in the data model, with relative bindings scoped
 * to that item.
 */
export function A2UIChildren( { children }: { children: ChildList | undefined } ) {
	const scope = useResolveScope();

	if ( Array.isArray( children ) ) {
		return (
			<>
				{ children.map( ( childId ) => (
					<A2UINode key={ childId } id={ childId } />
				) ) }
			</>
		);
	}

	if ( ! children || typeof children !== 'object' || ! isDataBinding( { path: children.path } ) || ! children.componentId ) {
		return null;
	}

	const listPath = resolvePath( children.path, scope );
	const items = scope.dataModel.get( listPath );
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
