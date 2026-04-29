import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import './PartyChat.css'
import './button.css'

export default function PartyChat({ team, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const fetchMessages = async () => {
    try {
      const data = await api.get(`/ggwp/chat/${team.id}`)
      if (Array.isArray(data)) setMessages(data)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()

    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      fetchMessages()
    }, 5000)

    return () => clearInterval(interval)
  }, [team.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await api.post(`/ggwp/chat/${team.id}`, { message: newMessage.trim() })
      setNewMessage('')
      fetchMessages()
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="party-chat">
      <div className="party-chat__messages">
        {loading ? (
          <span className="party-chat__empty">Ładowanie...</span>
        ) : messages.length === 0 ? (
          <span className="party-chat__empty">Brak wiadomości. Napisz coś do ekipy!</span>
        ) : (
          messages.map(m => {
            const isMe = m.user_id === user.id
            return (
              <div key={m.id} className={`party-chat__msg ${isMe ? 'party-chat__msg--me' : ''}`}>
                {!isMe && (
                  <div className="party-chat__sender">{m.nickname || 'Gracz'}</div>
                )}
                <div className="party-chat__bubble">{m.message}</div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form className="party-chat__form" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Napisz do ekipy..."
          className="party-chat__input"
        />
        <button type="submit" className="gh-btn gh-btn--sm" disabled={!newMessage.trim()}>
          Wyślij
        </button>
      </form>
    </div>
  )
}
