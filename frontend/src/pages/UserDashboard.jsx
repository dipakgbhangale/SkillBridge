import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { bookingsAPI, reviewsAPI, usersAPI } from '../api'
import { BookingStatusBadge, EmptyState, Modal } from '../components/ui'
import { LoadingSpinner, CardSkeleton } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Package, Star, User, Calendar, Clock, FileText, Edit2, Save, Camera, AlertCircle, X } from 'lucide-react'

const TABS = ['My Bookings', 'Profile']

/* ─── Helper: is review still editable (within 24 hrs)? ─── */
function canEditReview(review) {
    if (!review?.created_at) return false
    const elapsed = Date.now() - new Date(review.created_at).getTime()
    return elapsed < 24 * 60 * 60 * 1000
}

/* ─── Star rating input ─── */
function StarInput({ value, onChange }) {
    const [hover, setHover] = useState(0)
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                    onClick={() => onChange(s)}
                    onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                    className={`text-2xl transition-all duration-150 ${(hover || value) >= s ? 'text-yellow-400 scale-110' : 'text-dark-500'}`}>
                    ★
                </button>
            ))}
        </div>
    )
}

/* ─── Already rated popup ─── */
function AlreadyRatedPopup({ open, onClose, onEdit, canEdit }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="card p-6 max-w-sm w-full animate-scale-in">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400/15 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="font-bold text-white">Already Reviewed</h3>
                    <button onClick={onClose} className="ml-auto p-1 text-slate-500 hover:text-white rounded-lg hover:bg-dark-600 transition-all"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-slate-400 text-sm mb-5">You have already submitted a review for this service.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="btn-secondary flex-1">Ok</button>
                    {canEdit && <button onClick={onEdit} className="btn-primary flex-1 flex items-center gap-1.5 justify-center"><Edit2 className="w-4 h-4" />Edit Review</button>}
                </div>
                {!canEdit && <p className="text-xs text-slate-600 text-center mt-3">Edit window expired (24 hrs)</p>}
            </div>
        </div>
    )
}

