import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { bookingsAPI, servicesAPI, calendarAPI, reviewsAPI, usersAPI } from '../api'
import { BookingStatusBadge, EmptyState, Modal } from '../components/ui'
import { LoadingSpinner, CardSkeleton } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Briefcase, Calendar, Package, Star, User, Plus, Edit2, Trash2, Check, X, Clock, Camera, AlertTriangle, Bell } from 'lucide-react'

const TABS = ['Requests', 'Services', 'Calendar', 'Ratings', 'Profile']
const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'AC Service', 'Pest Control', 'Appliance Repair', 'Other']

/* ─── Confirm Delete Dialog ─── */
function ConfirmDeleteDialog({ open, title, message, onConfirm, onCancel, loading }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="card p-6 max-w-sm w-full animate-scale-in">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="font-bold text-white">{title || 'Confirm Delete'}</h3>
                </div>
                <p className="text-slate-400 text-sm mb-5">{message || 'Are you sure you want to delete this? This action cannot be undone.'}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 flex items-center gap-1.5 justify-center">
                        {loading ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ProviderDashboard() {
    const { user } = useAuth()
    const [tab, setTab] = useState('Requests')
    const [bookings, setBookings] = useState([])
    const [services, setServices] = useState([])
    const [events, setEvents] = useState([])
    const [reviews, setReviews] = useState([])
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    // Service modal
    const [svcModal, setSvcModal] = useState(false)
    const [editSvc, setEditSvc] = useState(null)
    const [svcForm, setSvcForm] = useState({ service_name: '', description: '', min_price: '', category: CATEGORIES[0], image_url: '' })
    const [savingSvc, setSavingSvc] = useState(false)

    // Calendar event modal
    const [evtModal, setEvtModal] = useState(false)
    const [evtForm, setEvtForm] = useState({ title: '', event_type: 'event', start_datetime: '', end_datetime: '', color: '#6366f1', reminder_minutes: '' })

    // Delete confirm dialog
    const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'service'|'event', id, name }
    const [deleting, setDeleting] = useState(false)

    // Profile
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [savingProfile, setSavingProfile] = useState(false)
    const fileRef = useRef()

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [bRes, sRes, eRes, rRes, pRes] = await Promise.all([
                bookingsAPI.myAsProvider(),
                servicesAPI.my(),
                calendarAPI.list(),
                reviewsAPI.byProvider(user?.user_id),
                usersAPI.me(),
            ])
            setBookings(bRes.data)
            setServices(sRes.data)
            setReviews(rRes.data)
            setProfile(pRes.data)
            setEditForm({ name: pRes.data.name || '', location: pRes.data.location || '', mobile: pRes.data.mobile || '', bio: pRes.data.bio || '' })

            // Build FullCalendar events
            setEvents([
                ...eRes.data.map(e => ({
                    id: `cal-${e.id}`,
                    title: e.title,
                    start: e.start_datetime,
                    end: e.end_datetime,
                    backgroundColor: e.color || (e.event_type === 'holiday' ? '#ef4444' : e.event_type === 'reminder' ? '#f59e0b' : '#6366f1'),
                    borderColor: 'transparent',
                    extendedProps: { dbId: e.id, type: e.event_type, eventTitle: e.title },
                })),
                ...bRes.data.filter(b => ['accepted', 'ongoing'].includes(b.status)).map(b => ({
                    id: `bk-${b.id}`,
                    title: `📋 ${b.service?.service_name || 'Booking'}`,
                    start: `${b.booking_date}T${b.booking_time}`,
                    backgroundColor: b.status === 'ongoing' ? '#06b6d4' : '#4f46e5',
                    borderColor: 'transparent',
                    extendedProps: { type: 'booking' },
                })),
            ])
        } catch { toast.error('Failed to load dashboard') }
        finally { setLoading(false) }
    }, [user?.user_id])

    useEffect(() => { fetchAll() }, [fetchAll])

    /* ── Booking status ── */
    async function updateStatus(id, status) {
        try { await bookingsAPI.updateStatus(id, status); toast.success(`Booking ${status}`); fetchAll() }
        catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
    }

    /* ── Service CRUD ── */
    async function saveSvc(e) {
        e.preventDefault(); setSavingSvc(true)
        try {
            const data = { ...svcForm, min_price: Number(svcForm.min_price) }
            if (editSvc) { await servicesAPI.update(editSvc.id, data); toast.success('Service updated!') }
            else { await servicesAPI.create(data); toast.success('Service created!') }
            setSvcModal(false); setEditSvc(null)
            setSvcForm({ service_name: '', description: '', min_price: '', category: CATEGORIES[0], image_url: '' })
            fetchAll()
        } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
        finally { setSavingSvc(false) }
    }

    function openEditSvc(svc) {
        setEditSvc(svc)
        setSvcForm({ service_name: svc.service_name, description: svc.description || '', min_price: String(svc.min_price), category: svc.category, image_url: svc.image_url || '' })
        setSvcModal(true)
    }

    /* ── Calendar event ── */
    async function saveEvent(e) {
        e.preventDefault()
        try {
            const payload = { ...evtForm }
            if (payload.reminder_minutes) payload.reminder_minutes = Number(payload.reminder_minutes)
            else delete payload.reminder_minutes
            await calendarAPI.create(payload)
            toast.success('Event added!')
            setEvtModal(false)
            setEvtForm({ title: '', event_type: 'event', start_datetime: '', end_datetime: '', color: '#6366f1', reminder_minutes: '' })
            fetchAll()
        } catch { toast.error('Failed') }
    }

    /* ── Delete flow ── */
    function askDelete(type, id, name) {
        setDeleteTarget({ type, id, name })
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            if (deleteTarget.type === 'service') { await servicesAPI.delete(deleteTarget.id); toast.success('Service deleted') }
            else if (deleteTarget.type === 'event') { await calendarAPI.delete(deleteTarget.id); toast.success('Event removed') }
            setDeleteTarget(null)
            fetchAll()
        } catch { toast.error('Failed to delete') }
        finally { setDeleting(false) }
    }

    /* ── Profile ── */
    function handleAvatarChange(e) {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 500_000) { toast.error('Image too large (max 500KB)'); return }
        const reader = new FileReader()
        reader.onload = (ev) => setEditForm(f => ({ ...f, avatar_url: ev.target.result }))
        reader.readAsDataURL(file)
    }

    async function saveProfile() {
        setSavingProfile(true)
        try { await usersAPI.update(editForm); toast.success('Profile updated!'); setEditMode(false); fetchAll() }
        catch { toast.error('Update failed') }
        finally { setSavingProfile(false) }
    }

    const eventTypeColors = { event: '#6366f1', holiday: '#ef4444', reminder: '#f59e0b' }
    const pending = bookings.filter(b => b.status === 'pending')
    const active = bookings.filter(b => ['accepted', 'ongoing'].includes(b.status))
    const done = bookings.filter(b => ['completed', 'rejected', 'disputed'].includes(b.status))

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">

            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
                {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400/40" />
                    : <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl font-black text-cyan-300">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                }
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-white">{user?.name}'s Workspace</h1>
                    <div className="flex gap-4 mt-1.5 text-sm flex-wrap">
                        <span className="text-yellow-400 font-medium">{pending.length} pending</span>
                        <span className="text-cyan-400 font-medium">{active.length} active</span>
                        <span className="text-slate-500">{done.length} done</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 mb-6 bg-dark-700/50 p-1 rounded-xl border border-dark-500 w-fit flex-wrap">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}>
                        {t === 'Requests' && <Package className="w-3.5 h-3.5 inline mr-1" />}
                        {t === 'Services' && <Briefcase className="w-3.5 h-3.5 inline mr-1" />}
                        {t === 'Calendar' && <Calendar className="w-3.5 h-3.5 inline mr-1" />}
                        {t === 'Ratings' && <Star className="w-3.5 h-3.5 inline mr-1" />}
                        {t === 'Profile' && <User className="w-3.5 h-3.5 inline mr-1" />}
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}</div>
            ) : <>

                {/* ── REQUESTS ── */}
                {tab === 'Requests' && (
                    <div className="flex flex-col gap-6">
                        {[
                            { label: '🕐 Pending', items: pending, color: 'yellow' },
                            { label: '⚡ Active', items: active, color: 'cyan' },
                            { label: '📁 History', items: done, color: 'slate' },
                        ].map(section => (
                            <div key={section.label}>
                                <h3 className="font-bold text-slate-300 mb-3">
                                    {section.label}
                                    <span className="ml-2 text-slate-600 font-normal text-sm">({section.items.length})</span>
                                </h3>
                                {section.items.length === 0 ? <p className="text-slate-600 text-sm ml-2">None</p> : (
                                    <div className="flex flex-col gap-3">
                                        {section.items.map((b, i) => (
                                            <div key={b.id} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-white">{b.service?.service_name}</span>
                                                            <BookingStatusBadge status={b.status} />
                                                        </div>
                                                        <p className="text-sm text-slate-400">Client: <span className="text-slate-200">{b.user?.name}</span></p>
                                                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                            <span>📅 {b.booking_date}</span><span>🕐 {b.booking_time}</span>
                                                        </div>
                                                        {b.problem_description && <p className="text-xs text-slate-500 mt-1 italic">"{b.problem_description}"</p>}
                                                    </div>
                                                    <div className="flex gap-2 flex-wrap shrink-0">
                                                        {b.status === 'pending' && <>
                                                            <button onClick={() => updateStatus(b.id, 'accepted')} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" />Accept</button>
                                                            <button onClick={() => updateStatus(b.id, 'rejected')} className="btn-danger text-sm flex items-center gap-1"><X className="w-4 h-4" />Reject</button>
                                                        </>}
                                                        {b.status === 'accepted' && <button onClick={() => updateStatus(b.id, 'ongoing')} className="btn-secondary text-sm flex items-center gap-1"><Clock className="w-4 h-4" />Start Work</button>}
                                                        {b.status === 'ongoing' && <button onClick={() => updateStatus(b.id, 'completed')} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" />Complete</button>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── SERVICES ── */}
                {tab === 'Services' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div><h2 className="section-title">My Services</h2><p className="section-subtitle">{services.length} listed</p></div>
                            <button onClick={() => { setEditSvc(null); setSvcForm({ service_name: '', description: '', min_price: '', category: CATEGORIES[0], image_url: '' }); setSvcModal(true) }}
                                className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Add Service</button>
                        </div>
                        {services.length === 0 ? <EmptyState title="No services yet" subtitle="Add services to start receiving bookings" /> : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {services.map((s, i) => (
                                    <div key={s.id} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-white text-sm">{s.service_name}</h3>
                                            <span className="badge bg-primary-500/20 text-primary-400">{s.category}</span>
                                        </div>
                                        {s.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{s.description}</p>}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gradient font-black">₹{s.min_price}</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => openEditSvc(s)} className="p-1.5 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => askDelete('service', s.id, s.service_name)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── CALENDAR ── */}
                {tab === 'Calendar' && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="section-title">My Calendar</h2>
                                <p className="section-subtitle">Click an event to delete it | Bookings appear automatically</p>
                            </div>
                            <button onClick={() => setEvtModal(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Add Event</button>
                        </div>

                        {/* Legend — above the calendar, top-left */}
                        <div className="flex gap-4 flex-wrap mb-3">
                            {[
                                { color: 'bg-primary-500', label: 'Accepted Booking' },
                                { color: 'bg-cyan-500', label: 'Ongoing Work' },
                                { color: 'bg-red-500', label: 'Holiday' },
                                { color: 'bg-yellow-500', label: 'Reminder' },
                                { color: 'bg-violet-500', label: 'Event' },
                            ].map(l => (
                                <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.color}`} />{l.label}
                                </span>
                            ))}
                        </div>

                        <div className="card p-4 animate-fade-in">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
                                events={events}
                                height="auto"
                                eventClick={(info) => {
                                    const dbId = info.event.extendedProps?.dbId
                                    const type = info.event.extendedProps?.type
                                    const title = info.event.extendedProps?.eventTitle || info.event.title
                                    if (dbId && type !== 'booking') {
                                        askDelete('event', dbId, title)
                                    }
                                }}
                                eventDidMount={(info) => {
                                    // Add tooltip
                                    info.el.title = info.event.title
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ── RATINGS ── */}
                {tab === 'Ratings' && (
                    <div>
                        <h2 className="section-title">My Ratings</h2>
                        <p className="section-subtitle">{reviews.length} total reviews</p>
                        {reviews.length === 0 ? <EmptyState title="No reviews yet" subtitle="Finish jobs and your clients' reviews appear here" /> : (
                            <div className="flex flex-col gap-3 max-w-2xl">
                                {reviews.map((r, i) => (
                                    <div key={r.id} className="card p-4 flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                        <div className="w-9 h-9 rounded-xl bg-dark-600 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                                            {r.user?.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm text-slate-200">{r.user?.name}</span>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? 'text-yellow-400' : 'text-dark-500'}`}>★</span>)}
                                                </div>
                                            </div>
                                            {r.feedback && <p className="text-sm text-slate-400 mt-1 italic">"{r.feedback}"</p>}
                                            <p className="text-[10px] text-slate-600 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── PROFILE ── */}
                {tab === 'Profile' && (
                    <div className="card p-6 max-w-lg animate-fade-in">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-white">My Profile</h2>
                            {editMode
                                ? <button onClick={saveProfile} disabled={savingProfile} className="btn-primary text-sm flex items-center gap-1.5">
                                    {savingProfile ? <LoadingSpinner size="sm" /> : <></>}Save
                                </button>
                                : <button onClick={() => setEditMode(true)} className="btn-secondary text-sm flex items-center gap-1.5"><Edit2 className="w-4 h-4" />Edit</button>
                            }
                        </div>

                        {/* Avatar upload */}
                        <div className="flex items-center gap-4 mb-6">
                            {(editMode ? editForm.avatar_url : profile?.avatar_url)
                                ? <img src={editMode ? editForm.avatar_url : profile.avatar_url} alt="avatar"
                                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/40" />
                                : <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl font-black text-cyan-300">
                                    {profile?.name?.[0]?.toUpperCase()}
                                </div>
                            }
                            {editMode && (
                                <div>
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                    <button type="button" onClick={() => fileRef.current.click()} className="btn-secondary text-xs flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5" /> Upload Photo
                                    </button>
                                    <p className="text-[10px] text-slate-600 mt-1">Max 500KB · JPG, PNG</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            {[{ label: 'Name', key: 'name' }, { label: 'Location', key: 'location' }, { label: 'Mobile', key: 'mobile' }].map(({ label, key }) => (
                                <div key={key}>
                                    <label className="label">{label}</label>
                                    {editMode
                                        ? <input className="input" value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                                        : <p className="text-slate-300 text-sm py-2">{profile?.[key] || <span className="text-slate-500 italic">Not set</span>}</p>
                                    }
                                </div>
                            ))}
                            <div>
                                <label className="label">Bio</label>
                                {editMode
                                    ? <textarea className="input resize-none" rows={3} value={editForm.bio || ''} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />
                                    : <p className="text-slate-300 text-sm py-2">{profile?.bio || <span className="text-slate-500 italic">Not set</span>}</p>
                                }
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <p className="text-slate-400 text-sm py-2">{profile?.email}</p>
                            </div>
                        </div>
                    </div>
                )}
            </>}

            {/* ── Service Modal ── */}
            <Modal open={svcModal} onClose={() => setSvcModal(false)} title={editSvc ? 'Edit Service' : 'Add New Service'}>
                <form onSubmit={saveSvc} className="flex flex-col gap-4">
                    <div><label className="label">Service Name *</label><input className="input" required value={svcForm.service_name} onChange={e => setSvcForm(f => ({ ...f, service_name: e.target.value }))} placeholder="e.g. Pipe Leak Repair" /></div>
                    <div><label className="label">Category *</label>
                        <select className="input" value={svcForm.category} onChange={e => setSvcForm(f => ({ ...f, category: e.target.value }))}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div><label className="label">Minimum Price (₹) *</label><input type="number" className="input" required value={svcForm.min_price} onChange={e => setSvcForm(f => ({ ...f, min_price: e.target.value }))} placeholder="500" /></div>
                    <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={svcForm.description} onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what's included…" /></div>
                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => setSvcModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={savingSvc} className="btn-primary flex-1 flex items-center gap-1.5 justify-center">
                            {savingSvc && <LoadingSpinner size="sm" />}{editSvc ? 'Update' : 'Create'} Service
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Calendar Event Modal ── */}
            <Modal open={evtModal} onClose={() => setEvtModal(false)} title="Add Calendar Event">
                <form onSubmit={saveEvent} className="flex flex-col gap-4">
                    <div><label className="label">Title *</label><input className="input" required value={evtForm.title} onChange={e => setEvtForm(f => ({ ...f, title: e.target.value }))} placeholder="Holiday, Meeting, Reminder…" /></div>
                    <div>
                        <label className="label">Event Type</label>
                        <select className="input" value={evtForm.event_type} onChange={e => {
                            const t = e.target.value
                            setEvtForm(f => ({ ...f, event_type: t, color: eventTypeColors[t] || '#6366f1' }))
                        }}>
                            <option value="event">📅 Custom Event</option>
                            <option value="holiday">🏖️ Holiday / Day Off</option>
                            <option value="reminder">🔔 Reminder</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="label">Start *</label><input type="datetime-local" className="input" required value={evtForm.start_datetime} onChange={e => setEvtForm(f => ({ ...f, start_datetime: e.target.value }))} /></div>
                        <div><label className="label">End</label><input type="datetime-local" className="input" value={evtForm.end_datetime} onChange={e => setEvtForm(f => ({ ...f, end_datetime: e.target.value }))} /></div>
                    </div>
                    {/* Reminder option */}
                    <div>
                        <label className="label flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Remind me before</label>
                        <select className="input" value={evtForm.reminder_minutes} onChange={e => setEvtForm(f => ({ ...f, reminder_minutes: e.target.value }))}>
                            <option value="">No reminder</option>
                            <option value="10">10 minutes before</option>
                            <option value="30">30 minutes before</option>
                            <option value="60">1 hour before</option>
                            <option value="120">2 hours before</option>
                            <option value="1440">1 day before</option>
                        </select>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => setEvtModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1">Add Event</button>
                    </div>
                </form>
            </Modal>

            {/* ── Confirm Delete Dialog ── */}
            <ConfirmDeleteDialog
                open={!!deleteTarget}
                title={`Delete ${deleteTarget?.type === 'service' ? 'Service' : 'Event'}`}
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    )
}
