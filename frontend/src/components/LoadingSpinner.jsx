import { Loader2 } from 'lucide-react'

/* ──────────────────────────────────────────────────────────────
   Reusable loading primitives used app-wide
   ────────────────────────────────────────────────────────────── */

/** Inline spinner — drops into any flex row */
export function LoadingSpinner({ size = 'md', className = '' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
    return (
        <Loader2
            className={`animate-spin text-primary-400 ${sizes[size]} ${className}`}
        />
    )
}

/** Full-page loading screen — used by Suspense fallback */
export function PageLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
            <div className="relative">
                {/* Outer glow ring */}
                <div className="w-16 h-16 rounded-full border-2 border-primary-500/20 animate-ping absolute inset-0" />
                <div className="w-16 h-16 rounded-full border-2 border-t-primary-500 border-r-primary-500/40 border-b-transparent border-l-transparent animate-spin" />
                <div className="w-10 h-10 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-cyan-400/40 animate-spin animation-reverse absolute top-3 left-3" />
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">Loading…</p>
        </div>
    )
}

/** Skeleton shimmer block */
export function Skeleton({ className = '' }) {
    return (
        <div className={`bg-gradient-to-r from-dark-600 via-dark-500 to-dark-600 bg-[length:200%_100%] animate-shimmer rounded-lg ${className}`} />
    )
}

/** Card skeleton — 3 lines of shimmer */
export function CardSkeleton() {
    return (
        <div className="card p-5 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between items-center pt-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
        </div>
    )
}
