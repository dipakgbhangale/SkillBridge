import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usersAPI, servicesAPI, reviewsAPI, bookingsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { usePhotoZoom } from '../context/PhotoZoomContext'
import { ServiceCard, StarRating, Modal } from '../components/ui'
import toast from 'react-hot-toast'
import { MapPin, Phone, ChevronLeft, ChevronRight, Calendar, Clock, Briefcase, ChevronDown, X } from 'lucide-react'

/* ══════════════════════════════════════════════════
   Custom Calendar Date Picker Popup
══════════════════════════════════════════════════ */
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function CalendarDatePicker({ value, minDate, onChange, onClose }) {
    const today = new Date()
    const initDate = value ? new Date(value + 'T00:00:00') : today
    const [viewYear, setViewYear] = useState(initDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(initDate.getMonth())

    const selectedStr = value  // "YYYY-MM-DD"
    const minStr = minDate

    function toStr(y, m, d) {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }
    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    // Build grid: 6 rows × 7 cols
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()  // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)

    function selectDay(d) {
        if (!d) return
        const str = toStr(viewYear, viewMonth, d)
        if (minStr && str < minStr) return
        onChange(str)
        onClose()
    }

    return (
        <div className="w-72 card p-4 animate-scale-in shadow-2xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-600 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-white text-sm">
                    {MONTHS[viewMonth]} {viewYear}
                </span>
                <button type="button" onClick={nextMonth}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-600 transition-all">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-primary-400/80 py-1 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((d, i) => {
                    if (!d) return <div key={i} />
                    const str = toStr(viewYear, viewMonth, d)
                    const isToday = str === toStr(today.getFullYear(), today.getMonth(), today.getDate())
                    const isSelect = str === selectedStr
                    const isPast = minStr && str < minStr
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={isPast}
                            onClick={() => selectDay(d)}
                            className={`
                h-8 w-full rounded-lg text-xs font-semibold transition-all duration-150
                ${isPast ? 'text-dark-500 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelect ? 'bg-primary-500 text-white shadow-glow scale-105' : ''}
                ${isToday && !isSelect ? 'text-primary-400 bg-primary-500/15 ring-1 ring-primary-500/40' : ''}
                ${!isSelect && !isToday && !isPast ? 'text-slate-300 hover:bg-dark-600 hover:text-white' : ''}
              `}
                        >
                            {d}
                        </button>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="border-t border-dark-500 mt-3 pt-3 flex justify-between items-center">
                <button type="button" onClick={() => { onChange(''); onClose() }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    Clear
                </button>
                <button type="button" onClick={() => {
                    const str = toStr(today.getFullYear(), today.getMonth(), today.getDate())
                    if (!minStr || str >= minStr) { onChange(str); onClose() }
                }} className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                    Today
                </button>
            </div>
        </div>
    )
}

/* ── Date picker trigger field ── */
function DatePickerField({ value, minDate, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef()

    // Close on outside click
    useEffect(() => {
        function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        if (open) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    function formatDisplay(v) {
        if (!v) return ''
        const [y, m, d] = v.split('-')
        return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`
    }

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`input w-full flex items-center gap-2 text-left ${!value ? 'text-slate-500' : 'text-slate-100'}`}
            >
                <Calendar className="w-4 h-4 text-primary-400 shrink-0" />
                <span className="flex-1">{value ? formatDisplay(value) : 'Select date…'}</span>
                {value && (
                    <span onClick={e => { e.stopPropagation(); onChange('') }}
                        className="text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 z-50">
                    <CalendarDatePicker
                        value={value}
                        minDate={minDate}
                        onChange={onChange}
                        onClose={() => setOpen(false)}
                    />
                </div>
            )}
        </div>
    )
}

/* ══════════════════════════════════════════════════
   12hr AM/PM Time Picker
══════════════════════════════════════════════════ */
function TimePicker12hr({ value, onChange }) {
    function parseValue(v) {
        if (!v) return { hour: '09', minute: '00', period: 'AM' }
        const [h, m] = v.split(':').map(Number)
        const period = h >= 12 ? 'PM' : 'AM'
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
        return { hour: String(hour12).padStart(2, '0'), minute: String(m).padStart(2, '0'), period }
    }
    function toISO(hour, minute, period) {
        let h = Number(hour)
        if (period === 'AM' && h === 12) h = 0
        if (period === 'PM' && h !== 12) h += 12
        return `${String(h).padStart(2, '0')}:${minute}`
    }
    const { hour, minute, period } = parseValue(value)
    function update(field, val) {
        const next = { hour, minute, period, [field]: val }
        onChange(toISO(next.hour, next.minute, next.period))
    }

    const selectBase = `
    appearance-none bg-dark-700 border border-dark-400 rounded-xl text-slate-100 text-sm font-semibold
    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none cursor-pointer
    transition-all duration-200 hover:border-dark-300 pr-8 pl-4 py-2.5
  `

    return (
        <div className="flex gap-2 items-center">
            <div className="relative flex-1">
                <select value={hour} onChange={e => update('hour', e.target.value)} className={selectBase}>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h}>{h}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-primary-400 font-black text-lg">:</span>
            <div className="relative flex-1">
                <select value={minute} onChange={e => update('minute', e.target.value)} className={selectBase}>
                    {['00', '15', '30', '45'].map(m => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="relative">
                <select value={period} onChange={e => update('period', e.target.value)}
                    className={`${selectBase} font-black text-primary-300 bg-primary-900/40 border-primary-500/40`}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-400" />
            </div>
        </div>
    )
}

function formatDisplay12(time24) {
    if (!time24) return ''
    const [h, m] = time24.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/* ══════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════ */
export default function ProviderProfile() {
    const { id } = useParams()
    const { user, isAuth } = useAuth()
    const navigate = useNavigate()
    const { openPhotoZoom } = usePhotoZoom()
    const [provider, setProvider] = useState(null)
    const [services, setServices] = useState([])
    const [reviews, setReviews] = useState([])
    const [avgRating, setAvgRating] = useState({ avg_rating: 0, total_reviews: 0 })
    const [loading, setLoading] = useState(true)
    const [bookingModal, setBookingModal] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const [bookForm, setBookForm] = useState({ booking_date: '', booking_time: '09:00', problem_description: '' })
    const [booking, setBooking] = useState(false)

    useEffect(() => { fetchAll() }, [id])

    async function fetchAll() {
        setLoading(true)
        try {
            const [pRes, sRes, rRes, aRes] = await Promise.all([
                usersAPI.getById(id),
                servicesAPI.byProvider(id),
                reviewsAPI.byProvider(id),
                reviewsAPI.avgRating(id),
            ])
            setProvider(pRes.data); setServices(sRes.data)
            setReviews(rRes.data); setAvgRating(aRes.data)
        } catch { toast.error('Failed to load provider') }
        finally { setLoading(false) }
    }

    function openBooking(service) {
        if (!isAuth) { navigate('/login'); return }
        if (user?.role !== 'user') { toast.error('Only users can book services'); return }
        setSelectedService(service)
        setBookingModal(true)
    }

    async function submitBooking(e) {
        e.preventDefault()
        if (!bookForm.booking_date) { toast.error('Please select a date'); return }
        if (!bookForm.booking_time) { toast.error('Please select a time'); return }
        setBooking(true)
        try {
            await bookingsAPI.create({ service_id: selectedService.id, provider_id: Number(id), ...bookForm })
            toast.success('Booking request sent!')
            setBookingModal(false)
            setBookForm({ booking_date: '', booking_time: '09:00', problem_description: '' })
        } catch (err) { toast.error(err.response?.data?.detail || 'Booking failed') }
        finally { setBooking(false) }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )
    if (!provider) return <div className="text-center py-20 text-slate-400">Provider not found</div>

    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
            {/* Profile Header */}
            <div className="card p-8 mb-6 flex flex-col sm:flex-row gap-6 items-start">
                {/* Clickable avatar — opens photo zoom */}
                <button
                    type="button"
                    onClick={() => openPhotoZoom(provider.avatar_url, provider.name)}
                    className="w-20 h-20 rounded-2xl bg-primary-600/30 border border-primary-500/40 overflow-hidden shrink-0 hover:border-primary-400 hover:shadow-glow transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    title="View profile photo"
                >
                    {provider.avatar_url
                        ? <img src={provider.avatar_url} alt={provider.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-primary-300 group-hover:scale-110 transition-transform">
                            {provider.name?.[0]?.toUpperCase()}
                        </div>
                    }
                </button>
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-white">{provider.name}</h1>
                            {provider.location && <p className="text-slate-400 text-sm flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {provider.location}</p>}
                            {provider.mobile && <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5"><Phone className="w-4 h-4" /> {provider.mobile}</p>}
                        </div>
                        <div className="text-center bg-dark-600 rounded-2xl px-6 py-3 border border-dark-500">
                            <div className="text-3xl font-black text-yellow-400">{avgRating.avg_rating || '—'}</div>
                            <div className="flex items-center justify-center gap-0.5 my-1">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className={`text-sm ${s <= Math.round(avgRating.avg_rating) ? 'text-yellow-400' : 'text-dark-500'}`}>★</span>)}
                            </div>
                            <div className="text-xs text-slate-500">{avgRating.total_reviews} reviews</div>
                        </div>
                    </div>
                    {provider.bio && <p className="text-slate-300 mt-4 leading-relaxed">{provider.bio}</p>}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Services */}
                <div className="lg:col-span-2">
                    <h2 className="section-title">Services Offered</h2>
                    <p className="section-subtitle">{services.length} service{services.length !== 1 ? 's' : ''} available</p>
                    {services.length === 0
                        ? <p className="text-slate-500 text-sm">No services listed yet</p>
                        : <div className="grid sm:grid-cols-2 gap-4">
                            {services.map(s => (
                                <ServiceCard key={s.id} service={{ ...s, provider }} onClick={() => openBooking(s)} />
                            ))}
                        </div>
                    }
                </div>

                {/* Reviews */}
                <div>
                    <h2 className="section-title">Reviews</h2>
                    <p className="section-subtitle">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                        {reviews.length === 0
                            ? <p className="text-slate-500 text-sm">No reviews yet</p>
                            : reviews.map(r => (
                                <div key={r.id} className="card p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm text-slate-200">{r.user?.name || 'User'}</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? 'text-yellow-400' : 'text-dark-500'}`}>★</span>)}
                                        </div>
                                    </div>
                                    {r.feedback && <p className="text-sm text-slate-400">{r.feedback}</p>}
                                    <p className="text-[10px] text-slate-600 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* ── Booking Modal ── */}
            <Modal open={bookingModal} onClose={() => setBookingModal(false)}
                title={`Book: ${selectedService?.service_name}`}>
                <form onSubmit={submitBooking} className="flex flex-col gap-5">
                    {/* Price banner */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-primary-900/60 to-dark-700 rounded-xl p-3.5 border border-primary-500/20">
                        <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Starting from</p>
                            <p className="text-gradient font-black text-lg">₹{selectedService?.min_price}</p>
                        </div>
                    </div>

                    {/* Date picker — custom calendar popup */}
                    <div>
                        <label className="label flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-400" /> Appointment Date *
                        </label>
                        <DatePickerField
                            value={bookForm.booking_date}
                            minDate={today}
                            onChange={v => setBookForm(f => ({ ...f, booking_date: v }))}
                        />
                    </div>

                    {/* Time — 12hr AM/PM */}
                    <div>
                        <label className="label flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary-400" /> Appointment Time *
                        </label>
                        <TimePicker12hr
                            value={bookForm.booking_time}
                            onChange={v => setBookForm(f => ({ ...f, booking_time: v }))}
                        />
                        {bookForm.booking_time && (
                            <p className="text-xs text-primary-400/70 mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDisplay12(bookForm.booking_time)}
                            </p>
                        )}
                    </div>

                    {/* Problem */}
                    <div>
                        <label className="label flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Describe Your Problem
                        </label>
                        <textarea className="input resize-none" rows={3} placeholder="Describe the issue in detail…"
                            value={bookForm.problem_description}
                            onChange={e => setBookForm(f => ({ ...f, problem_description: e.target.value }))} />
                    </div>

                    <div className="flex gap-3 mt-1">
                        <button type="button" onClick={() => setBookingModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={booking} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {booking
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                                : 'Send Request'
                            }
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
