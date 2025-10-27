import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const gradientColor = type === 'success' 
    ? 'from-green-400 to-green-600' 
    : type === 'error' 
    ? 'from-red-400 to-red-600' 
    : 'from-blue-400 to-blue-600'
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'

  return (
    <div className="fixed top-8 right-8 z-50 animate-slideUp">
      <div className={`relative backdrop-blur-2xl bg-white/10 border border-white/30 text-white px-8 py-5 rounded-2xl shadow-premium flex items-center gap-4 min-w-[350px] overflow-hidden group`}>
        <div className={`absolute inset-0 bg-linear-to-r ${gradientColor} opacity-20 group-hover:opacity-30 transition-opacity`} />
        <div className="relative flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl">
          <span className="text-2xl font-bold">{icon}</span>
        </div>
        <p className="relative flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="relative text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 font-bold text-xl transition-all hover:scale-110">
          ×
        </button>
      </div>
    </div>
  )
}
