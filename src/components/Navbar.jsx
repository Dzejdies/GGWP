import { useState } from 'react'
import ThemeToggle from '../themeToggle'
import LoginModal from './LoginModal'
import { supabase } from '../lib/supabase'
import NotificationCenter from './NotificationCenter'
import './Navbar.css'
import './LoginModal.css'
import './button.css'

const NAV_ITEMS = [
    { icon: '🏠', label: 'O zespole', view: 'home' },
    { icon: '🎮', label: 'O projekcie', view: 'project' },
    { icon: '🏆', label: 'Baza Turniejów', view: 'tournaments-list' },
    { icon: '🔬', label: 'Analiza UX', view: 'analysis' },
    { icon: '📋', label: 'Plan realizacji', view: 'plan' },
]

export default function Navbar({ onNavigate, currentView, user, onAuthChange, initialTabData }) {
    const [open, setOpen] = useState(false)
    const [showLogin, setShowLogin] = useState(false)

    const go = (view, data = null) => {
        setOpen(false)
        onNavigate(view, data)
    }

    const handleLogout = async () => {
        if (!supabase) return
        await supabase.auth.signOut()
        if (onAuthChange) onAuthChange(null)
        setOpen(false)
    }

    const nickname = user?.user_metadata?.nickname || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '?'
    const initials = nickname.slice(0, 2).toUpperCase()
    const avatarUrl = user?.user_metadata?.avatar_url
    const isAdmin = user?.app_metadata?.role === 'admin'

    return (
        <>
            <nav className="navbar">
                <button className="navbar__logo" onClick={() => go(user ? 'dashboard' : 'landing')}>
                    🎮 GG WP <span>for Good</span>
                </button>
                <div className="navbar__right">
                    {user ? (
                        <div className="navbar__user">
                            <NotificationCenter user={user} />
                            <div className="navbar__user-avatar" onClick={() => go('account')} style={{ cursor: 'pointer' }}>
                                {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : initials}
                            </div>
                        </div>
                    ) : (
                        <button className="navbar__login-btn" onClick={() => setShowLogin(true)}>
                            Zaloguj się
                        </button>
                    )}
                    <ThemeToggle />
                    <button
                        className={`navbar__burger${open ? ' open' : ''}`}
                        onClick={() => setOpen((v) => !v)}
                        aria-label="Menu"
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </nav>

            {showLogin && (
                <LoginModal
                    onClose={() => setShowLogin(false)}
                    onSuccess={(session) => {
                        if (onAuthChange) onAuthChange(session.user)
                    }}
                />
            )}

            {open && (
                <>
                    <div className="navbar__overlay" onClick={() => setOpen(false)} />
                    <aside className="navbar__sidebar">
                        <button className="navbar__sidebar-close" onClick={() => setOpen(false)}>✕</button>
                        <div className="navbar__sidebar-logo">GG WP for Good</div>

                        {user && (
                            <div className="navbar__sidebar-user" onClick={() => go('account')} style={{ cursor: 'pointer' }}>
                                <div className="navbar__sidebar-user-avatar">
                                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : initials}
                                </div>
                                <div className="navbar__sidebar-user-info">
                                    <span className="navbar__sidebar-user-name">{nickname}</span>
                                    <span className="navbar__sidebar-user-email">{user.email}</span>
                                </div>
                            </div>
                        )}

                        <nav className="navbar__sidebar-nav">
                            {user && (
                                <button
                                    className={`navbar__sidebar-item${currentView === 'dashboard' ? ' active' : ''}`}
                                    onClick={() => go('dashboard')}
                                >
                                    <span className="navbar__sidebar-icon">📊</span>
                                    Dashboard
                                </button>
                            )}
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.view}
                                    className={`navbar__sidebar-item${currentView === item.view ? ' active' : ''}`}
                                    onClick={() => go(item.view)}
                                >
                                    <span className="navbar__sidebar-icon">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {user ? (
                            <>
                                <button
                                    className={`navbar__sidebar-item${currentView === 'account' && initialTabData?.tab === 'teams' ? ' active' : ''}`}
                                    onClick={() => go('account', { tab: 'teams' })}
                                >
                                    <span className="navbar__sidebar-icon">👥</span>
                                    Moje drużyny
                                </button>
                                <button
                                    className={`navbar__sidebar-item${currentView === 'account' && (!initialTabData || initialTabData?.tab === 'profile') ? ' active' : ''}`}
                                    onClick={() => go('account', { tab: 'profile' })}
                                >
                                    <span className="navbar__sidebar-icon">👤</span>
                                    Moje konto
                                </button>
                                {isAdmin && (
                                    <button
                                        className={`navbar__sidebar-item${currentView === 'admin' ? ' active' : ''}`}
                                        onClick={() => go('admin')}
                                    >
                                        <span className="navbar__sidebar-icon">🛡️</span>
                                        Admin Panel
                                    </button>
                                )}
                                <button className="navbar__sidebar-logout" onClick={handleLogout}>
                                    <span>🚪</span> Wyloguj się
                                </button>
                            </>
                        ) : (
                            <button
                                className="navbar__sidebar-item"
                                onClick={() => { setOpen(false); setShowLogin(true) }}
                            >
                                <span className="navbar__sidebar-icon">🔐</span>
                                Zaloguj się
                            </button>
                        )}

                        <div className="navbar__sidebar-footer">
                            Projektowanie Interfejsów WWW<br />
                            © {new Date().getFullYear()} GG WP for Good
                        </div>
                    </aside>
                </>
            )}
        </>
    )
}
