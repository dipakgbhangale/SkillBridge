import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { servicesAPI } from '../api'
import { ServiceCard, ProviderInfoModal, PhotoZoomModal } from '../components/ui'
import { CardSkeleton } from '../components/LoadingSpinner'
import { Search as SearchIcon } from 'lucide-react'

const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'AC Service', 'Pest Control', 'Appliance Repair']

export default function Search() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [category, setCategory] = useState(searchParams.get('category') || 'All')
    const [location, setLocation] = useState('')

    // Two modal states
    const [infoProvider, setInfoProvider] = useState(null)  // card click → info popup
    const [zoomProvider, setZoomProvider] = useState(null)  // avatar click → photo zoom

    useEffect(() => { fetchServices() }, [category])

    async function fetchServices() {
        setLoading(true)
        try {
            const params = {}
            if (query) params.search = query
            if (category && category !== 'All') params.category = category
            if (location) params.location = location
            const { data } = await servicesAPI.list(params)
            setServices(data)
        } catch { setServices([]) }
        finally { setLoading(false) }
    }

    function handleSearch(e) { e.preventDefault(); fetchServices() }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="section-title text-2xl">Find Services</h1>
                <p className="section-subtitle">Browse {services.length} services available near you</p>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input className="input pl-10" placeholder="Search services or providers…"
                            value={query} onChange={e => setQuery(e.target.value)} />
                    </div>
                    <input className="input w-40 hidden sm:block" placeholder="Location"
                        value={location} onChange={e => setLocation(e.target.value)} />
                    <button type="submit" className="btn-primary flex items-center gap-2">
                        <SearchIcon className="w-4 h-4" /> Search
                    </button>
                </form>

                {/* Category filters */}
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                ${category === cat
                                    ? 'bg-primary-600 text-white border-primary-500 shadow-glow'
                                    : 'bg-dark-700 text-slate-400 border-dark-500 hover:border-primary-500/40 hover:text-slate-200'
                                }`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-20">
                    <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-semibold mb-1">No services found</h3>
                    <p className="text-slate-500 text-sm">Try a different search or category</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {services.map((service, i) => (
                        <div key={service.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                            <ServiceCard
                                service={service}
                                onCardClick={prov => setInfoProvider(prov)}
                                onAvatarClick={prov => setZoomProvider(prov)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Provider Info Modal — card click */}
            <ProviderInfoModal
                provider={infoProvider}
                open={!!infoProvider}
                onClose={() => setInfoProvider(null)}
            />

            {/* Photo Zoom Modal — avatar click */}
            <PhotoZoomModal
                provider={zoomProvider}
                open={!!zoomProvider}
                onClose={() => setZoomProvider(null)}
            />
        </div>
    )
}
