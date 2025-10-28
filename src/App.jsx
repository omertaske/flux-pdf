import { useState, useEffect } from 'react'
import './App.css'
import { FileConverter } from './components/FileConverter/FileConverter'
import { DrawingBoard } from './components/DrawingBoard/DrawingBoard'

function App() {
  const [activeTab, setActiveTab] = useState('toPdf')


  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div>
      

      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary-500 via-accent-500 to-primary-700 animate-gradientShift bg-size-[400%_400%]" />
          
          {/* Floating Blobs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent-400/30 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-accent-300/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-glass">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-premium rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-75" />
                  <div className="relative h-22 w-22 flex items-center justify-center text-4xl animate-float">
                    <img src="./fluxlogoo.png" alt="flux"  className='h-12 w-12 object-contain border-2 border-white rounded-full ' />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-linear-to-r from-white to-white/80 bg-clip-text text-transparent">
                     FluxPDF — Ücretsiz PDF ve Dosya Dönüştürücü
                  </h1>
                  <p className="text-xs text-white/60">PDF to Word, Word to PDF, JPG/PNG to PDF ve daha fazlası</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {/* SEO Intro */}
          <section className="mx-auto max-w-5xl text-center mb-10">
            <p className="text-white/80 text-base md:text-lg">
              Her dosya türünü saniyeler içinde dönüştürün: PDF to Word, Word to PDF, JPG/PNG to PDF,
              PDF to JPG/PNG/TXT/HTML. Ücretsiz, hızlı ve güvenli. Toplu dönüştürme ve PDF birleştirme destekli.
            </p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm text-white/90">
              {[
                { label: 'PDF to Word', href: '/pdf-to-word.html' },
                { label: 'Word to PDF', href: '/word-to-pdf.html' },
                { label: 'JPG to PDF', href: '/jpg-to-pdf.html' },
                { label: 'PNG to PDF', href: '/png-to-pdf.html' },
                { label: 'PDF to JPG', href: '/pdf-to-jpg.html' },
                { label: 'PDF to PNG', href: '/pdf-to-png.html' },
                { label: 'PDF to Text', href: '/pdf-to-text.html' },
                { label: 'Excel to PDF', href: '/excel-to-pdf.html' },
                { label: 'PowerPoint to PDF', href: '/powerpoint-to-pdf.html' },
                { label: 'HTML to PDF', href: '/html-to-pdf.html' },
                { label: 'PDF Birleştir', href: '/' },
                { label: 'PDF Sıkıştır (yakında)', href: '/' }
              ].map(({ label, href }) => (
                <a key={label} href={href} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-colors">
                  <span aria-hidden>🔹</span> <span className="ml-1">{label}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Reklam Birimi: fluxreklam1 (auto) */}
          <div className="mx-auto max-w-5xl mb-10">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', margin: '16px 0' }}
              data-ad-client="ca-pub-3904218274935641"
              data-ad-slot="6735775257"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            <script dangerouslySetInnerHTML={{ __html: `globalThis.adsbygoogle = globalThis.adsbygoogle || []; globalThis.adsbygoogle.push({});` }} />
          </div>
          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab('toPdf')}
              className={`group relative px-8 py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden cursor-pointer ${
                activeTab === 'toPdf' 
                  ? 'bg-white/30 shadow-glow scale-110' 
                  : 'bg-white/10 hover:bg-white/20 hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-shine" />
              <span className="relative text-white">📄 PDF'e Dönüştür</span>
            </button>
            <button
              onClick={() => setActiveTab('fromPdf')}
              className={`group relative px-8 py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden cursor-pointer ${
                activeTab === 'fromPdf' 
                  ? 'bg-white/30 shadow-glow scale-110' 
                  : 'bg-white/10 hover:bg-white/20 hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-shine" />
              <span className="relative text-white">📑 PDF'ten Dönüştür</span>
            </button>
            <button
              onClick={() => setActiveTab('drawing')}
              className={`group relative px-8 py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden cursor-pointer ${
                activeTab === 'drawing' 
                  ? 'bg-white/30 shadow-glow scale-110' 
                  : 'bg-white/10 hover:bg-white/20 hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-shine" />
              <span className="relative text-white">✏️ Çizim</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="relative backdrop-blur-2xl bg-white/10 rounded-3xl shadow-premium border border-white/20 p-10 animate-slideUp">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent rounded-3xl" />
            <div className="relative z-10">
              {activeTab === 'toPdf' && <FileConverter mode="toPdf" />}
              {activeTab === 'fromPdf' && <FileConverter mode="fromPdf" />}
              {activeTab === 'drawing' && <DrawingBoard />}
            </div>
          </div>

          {/* Reklam Birimi: autorelaxed */}
          <div className="mx-auto max-w-5xl mt-10">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', margin: '16px 0' }}
              data-ad-client="ca-pub-3904218274935641"
              data-ad-slot="4975615809"
              data-ad-format="autorelaxed"
            />
            <script dangerouslySetInnerHTML={{ __html: `globalThis.adsbygoogle = globalThis.adsbygoogle || []; globalThis.adsbygoogle.push({});` }} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
