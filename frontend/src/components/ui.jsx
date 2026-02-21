import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Wrench, Phone, User, X, ZoomIn } from 'lucide-react'
import { usePhotoZoom } from '../context/PhotoZoomContext'

/* ══════════════════════════════════════════════════
   1. Photo Zoom Modal — clicking the avatar photo
══════════════════════════════════════════════════ */
export function PhotoZoomModal({ provider, open, onClose }) {
    if (!open || !provider) return null
    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-dark-700 border border-dark-400 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
                >
                    <X className="w-4 h-4" />
                </button>

                {provider.avatar_url ? (
                    <img
                        src={provider.avatar_url}
                        alt={provider.name}
                        className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl object-cover border-2 border-primary-500/40 shadow-2xl shadow-primary-500/20 animate-scale-in"
                    />
                ) : (
                    <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-br from-primary-700/60 to-primary-900/80 border-2 border-primary-500/40 flex items-center justify-center shadow-2xl animate-scale-in">
                        <span className="text-8xl font-black text-primary-200">{provider.name?.[0]?.toUpperCase()}</span>
                    </div>
                )}

                <p className="text-center text-slate-300 font-semibold mt-3">{provider.name}</p>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════
   2. Provider Info Modal — clicking anywhere on card
══════════════════════════════════════════════════ */
export function ProviderInfoModal({ provider, open, onClose }) {
    if (!open || !provider) return null
    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            {/* Outer card */}
            <div
                className="relative card p-6 max-w-sm w-full animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white hover:bg-dark-600 rounded-xl transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Photo sub-card */}
                <div className="bg-dark-700 border border-dark-500 rounded-2xl p-4 mb-5 flex flex-col items-center gap-3">
                    {provider.avatar_url ? (
                        <img
                            src={provider.avatar_url}
                            alt={provider.name}
                            className="w-28 h-28 rounded-2xl object-cover border-2 border-primary-500/30 shadow-lg"
                        />
                    ) : (
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-700/50 to-primary-900/80 border-2 border-primary-500/30 flex items-center justify-center">
                            <span className="text-5xl font-black text-primary-200">{provider.name?.[0]?.toUpperCase()}</span>
                        </div>
                    )}
                    <p className="font-black text-white text-base text-center">{provider.name}</p>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-5">
                    {provider.location && (
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                            {provider.location}
                        </p>
                    )}
                    {provider.mobile && (
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                            {provider.mobile}
                        </p>
                    )}
                    {typeof provider.avg_rating === 'number' && provider.avg_rating > 0 && (
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                            <span className="text-yellow-400 font-bold text-sm">{provider.avg_rating.toFixed(1)}</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} className={`text-xs ${s <= Math.round(provider.avg_rating) ? 'text-yellow-400' : 'text-dark-500'}`}>★</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {provider.bio && (
                    <p className="text-slate-400 text-xs leading-relaxed border-t border-dark-500 pt-4 mb-5">
                        {provider.bio}
                    </p>
                )}

                {provider.id && (
                    <Link
                        to={`/provider/${provider.id}`}
                        onClick={onClose}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                    >
                        <User className="w-4 h-4" /> View Full Profile
                    </Link>
                )}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════
   3. ServiceCard
   - avatar click  → onAvatarClick (photo zoom)
   - rest of card  → onCardClick  (info popup)
══════════════════════════════════════════════════ */
export function ServiceCard({ service, onClick, onCardClick, onAvatarClick }) {
    const [showTooltip, setShowTooltip] = useState(false)
    const { openPhotoZoom } = usePhotoZoom()

    const categoryColors = {
        plumbing: 'bg-blue-500/20 text-blue-400',
        electrical: 'bg-yellow-500/20 text-yellow-400',
        cleaning: 'bg-green-500/20 text-green-400',
        carpentry: 'bg-orange-500/20 text-orange-400',
        painting: 'bg-pink-500/20 text-pink-400',
        default: 'bg-primary-500/20 text-primary-400',
    }
    const catColor = categoryColors[service.category?.toLowerCase()] || categoryColors.default
    const prov = service.provider

    // Build provider object for modals
    function providerObj() {
        return {
            id: service.provider_id,
            name: prov?.name,
            avatar_url: prov?.avatar_url,
            location: prov?.location,
            mobile: prov?.mobile,
            bio: prov?.bio,
        }
    }

    function handleCardClick(e) {
        // If onCardClick is given, use popup; else fall back to legacy onClick (navigate)
        if (onCardClick) onCardClick(providerObj())
        else if (onClick) onClick()
    }

    function handleAvatarClick(e) {
        e.preventDefault()
        e.stopPropagation()
        // Use global zoom context — works from any page/context
        openPhotoZoom(prov?.avatar_url, prov?.name)
    }

    return (
        <div
            className="card-hover p-5 flex flex-col gap-3 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white text-base leading-tight">{service.service_name}</h3>
                <span className={`badge ${catColor} shrink-0`}>{service.category}</span>
            </div>

            {service.description && (
                <p className="text-slate-400 text-sm line-clamp-2">{service.description}</p>
            )}

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-dark-500/50">
                <div className="flex items-center gap-2">

                    {/* Avatar — click to zoom */}
                    <div
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-500/30 hover:border-primary-400 hover:shadow-glow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400/40 group"
                            aria-label="View profile photo"
                        >
                            {prov?.avatar_url ? (
                                <img src={prov.avatar_url} alt={prov.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                                <div className="w-full h-full bg-primary-600/50 flex items-center justify-center text-xs font-bold text-primary-200">
                                    {prov?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </button>

                        {/* Zoom icon badge */}
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-primary-500 rounded-full flex items-center justify-center pointer-events-none">
                            <ZoomIn className="w-2 h-2 text-white" />
                        </div>

                        {/* Tooltip */}
                        {showTooltip && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-600 border border-dark-400 text-[10px] text-white px-2 py-0.5 rounded-lg whitespace-nowrap z-20 pointer-events-none animate-fade-in shadow-lg">
                                View photo
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-300">{prov?.name || 'Provider'}</p>
                        {prov?.location && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{prov.location}
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-lg font-black text-gradient">
                    ₹{service.min_price}<span className="text-xs text-slate-500 font-normal">/min</span>
                </p>
            </div>
        </div>
    )
}

/* ── Other shared components ── */
export function BookingStatusBadge({ status }) {
    const cls = {
        pending: 'badge-pending',
        accepted: 'badge-accepted',
        ongoing: 'badge-ongoing',
        completed: 'badge-completed',
        rejected: 'badge-rejected',
        disputed: 'badge-disputed',
    }
    return <span className={cls[status] || 'badge bg-slate-500/20 text-slate-400'}>{status}</span>
}

export function StarRating({ value, onChange, max = 5 }) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map(star => (
                <button key={star} onClick={() => onChange?.(star)} type="button"
                    className={`text-2xl transition-transform hover:scale-110 ${star <= value ? 'text-yellow-400' : 'text-dark-500'}`}>
                    ★
                </button>
            ))}
        </div>
    )
}

export function EmptyState({ icon: Icon = Wrench, title, subtitle }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-dark-600 rounded-2xl flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-300 mb-1">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
    )
}

export function Modal({ open, onClose, title, children }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative card w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto animate-scale-in">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-dark-600 rounded-xl transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
