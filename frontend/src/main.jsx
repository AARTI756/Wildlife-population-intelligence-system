import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// Intercept Google Identity Services script loading to ensure initialize is only called once
(function() {
  let googleVal = window.google;
  
  const setupInterceptor = (val) => {
    if (val && val.accounts && val.accounts.id) {
      if (!val.accounts.id.originalInitialize) {
        val.accounts.id.originalInitialize = val.accounts.id.initialize;
        let initialized = false;
        val.accounts.id.initialize = function(config) {
          if (!initialized) {
            // Keep use_fedcm true or false as configured, but ensure single init
            val.accounts.id.originalInitialize(config);
            initialized = true;
          }
        };
      }
    }
  };

  if (googleVal) {
    setupInterceptor(googleVal);
  }

  try {
    Object.defineProperty(window, 'google', {
      configurable: true,
      enumerable: true,
      get() {
        return googleVal;
      },
      set(val) {
        googleVal = val;
        setupInterceptor(val);
      }
    });
  } catch (e) {
    console.warn("Failed to define window.google property interceptor:", e);
  }
})();

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </StrictMode>,
)

