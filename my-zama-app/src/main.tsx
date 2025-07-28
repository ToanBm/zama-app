import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { FhevmProvider } from './providers/FhevmProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FhevmProvider>
      <App />
    </FhevmProvider>
  </React.StrictMode>
);
