import type { ComponentCatalog } from '../context.js';
import { AudioPlayer, Icon, Image, Text, Video } from './content.js';
import {
	Button,
	CheckBox,
	ChoicePicker,
	DateTimeInput,
	Modal,
	Slider,
	TextField,
} from './inputs.js';
import { Card, Column, Divider, List, Row, Tabs } from './layout.js';

/** The A2UI basic catalog rendered with `@wordpress/components`. */
export const wordPressCatalog: ComponentCatalog = {
	Text,
	Image,
	Icon,
	Video,
	AudioPlayer,
	Row,
	Column,
	List,
	Card,
	Tabs,
	Modal,
	Divider,
	Button,
	TextField,
	CheckBox,
	ChoicePicker,
	Slider,
	DateTimeInput,
};

/**
 * Extends or overrides the default catalog with custom components.
 * @param overrides Components to add or replace, keyed by A2UI component type.
 */
export function createCatalog( overrides: ComponentCatalog ): ComponentCatalog {
	return { ...wordPressCatalog, ...overrides };
}

export { SUPPORTED_ICON_NAMES, getWordPressIcon } from './icons.js';
export * from './content.js';
export * from './inputs.js';
export * from './layout.js';
