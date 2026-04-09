import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import './NotificationCenter.css'
import NotificationRedirect from './notificationRedirect'

export default function NotificationCenter({ user, onNavigate }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)

          // Show toast for new notification
          showToast(payload.new.title)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'tournament': return '⚔️'
      case 'team': return '👑'
      default: return '🔔'
    }
  }

  if (!user) return null

  return (
    <div className="notif-center" ref={menuRef}>
      <button className="notif-btn" onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Powiadomienia</h4>
            {unreadCount > 0 && (
              <button className="notif-mark-read" onClick={markAllAsRead}>Odczytaj wszystko</button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <p className="notif-empty">Brak powiadomień</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => {
                  NotificationRedirect({ onNavigate, notification: n })
                }}>
                  <span className="notif-icon">{getIcon(n.type)}</span>
                  <div className="notif-content">
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-msg">{n.message}</p>
                    <span className="notif-time">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
