import React from 'react';
import ReactDOM from 'react-dom/client'; // Use the new createRoot API
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Create the root container
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
