import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { Zap, User, Wrench } from 'lucide-react'

export default function Register() {
    const [searchParams] = useSearchParams()
    const [role, setRole] = useState(searchParams.get('role') || 'user')
    const [form, setForm] = useState({ name: '', email: '', password: '', age: '', location: '', bio: '', mobile: '' })
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        try {
            await authAPI.register({ ...form, role, age: form.age ? Number(form.age) : undefined })
            const { data } = await authAPI.login({ email: form.email, password: form.password })
            login(data)
            toast.success(`Account created! Welcome, ${data.name}!`)
            navigate(data.role === 'provider' ? '/dashboard/provider' : '/dashboard/user')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white">Create Account</h1>
                    <p className="text-slate-400 mt-1">Join SkillBridge today</p>
                </div>

                {/* Role Toggle */}
                <div className="flex gap-3 mb-6 bg-dark-700 p-1 rounded-xl border border-dark-500">
                    {[
                        { value: 'user', icon: User, label: 'I need services' },
                        { value: 'provider', icon: Wrench, label: 'I provide services' },
                    ].map(r => (
                        <button key={r.value} type="button" onClick={() => setRole(r.value)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${role === r.value ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'}`}>
                            <r.icon className="w-4 h-4" /> {r.label}
                        </button>
                    ))}
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="label">Full Name *</label>
                                <input className="input" placeholder="John Doe" required value={form.name} onChange={set('name')} />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Email *</label>
                                <input type="email" className="input" placeholder="you@example.com" required value={form.email} onChange={set('email')} />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Password *</label>
                                <input type="password" className="input" placeholder="Min. 6 characters" required minLength={6} value={form.password} onChange={set('password')} />
                            </div>
                            <div>
                                <label className="label">Age</label>
                                <input type="number" className="input" placeholder="25" min="18" max="100" value={form.age} onChange={set('age')} />
                            </div>
                            <div>
                                <label className="label">Mobile</label>
                                <input className="input" placeholder="+91 9876543210" value={form.mobile} onChange={set('mobile')} />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Location</label>
                                <input className="input" placeholder="City, State" value={form.location} onChange={set('location')} />
                            </div>
                            {role === 'provider' && (
                                <div className="col-span-2">
                                    <label className="label">Bio</label>
                                    <textarea className="input resize-none" rows={3} placeholder="Tell clients about your expertise…"
                                        value={form.bio} onChange={set('bio')} />
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
                                : `Register as ${role === 'provider' ? 'Provider' : 'User'}`
                            }
                        </button>
                    </form>
                    <p className="text-center text-slate-400 text-sm mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
