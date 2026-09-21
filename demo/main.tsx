import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@wordpress/components/build-style/style.css';
import './demo.css';
import { App } from './App';

createRoot( document.getElementById( 'root' )! ).render(
	<StrictMode>
		<App />
	</StrictMode>
);
