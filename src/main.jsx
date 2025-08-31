import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "./store/store";
import App from './App';
import './index.css';

// SettingsProvider را وارد کنید
import { SettingsProvider } from './context/SettingsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* کل اپلیکیشن را درون SettingsProvider قرار دهید */}
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
