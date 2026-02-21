import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePhotoZoom } from '../context/PhotoZoomContext'
import { notificationsAPI } from '../api'
import { Bell, LogOut, User, Search, Zap, Menu, X, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
    const { user, isAuth, logout } = useAuth()
    const navigate = useNavigate()
    const { openPhotoZoom } = usePhotoZoom()
    const [notifOpen, setNotifOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unread, setUnread] = useState(0)
    const [scrolled, setScrolled] = useState(false)
    const pollRef = useRef(null)

    // Navbar shadow on scroll
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Poll unread count
    useEffect(() => {
        if (isAuth) {
            fetchUnread()
            pollRef.current = setInterval(fetchUnread, 15000)
        }
        return () => clearInterval(pollRef.current)
    }, [isAuth])

    async function fetchUnread() {
        try {
            const { data } = await notificationsAPI.unreadCount()
            setUnread(data.unread_count)
        } catch { }
    }

    async function openNotifications() {
        setNotifOpen(o => !o)
        if (!notifOpen) {
            try {
                const { data } = await notificationsAPI.list()
                setNotifications(data)
                fetchUnread()
            } catch { }
        }
    }

    async function markRead(id) {
        try {
            await notificationsAPI.markRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnread(u => Math.max(0, u - 1))
        } catch { }
    }

    async function markAllRead() {
        try {
            await notificationsAPI.markAllRead()
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnread(0)
        } catch { }
    }

    function handleLogout() { logout(); navigate('/') }

    const dashPath = user?.role === 'provider' ? '/dashboard/provider' : '/dashboard/user'

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark-900/95 backdrop-blur-xl border-b border-dark-600 shadow-xl' : 'bg-dark-900/80 backdrop-blur-md border-b border-dark-700'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow transition-transform group-hover:scale-110">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-lg text-gradient hidden sm:block">SkillBridge</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        <NavLink to="/search" icon={<Search className="w-4 h-4" />} label="Browse" />
                        {isAuth && <NavLink to={dashPath} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {isAuth ? (
                            <>
                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={openNotifications}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-all duration-200 text-sm font-medium"
                                        aria-label="Notifications"
                                    >
                                        <Bell className="w-4 h-4" />
                                        <span className="hidden sm:inline">Notifications</span>
                                        {unread > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce-subtle shadow-glow">
                                                {unread > 9 ? '9+' : unread}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification dropdown */}
                                    {notifOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 card border-dark-500 shadow-2xl animate-scale-in overflow-hidden z-50">
                                            <div className="p-3 border-b border-dark-600 flex items-center justify-between">
                                                <span className="font-bold text-sm text-white">Notifications</span>
                                                <div className="flex items-center gap-2">
                                                    {unread > 0 && (
                                                        <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                                                            Mark all read
                                                        </button>
                                                    )}
                                                    <button onClick={() => setNotifOpen(false)} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-dark-600 transition-all">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-6 text-center">
                                                        <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                                        <p className="text-slate-500 text-xs">No notifications yet</p>
                                                    </div>
                                                ) : (
                                                    notifications.map((n, i) => (
                                                        <button key={n.id} onClick={() => markRead(n.id)}
                                                            className={`w-full text-left p-3 border-b border-dark-700 last:border-0 transition-all hover:bg-dark-700 animate-fade-in stagger-${Math.min(i + 1, 5)}`}
                                                            style={{ animationDelay: `${i * 0.04}s` }}>
                                                            <div className="flex items-start gap-2">
                                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-dark-500' : 'bg-primary-400'}`} />
                                                                <div>
                                                                    <p className={`text-xs font-semibold ${n.is_read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                                                                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User avatar pill — click to zoom photo */}
                                <button
                                    type="button"
                                    onClick={() => openPhotoZoom(user?.avatar_url, user?.name)}
                                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 rounded-xl border border-dark-500 hover:border-primary-500/40 hover:shadow-glow transition-all duration-200 group cursor-pointer"
                                    title="View profile photo"
                                >
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt="avatar" className="w-7 h-7 rounded-lg object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <span className="w-7 h-7 rounded-lg bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-xs font-black text-primary-300 group-hover:scale-105 transition-transform">
                                            {user?.name?.[0]?.toUpperCase()}
                                        </span>
                                    )}
                                    <div className="hidden lg:block">
                                        <p className="text-xs font-semibold text-white leading-tight">{user?.name?.split(' ')[0]}</p>
                                        <p className="text-[10px] text-primary-400 capitalize leading-tight">{user?.role}</p>
                                    </div>
                                </button>

                                {/* Logout */}
                                <button onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-all hover:bg-dark-700">
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </>
                        )}

                        {/* Mobile hamburger */}
                        <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-all">
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-dark-700 bg-dark-900/98 backdrop-blur-xl animate-slide-up">
                    <div className="px-4 py-3 flex flex-col gap-1">
                        <MobileLink to="/search" label="Browse Services" onClick={() => setMobileOpen(false)} />
                        {isAuth && <MobileLink to={dashPath} label="Dashboard" onClick={() => setMobileOpen(false)} />}
                        {isAuth
                            ? <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="text-left px-4 py-3 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all">Logout</button>
                            : <>
                                <MobileLink to="/login" label="Sign In" onClick={() => setMobileOpen(false)} />
                                <MobileLink to="/register" label="Get Started" onClick={() => setMobileOpen(false)} highlight />
                            </>
                        }
                    </div>
                </div>
            )}
        </nav>
    )
}

function NavLink({ to, icon, label }) {
    return (
        <Link to={to} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-all duration-200 text-sm font-medium">
            {icon}{label}
        </Link>
    )
}

function MobileLink({ to, label, onClick, highlight }) {
    return (
        <Link to={to} onClick={onClick}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${highlight ? 'btn-primary text-center' : 'text-slate-300 hover:text-white hover:bg-dark-700'}`}>
            {label}
        </Link>
    )
}
