import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4">
            <div className="text-8xl font-black text-gradient mb-4">404</div>
            <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
            <p className="text-slate-400 mb-8">The page you're looking for doesn't exist or was moved.</p>
            <Link to="/" className="btn-primary flex items-center gap-2"><Zap className="w-4 h-4" />Back to Home</Link>
        </div>
    )
}
