import Terminal from './components/Terminal'
import { ModalProvider } from './contexts/ModalContext'
import { useState, useEffect } from 'react'

function App() {
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

  return (
    <ModalProvider>
      <Terminal theme={theme} toggleTheme={toggleTheme} />
    </ModalProvider>
  )
}

export default App
