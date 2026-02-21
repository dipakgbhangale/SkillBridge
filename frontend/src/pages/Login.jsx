import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await authAPI.login(form)
            login(data)
            toast.success(`Welcome back, ${data.name}!`)
            navigate(data.role === 'provider' ? '/dashboard/provider' : '/dashboard/user')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white">Welcome back</h1>
                    <p className="text-slate-400 mt-1">Sign in to your SkillBridge account</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="label">Email Address</label>
                            <input type="email" className="input" placeholder="you@example.com" required
                                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" required
                                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</> : 'Sign In'}
                        </button>
                    </form>
                    <p className="text-center text-slate-400 text-sm mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
