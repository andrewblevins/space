import Terminal from './components/Terminal'
import LoginScreen from './components/LoginScreen'
import WelcomeScreen from './components/WelcomeScreen'
import MobileWarning from './components/MobileWarning'
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
  const [showMobileWarning, setShowMobileWarning] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Check for mobile device on mount
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasSeenWarning = localStorage.getItem('space_mobile_warning_seen');
    
    if (isMobile && !hasSeenWarning) {
      setShowMobileWarning(true);
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleCloseMobileWarning = () => {
    setShowMobileWarning(false);
    localStorage.setItem('space_mobile_warning_seen', 'true');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return <LoginScreen />;
    }
    return <WelcomeScreen onGetStarted={() => setShowLogin(true)} />;
  }

  return (
    <ModalProvider>
      <Terminal theme={theme} toggleTheme={toggleTheme} />
      <MobileWarning 
        isOpen={showMobileWarning} 
        onClose={handleCloseMobileWarning} 
      />
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