export default function UserDashboard() {
    const { user, login } = useAuth()
    const [tab, setTab] = useState('My Bookings')
    const [bookings, setBookings] = useState([])
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    // Review states
    const [ratingModal, setRatingModal] = useState(null)   // booking being rated
    const [isEditMode, setIsEditMode] = useState(false)    // editing existing review
    const [ratingForm, setRatingForm] = useState({ rating: 5, feedback: '' })
    const [submittingRating, setSubmittingRating] = useState(false)
    const [alreadyRatedPopup, setAlreadyRatedPopup] = useState(null) // booking with existing review

    // Profile states
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [savingProfile, setSavingProfile] = useState(false)
    const fileRef = useRef()

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [bRes, pRes] = await Promise.all([bookingsAPI.myAsUser(), usersAPI.me()])
            setBookings(bRes.data)
            setProfile(pRes.data)
            setEditForm({ name: pRes.data.name || '', location: pRes.data.location || '', mobile: pRes.data.mobile || '', bio: pRes.data.bio || '' })
        } catch { toast.error('Failed to load dashboard') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    /* ── Review submit / edit ── */
    function openRatingModal(booking) {
        const review = booking.review
        if (review) {
            // Show popup, offer edit if within 24hrs
            setAlreadyRatedPopup(booking)
        } else {
            setIsEditMode(false)
            setRatingForm({ rating: 5, feedback: '' })
            setRatingModal(booking)
        }
    }

    function openEditModal(booking) {
        setAlreadyRatedPopup(null)
        setIsEditMode(true)
        setRatingForm({ rating: booking.review.rating, feedback: booking.review.feedback || '' })
        setRatingModal(booking)
    }

    async function submitRating(e) {
        e.preventDefault()
        setSubmittingRating(true)
        try {
            if (isEditMode) {
                await reviewsAPI.edit(ratingModal.id, { booking_id: ratingModal.id, ...ratingForm })
                toast.success('Review updated!')
            } else {
                await reviewsAPI.submit({ booking_id: ratingModal.id, ...ratingForm })
                toast.success('Review submitted!')
            }
            setRatingModal(null)
            fetchAll()
        } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
        finally { setSubmittingRating(false) }
    }

    /* ── Profile picture ── */
    function handleAvatarChange(e) {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 500_000) { toast.error('Image too large (max 500KB)'); return }
        const reader = new FileReader()
        reader.onload = (ev) => {
            const base64 = ev.target.result
            setEditForm(f => ({ ...f, avatar_url: base64 }))
        }
        reader.readAsDataURL(file)
    }

    /* ── Save profile ── */
    async function saveProfile() {
        setSavingProfile(true)
        try {
            const updated = await usersAPI.update(editForm)
            toast.success('Profile updated!')
            setEditMode(false)
            // Update auth context so navbar avatar updates
            const stored = JSON.parse(localStorage.getItem('sb_user') || '{}')
            const merged = { ...stored, avatar_url: editForm.avatar_url || stored.avatar_url, name: editForm.name || stored.name }
            localStorage.setItem('sb_user', JSON.stringify(merged))
            fetchAll()
        } catch { toast.error('Update failed') }
        finally { setSavingProfile(false) }
    }

    const statusOrder = ['ongoing', 'accepted', 'pending', 'completed', 'rejected', 'disputed']
    const sortedBookings = [...bookings].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" className="w-14 h-14 rounded-2xl object-cover border-2 border-primary-500/40" />
                    : <div className="w-14 h-14 rounded-2xl bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-2xl font-black text-primary-300">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                }
                <div>
                    <h1 className="text-2xl font-black text-white">{user?.name}'s Dashboard</h1>
                    <p className="text-slate-400 text-sm">{bookings.length} total bookings</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-dark-700/50 p-1 rounded-xl border border-dark-500 w-fit">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}>
                        {t === 'My Bookings' && <Package className="w-3.5 h-3.5 inline mr-1.5" />}
                        {t === 'Profile' && <User className="w-3.5 h-3.5 inline mr-1.5" />}
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
                </div>
            ) : tab === 'My Bookings' ? (
                <div className="flex flex-col gap-4">
                    {sortedBookings.length === 0
                        ? <EmptyState title="No bookings yet" subtitle="Browse services and make your first booking" />
                        : sortedBookings.map((b, i) => (
                            <div key={b.id} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white">{b.service?.service_name || 'Service'}</h3>
                                            <BookingStatusBadge status={b.status} />
                                        </div>
                                        <p className="text-slate-400 text-sm">Provider: <span className="text-slate-200">{b.provider?.name}</span></p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.booking_date}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.booking_time}</span>
                                        </div>
                                        {b.problem_description && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><FileText className="w-3 h-3" />{b.problem_description}</p>}

                                        {/* Show existing review stars */}
                                        {b.review && (
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => <span key={s} className={`text-xs ${s <= b.review.rating ? 'text-yellow-400' : 'text-dark-500'}`}>★</span>)}
                                                </div>
                                                <span className="text-xs text-slate-500">Your review</span>
                                                {canEditReview(b.review) && (
                                                    <span className="text-xs text-cyan-400 font-medium">• editable for {Math.max(0, Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - new Date(b.review.created_at).getTime())) / 3600000))}h</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Review button logic */}
                                    {b.status === 'completed' && (
                                        <div className="flex flex-col gap-2 shrink-0">
                                            {!b.review ? (
                                                <button onClick={() => openRatingModal(b)} className="btn-primary text-sm flex items-center gap-1.5">
                                                    <Star className="w-4 h-4" /> Rate Service
                                                </button>
                                            ) : (
                                                <>
                                                    {/* "Feedback Submitted" disabled button */}
                                                    <button
                                                        onClick={() => setAlreadyRatedPopup(b)}
                                                        className="px-4 py-2.5 rounded-xl font-semibold text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 cursor-default"
                                                    >
                                                        ✓ Feedback Submitted
                                                    </button>
                                                    {/* Edit button — only within 24 hrs */}
                                                    {canEditReview(b.review) && (
                                                        <button onClick={() => openEditModal(b)} className="btn-secondary text-sm flex items-center gap-1.5 justify-center">
                                                            <Edit2 className="w-4 h-4" /> Edit Review
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>
            ) : (
                /* ── Profile Tab ── */
                <div className="card p-6 max-w-lg animate-fade-in">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-white">My Profile</h2>
                        {editMode
                            ? <button onClick={saveProfile} disabled={savingProfile} className="btn-primary text-sm flex items-center gap-1.5">
                                {savingProfile ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                                Save
                            </button>
                            : <button onClick={() => setEditMode(true)} className="btn-secondary text-sm flex items-center gap-1.5">
                                <Edit2 className="w-4 h-4" />Edit
                            </button>
                        }
                    </div>

                    {/* Avatar upload */}
                    <div className="flex items-center gap-4 mb-6">
                        {(editMode ? editForm.avatar_url : profile?.avatar_url)
                            ? <img src={editMode ? editForm.avatar_url : profile.avatar_url} alt="avatar"
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-500/40" />
                            : <div className="w-16 h-16 rounded-2xl bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-2xl font-black text-primary-300">
                                {profile?.name?.[0]?.toUpperCase()}
                            </div>
                        }
                        {editMode && (
                            <div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                <button type="button" onClick={() => fileRef.current.click()}
                                    className="btn-secondary text-xs flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5" /> Upload Photo
                                </button>
                                <p className="text-[10px] text-slate-600 mt-1">Max 500KB · JPG, PNG</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {[
                            { label: 'Name', key: 'name' },
                            { label: 'Location', key: 'location' },
                            { label: 'Mobile', key: 'mobile' },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="label">{label}</label>
                                {editMode
                                    ? <input className="input" value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                                    : <p className="text-slate-300 text-sm py-2">{profile?.[key] || <span className="text-slate-500 italic">Not set</span>}</p>
                                }
                            </div>
                        ))}
                        <div>
                            <label className="label">Email</label>
                            <p className="text-slate-400 text-sm py-2">{profile?.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating / Edit Review Modal */}
            <Modal open={!!ratingModal} onClose={() => setRatingModal(null)}
                title={isEditMode ? 'Edit Your Review' : 'Rate this Service'}>
                <form onSubmit={submitRating} className="flex flex-col gap-4">
                    {isEditMode && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Edit window closes 24 hours from your original submission.
                        </div>
                    )}
                    <div>
                        <label className="label">Your Rating</label>
                        <StarInput value={ratingForm.rating} onChange={r => setRatingForm(f => ({ ...f, rating: r }))} />
                    </div>
                    <div>
                        <label className="label">Feedback {!isEditMode && '(optional)'}</label>
                        <textarea className="input resize-none" rows={3} placeholder="Share your experience…"
                            value={ratingForm.feedback} onChange={e => setRatingForm(f => ({ ...f, feedback: e.target.value }))} />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setRatingModal(null)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={submittingRating} className="btn-primary flex-1 flex items-center gap-1.5 justify-center">
                            {submittingRating ? <LoadingSpinner size="sm" /> : null}
                            {isEditMode ? 'Update Review' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Already Rated Popup */}
            <AlreadyRatedPopup
                open={!!alreadyRatedPopup}
                onClose={() => setAlreadyRatedPopup(null)}
                canEdit={alreadyRatedPopup ? canEditReview(alreadyRatedPopup?.review) : false}
                onEdit={() => openEditModal(alreadyRatedPopup)}
            />
        </div>
    )
}
