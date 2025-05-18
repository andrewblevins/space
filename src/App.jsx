import Terminal from './components/Terminal'
import { ModalProvider } from './contexts/ModalContext'

function App() {
  return (
    <ModalProvider>
      <Terminal />
    </ModalProvider>
  )
}

export default App