import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './PartyChat.css'
import './button.css'

export default function PartyChat({ team, user }) {
  const [messages, setMessages] = useState([])
  const [profiles, setProfiles] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('team_messages')
      .select('*')
      .eq('team_id', team.id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data && data.length > 0) {
      setMessages(data)
      const uniqueIds = [...new Set(data.map(m => m.user_id))]
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', uniqueIds)

      if (profileData) {
        const map = {}
        profileData.forEach(p => { map[p.id] = p })
        setProfiles(map)
      }
    } else {
      setMessages([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`party-chat-${team.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_messages',
        filter: `team_id=eq.${team.id}`
      }, () => {
        fetchMessages()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [team.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('team_messages')
      .insert({ team_id: team.id, user_id: user.id, message: newMessage.trim() })

    if (!error) setNewMessage('')
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
            const profile = profiles[m.user_id]
            return (
              <div key={m.id} className={`party-chat__msg ${isMe ? 'party-chat__msg--me' : ''}`}>
                {!isMe && (
                  <div className="party-chat__sender">{profile?.nickname || 'Gracz'}</div>
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
