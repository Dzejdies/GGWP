import { useState } from 'react'
import LoginModal from '../components/LoginModal'

export function useAuthGuard(user, onAuthChange) {
  const [showModal, setShowModal] = useState(false)

  const requireAuth = (action) => {
    if (user) {
      action()
    } else {
      setShowModal(true)
    }
  }

  const AuthModal = showModal ? (
    <LoginModal
      initialMode="register"
      onClose={() => setShowModal(false)}
      onSuccess={(session) => {
        onAuthChange(session.user)
        setShowModal(false)
      }}
    />
  ) : null

  return { requireAuth, AuthModal }
}
