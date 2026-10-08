/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Settings the plugin prints before the script.
 */
interface AgentSettings {
	/** Whether an AI provider, or another agent, can answer requests. */
	agentAvailable: boolean;
	/** REST route of the agent endpoint. */
	agentPath: string;
}

declare global {
	interface Window {
		a2uiWp?: AgentSettings;
	}
}

export const agentSettings: AgentSettings = {
	agentAvailable: false,
	agentPath: '/a2ui-wp/v1/agent',
	...window.a2uiWp,
};

export interface AgentTurn {
	/** What the user asked for. */
	prompt: string;
	/** Messages the agent sent so far in this conversation. */
	messages?: unknown[];
	/** The action message the user triggered. */
	action?: unknown;
	/** The client data model of the surfaces that send it. */
	dataModel?: unknown;
}

/**
 * Asks the agent for A2UI messages.
 *
 * @param turn The request, and for a follow-up the conversation so far.
 * @return The messages the agent answered with.
 */
export async function askAgent( turn: AgentTurn ): Promise< unknown[] > {
	const response = await apiFetch< { messages: unknown[] } >( {
		path: agentSettings.agentPath,
		method: 'POST',
		data: turn,
	} );
	return response.messages;
}

/**
 * Returns a readable message for a failed agent request.
 *
 * @param error What `apiFetch` rejected with.
 * @return The message.
 */
export function describeAgentError( error: unknown ): string {
	if ( error instanceof Error ) {
		return error.message;
	}
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message;
	}
	return String( error );
}
