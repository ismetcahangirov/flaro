import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { AuthProvider } from './providers/AuthProvider.tsx'

// Köhnə 'flaro-auth' localStorage key-ini bir dəfə sil (storageKey konflikti düzəltmə)
// Bu blok bir versiya sonra silinə bilər
const MIGRATION_KEY = 'flaro-storage-migrated-v2'
if (!localStorage.getItem(MIGRATION_KEY)) {
  localStorage.removeItem('flaro-auth')
  localStorage.setItem(MIGRATION_KEY, '1')
}

import { I18nProvider } from '@/i18n/I18nContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)
