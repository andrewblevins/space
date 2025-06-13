import Terminal from './components/Terminal'
import LoginScreen from './components/LoginScreen'
import { ModalProvider } from './contexts/ModalContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useState, useEffect } from 'react'

function AppContent() {
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { user: true, loading: false };
  const { user, loading } = authData;
  
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
        <div className="text-green-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
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
