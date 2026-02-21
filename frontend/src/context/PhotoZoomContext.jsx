import { createContext, useContext, useState, useCallback } from 'react'
import { X } from 'lucide-react'

const PhotoZoomContext = createContext(null)

/* ── Global photo zoom modal — rendered once at the app root ── */
export function PhotoZoomProvider({ children }) {
    const [photo, setPhoto] = useState(null)   // { url, name }

    const openPhotoZoom = useCallback((url, name) => {
        setPhoto({ url: url || null, name: name || '' })
    }, [])

    const close = useCallback(() => setPhoto(null), [])

    return (
        <PhotoZoomContext.Provider value={{ openPhotoZoom }}>
            {children}

            {photo && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fade-in"
                    onClick={close}
                >
                    <div className="relative animate-scale-in" onClick={e => e.stopPropagation()}>
                        {/* Close */}
                        <button
                            onClick={close}
                            className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-dark-700 border border-dark-400 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Photo or initial block */}
                        {photo.url ? (
                            <img
                                src={photo.url}
                                alt={photo.name}
                                className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl object-cover border-2 border-primary-500/40 shadow-2xl shadow-primary-500/20"
                            />
                        ) : (
                            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-br from-primary-800/70 to-primary-950/90 border-2 border-primary-500/40 flex items-center justify-center shadow-2xl">
                                <span className="text-[100px] leading-none font-black text-primary-200 select-none">
                                    {photo.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                        )}

                        {photo.name && (
                            <p className="text-center text-slate-300 font-semibold mt-3 text-sm tracking-wide">
                                {photo.name}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </PhotoZoomContext.Provider>
    )
}

/* ── Hook to use anywhere ── */
export function usePhotoZoom() {
    return useContext(PhotoZoomContext)
}
