import profileCard from './profile-card.json';
import orderSummary from './order-summary.json';
import signupForm from './signup-form.json';
import tabsAndModal from './tabs-and-modal.json';
import liveUpdates from './live-updates.json';

export interface Example {
	name: string;
	description: string;
	messages: unknown[];
}

export const examples: Example[] = [
	profileCard,
	orderSummary,
	signupForm,
	tabsAndModal,
	liveUpdates,
];
