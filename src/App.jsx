import Terminal from './components/Terminal'
import WelcomeScreen from './components/WelcomeScreen'
import { ModalProvider } from './contexts/ModalContext'
import { AuthProvider, useAuthSafe } from './contexts/AuthContext'
import { useState, useEffect } from 'react'

function AppContent() {
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  // useAuthSafe returns default values when auth is not enabled
  const authData = useAuthSafe();
  // In legacy mode (no auth), treat user as truthy to skip login
  const user = useAuthSystem ? authData.user : true;
  const loading = useAuthSystem ? authData.loading : false;
  
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('theme') || 'dark'
  )

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-orange-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <WelcomeScreen />;
  }

  return (
    <ModalProvider>
      <Terminal theme={theme} toggleTheme={toggleTheme} />
    </ModalProvider>
  )
}

function App() {
  const useAuth = import.meta.env.VITE_USE_AUTH === 'true';
  
  if (useAuth) {
    return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    );
  }
  
  // Legacy mode without auth
  return <AppContent />;
}

export default App
