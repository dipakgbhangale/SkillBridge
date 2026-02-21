import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { statsAPI } from '../api'
import { Zap, Search, Star, Shield, Clock, MapPin, ArrowRight, CheckCircle, Users, Briefcase } from 'lucide-react'

const CATEGORIES = [
    { name: 'Plumbing', icon: '🔧', color: 'from-blue-600 to-blue-700' },
    { name: 'Electrical', icon: '⚡', color: 'from-yellow-600 to-amber-700' },
    { name: 'Cleaning', icon: '✨', color: 'from-emerald-600 to-emerald-700' },
    { name: 'Carpentry', icon: '🪵', color: 'from-orange-600 to-orange-700' },
    { name: 'Painting', icon: '🎨', color: 'from-pink-500 to-rose-600' },
    { name: 'AC Service', icon: '❄️', color: 'from-cyan-600 to-cyan-700' },
    { name: 'Pest Control', icon: '🛡️', color: 'from-red-600 to-red-700' },
    { name: 'Appliance', icon: '🏠', color: 'from-violet-600 to-purple-700' },
]

const STEPS = [
    { step: '01', title: 'Browse Services', desc: 'Search from hundreds of verified local providers by category or location.' },
    { step: '02', title: 'Book Instantly', desc: 'Choose your preferred time, describe the issue, and confirm in seconds.' },
    { step: '03', title: 'Track Progress', desc: 'Get real-time status updates from pending to job completion.' },
    { step: '04', title: 'Rate & Review', desc: 'Leave honest feedback to help the community and reward great providers.' },
]

const FEATURES = [
    { icon: <Shield className="w-6 h-6" />, title: 'Verified Providers', desc: 'Every service provider on SkillBridge is background-checked and verified before listing.' },
    { icon: <Clock className="w-6 h-6" />, title: 'Real-time Booking', desc: 'Instant booking with live availability — pick the exact date and time that suits you.' },
    { icon: <Star className="w-6 h-6" />, title: 'Transparent Ratings', desc: 'Honest reviews from real customers so you always know who you are hiring.' },
    { icon: <MapPin className="w-6 h-6" />, title: 'Local First', desc: 'Discover skilled professionals right in your neighbourhood, not hundreds of miles away.' },
]

// Animated counter hook
function useCount(target, duration = 1800) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        if (!target) return
        let start = 0
        const step = target / (duration / 16)
        const timer = setInterval(() => {
            start = Math.min(start + step, target)
            setValue(Math.floor(start))
            if (start >= target) clearInterval(timer)
        }, 16)
        return () => clearInterval(timer)
    }, [target, duration])
    return value
}

function StatCard({ value, label, suffix = '+', prefix = '' }) {
    const count = useCount(value)
    return (
        <div className="stat-card animate-scale-in">
            <div className="text-4xl font-black text-gradient mb-1">
                {prefix}{count.toLocaleString()}{suffix}
            </div>
            <div className="text-slate-400 text-sm font-medium">{label}</div>
        </div>
    )
}

export default function Landing() {
    const [stats, setStats] = useState({ total_services: 0, total_providers: 0, avg_rating: 0 })
    const [statsLoaded, setStatsLoaded] = useState(false)
    const [searchQ, setSearchQ] = useState('')

    useEffect(() => {
        statsAPI.get().then(r => {
            setStats(r.data)
            setStatsLoaded(true)
        }).catch(() => setStatsLoaded(true))
    }, [])

    return (
        <div className="overflow-x-hidden">

            {/* ── Hero ─────────────────────────────────────── */}
            <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-4 py-20">
                {/* Background blobs */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/12 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-3xl" />
                </div>

                <div className="animate-slide-up">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-400 text-xs font-semibold mb-6 tracking-wider uppercase">
                        <Zap className="w-3 h-3" /> Your Local Skill Marketplace
                    </span>
                    <h1 className="text-5xl sm:text-7xl font-black text-white leading-tight mb-4 max-w-3xl mx-auto">
                        Find Skilled Experts<br />
                        <span className="text-gradient">Near You, Instantly.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
                        Connect with background-verified service professionals for plumbing, electrical, cleaning, and more.
                    </p>

                    {/* Search bar */}
                    <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input className="input pl-12 py-3.5 text-base" placeholder="Search a service…"
                                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && window.location.assign(`/search?q=${searchQ}`)} />
                        </div>
                        <Link to={`/search${searchQ ? `?q=${searchQ}` : ''}`} className="btn-primary py-3.5 px-8 text-base flex items-center gap-2 justify-center">
                            Search <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                        {['Plumbing', 'Electrical', 'Cleaning', 'AC Service'].map(c => (
                            <Link key={c} to={`/search?category=${c}`}
                                className="px-3 py-1.5 rounded-full bg-dark-700/80 border border-dark-500 text-slate-400 text-xs font-medium hover:border-primary-500/40 hover:text-white transition-all">
                                {c}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats ────────────────────────────────────── */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {statsLoaded ? (
                        <>
                            <StatCard value={stats.total_services} label="Services Listed" />
                            <StatCard value={stats.total_providers} label="Verified Providers" />
                            <StatCard value={parseFloat(stats.avg_rating) || 0} label="Avg Rating" suffix="★" />
                        </>
                    ) : (
                        [1, 2, 3].map(i => <div key={i} className="stat-card h-24 animate-shimmer" />)
                    )}
                </div>
            </section>

            {/* ── Categories ───────────────────────────────── */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="section-title text-center text-2xl">Browse by Category</h2>
                    <p className="section-subtitle text-center text-base mb-10">Find exactly what you need from our wide range of services</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {CATEGORIES.map((cat, i) => (
                            <Link key={cat.name} to={`/search?category=${cat.name}`}
                                className={`card-hover p-5 flex flex-col items-center gap-3 cursor-pointer animate-fade-in`}
                                style={{ animationDelay: `${i * 0.06}s` }}>
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-lg`}>
                                    {cat.icon}
                                </div>
                                <span className="text-sm font-semibold text-slate-200">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ─────────────────────────────── */}
            <section className="py-16 px-4 bg-dark-800/30">
                <div className="max-w-5xl mx-auto">
                    <h2 className="section-title text-center text-2xl">How It Works</h2>
                    <p className="section-subtitle text-center text-base mb-12">Get the service you need in four simple steps</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STEPS.map((s, i) => (
                            <div key={s.step} className="relative card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="text-4xl font-black text-gradient opacity-30 mb-3">{s.step}</div>
                                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                                {i < STEPS.length - 1 && (
                                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500/40" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────── */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="section-title text-center text-2xl">Why SkillBridge?</h2>
                    <p className="section-subtitle text-center text-base mb-10">Built for trust, speed, and quality</p>
                    <div className="grid sm:grid-cols-2 gap-5">
                        {FEATURES.map((f, i) => (
                            <div key={f.title} className="card p-5 flex gap-4 items-start animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="w-12 h-12 rounded-xl bg-primary-500/15 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
                                    {f.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">{f.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────── */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="card p-10 relative overflow-hidden animate-glow-pulse">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-cyan-500/10 -z-0" />
                        <div className="relative z-10">
                            <Zap className="w-10 h-10 text-primary-400 mx-auto mb-4 animate-float" />
                            <h2 className="text-3xl font-black text-white mb-3">Ready to get started?</h2>
                            <p className="text-slate-400 mb-8">Join thousands of satisfied customers and trusted service providers.</p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <Link to="/register" className="btn-primary py-3 px-8 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Find a Service
                                </Link>
                                <Link to="/register" className="btn-secondary py-3 px-8 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Become a Provider
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
