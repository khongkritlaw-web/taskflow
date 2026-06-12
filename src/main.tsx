import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CustomDialogProvider } from './components/CustomDialog.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomDialogProvider>
      <App />
    </CustomDialogProvider>
  </StrictMode>,
);
