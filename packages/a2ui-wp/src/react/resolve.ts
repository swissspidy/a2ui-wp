/**
 * Coerces values resolved by `@a2ui/web_core` into the types the WordPress
 * components work with.
 */

import { DataModel, type DataContext } from '@a2ui/web_core/v0_9';

export function isDataBinding( value: unknown ): value is { path: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		! Array.isArray( value ) &&
		typeof ( value as { path?: unknown } ).path === 'string' &&
		Object.keys( value ).length === 1
	);
}

/**
 * Absolute pointer of a (possibly relative) binding path.
 * @param path      Binding path.
 * @param scopePath Absolute pointer that relative paths resolve against.
 */
export function resolvePath( path: string, scopePath?: string ): string {
	return DataModel.resolvePath( path, scopePath );
}

export function coerceToString( value: unknown ): string {
	if ( value === null || value === undefined ) {
		return '';
	}
	if ( typeof value === 'object' ) {
		try {
			return JSON.stringify( value ) ?? String( value );
		} catch {
			return String( value );
		}
	}
	return String( value );
}

export function resolveString( value: unknown, scope: DataContext ): string {
	return coerceToString( scope.resolveDynamicValue( value ) );
}

export function resolveNumber(
	value: unknown,
	scope: DataContext,
	fallback = 0
): number {
	const resolved = scope.resolveDynamicValue( value );
	const n = typeof resolved === 'number' ? resolved : Number( resolved );
	return Number.isNaN( n ) ||
		resolved === '' ||
		resolved === null ||
		resolved === undefined
		? fallback
		: n;
}

export function resolveBoolean( value: unknown, scope: DataContext ): boolean {
	return Boolean( scope.resolveDynamicValue( value ) );
}

export function resolveStringList(
	value: unknown,
	scope: DataContext
): string[] {
	const resolved = scope.resolveDynamicValue( value );
	if ( Array.isArray( resolved ) ) {
		return resolved.map( ( item ) => String( item ) );
	}
	if ( typeof resolved === 'string' && resolved !== '' ) {
		return [ resolved ];
	}
	return [];
}
