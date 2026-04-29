import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { useToast } from './Toast'
import './NotificationCenter.css'
import NotificationRedirect from './notificationRedirect'

export default function NotificationCenter({ user, onNavigate }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef(null)
  const { showToast } = useToast()
  const prevIdsRef = useRef(new Set())

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      fetchNotificationsQuiet()
    }, 30000)

    return () => clearInterval(interval)
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
    try {
      const data = await api.get('/ggwp/notifications')
      if (!Array.isArray(data)) return
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
      prevIdsRef.current = new Set(data.map(n => n.id))
    } catch {
      // silently ignore
    }
  }

  const fetchNotificationsQuiet = async () => {
    try {
      const data = await api.get('/ggwp/notifications')
      if (!Array.isArray(data)) return

      const newItems = data.filter(n => !prevIdsRef.current.has(n.id))
      if (newItems.length > 0) {
        newItems.forEach(n => showToast(n.title))
      }

      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
      prevIdsRef.current = new Set(data.map(n => n.id))
    } catch {
      // silently ignore
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/ggwp/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // silently ignore
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
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => NotificationRedirect({ onNavigate, notification: n })}
                >
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
