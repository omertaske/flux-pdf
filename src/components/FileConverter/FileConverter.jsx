import { useState, useRef, useEffect } from 'react'
import FilePreview from '../Common/FilePreview'
import FilePreviewModal from '../Common/FilePreviewModal'
import Toast from '../Common/Toast'
import { convertToPdf, convertFromPdf, mergePdfs } from '../../utils/fileConversion'
import { validateFile } from '../../utils/fileValidation'

export function FileConverter({ mode }) {
  const [files, setFiles] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState(null)
  const [outputFormat, setOutputFormat] = useState('text')
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const fileListRef = useRef(null)
  
  // PDF seçenekleri - select ile uyumlu default
  const [pdfOptions, setPdfOptions] = useState({
    pageSize: 'a4',
    orientation: 'portrait',
    quality: 'high'
  })

  const handleFileSelect = async (e) => {
    const newFiles = Array.from(e.target.files)
    if (newFiles.length === 0) return

    // Dosya validasyonu
    const validatedFiles = []
    const errors = []

    for (const file of newFiles) {
      const validation = validateFile(file, mode)
      if (validation.valid) {
        validatedFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    }

    // Hataları göster
    if (errors.length > 0) {
      setToast({ 
        type: 'error', 
        message: `${errors.length} dosya reddedildi:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}` 
      })
    }

    if (validatedFiles.length === 0) return

    const fileData = await Promise.all(
      validatedFiles.map(async (file) => {
        const reader = new FileReader()
        const content = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result)
          if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file)
          } else {
            reader.readAsText(file)
          }
        })
        
        return {
          file,
          preview: {
            name: file.name,
            type: file.type,
            size: file.size,
            content
          }
        }
      })
    )
    
    setFiles(prev => [...prev, ...fileData])
    setToast({ type: 'success', message: `${newFiles.length} dosya yüklendi!` })
    
    // Dosya listesine smooth scroll
    setTimeout(() => {
      if (fileListRef.current) {
        fileListRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileSelect({ target: { files: droppedFiles } })
  }


  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const openPreview = (preview) => {
    setSelectedPreview(preview)
    setShowModal(true)
    
    // Modal açıldığında sayfayı yumuşak bir şekilde ortalamaya yakın kaydır
    setTimeout(() => {
      const scrollTarget = Math.max(0, window.scrollY - (window.innerHeight * 0.3))
      window.scrollTo({ top: scrollTarget, behavior: 'smooth' })
    }, 100)
  }

  const handleConvert = async () => {
    if (files.length === 0) return

    setIsConverting(true)
    setProgress(0)
    
    try {
      const BATCH_SIZE = 3; // Aynı anda max 3 dosya işle
      const batches = [];
      
      // Dosyaları batch'lere böl
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push(files.slice(i, i + BATCH_SIZE));
      }
      
      let processedCount = 0;
      
      // Her batch'i sırayla işle
      for (const batch of batches) {
        await Promise.all(
          batch.map(async ({ file }) => {
            if (mode === 'toPdf') {
              const pdfBlob = await convertToPdf(file)
              const url = URL.createObjectURL(pdfBlob)
              const a = document.createElement('a')
              const fileName = file.name.replace(/\.[^/.]+$/, '.pdf')
              a.href = url
              a.download = fileName
              a.click()
              URL.revokeObjectURL(url)
            } else {
              const blob = await convertFromPdf(file, outputFormat)
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              let fileName = file.name.replace('.pdf', '')
              let extension = '.txt'
              if (outputFormat === 'html') extension = '.html'
              if (outputFormat === 'image') extension = '.zip' // ZIP dosyası olarak indir
              a.href = url
              a.download = fileName + extension
              a.click()
              URL.revokeObjectURL(url)
            }
            
            processedCount++
            setProgress((processedCount / files.length) * 100)
          })
        )
        
        // Batch'ler arası kısa gecikme
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      setToast({ type: 'success', message: `${files.length} dosya başarıyla dönüştürüldü!` })
      setFiles([])
    } catch (error) {
      setToast({ type: 'error', message: `Hata: ${error.message}` })
    } finally {
      setIsConverting(false)
      setProgress(0)
    }
  }

  // PDF Birleştirme fonksiyonu
  const handleMergePdfs = async () => {
    if (files.length < 2) {
      setToast({ type: 'error', message: 'En az 2 PDF dosyası seçmelisiniz!' })
      return
    }

    setIsConverting(true)
    setProgress(0)
    
    try {
      const pdfFiles = files.map(f => f.file)
      setProgress(50)
      
      const mergedBlob = await mergePdfs(pdfFiles)
      setProgress(100)
      
      const url = URL.createObjectURL(mergedBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'birlestirilmis.pdf'
      a.click()
      URL.revokeObjectURL(url)
      
      setToast({ type: 'success', message: `${files.length} PDF başarıyla birleştirildi!` })
      setFiles([])
    } catch (error) {
      setToast({ type: 'error', message: `Birleştirme hatası: ${error.message}` })
    } finally {
      setIsConverting(false)
      setProgress(0)
    }
  }

  // Dosya sıralama fonksiyonları (liste öğeleri için) - tekil ve tutarlı isimler
  const handleItemDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleItemDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newFiles = [...files]
    const draggedFile = newFiles[draggedIndex]
    newFiles.splice(draggedIndex, 1)
    newFiles.splice(index, 0, draggedFile)
    
    setFiles(newFiles)
    setDraggedIndex(index)
  }

  const handleItemDragEnd = () => {
    setDraggedIndex(null)
  }

  // ESC ile modal kapatma
  useEffect(() => {
    if (!showModal) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showModal])

  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
  <h2 className="text-4xl font-bold bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">
          {mode === 'toPdf' ? 'Dosyalarınızı PDF\'e Dönüştürün' : 'PDF\'lerinizi Dönüştürün'}
        </h2>
        <p className="text-white/70 text-lg">
          {mode === 'toPdf'
            ? 'Birden fazla dosya ekleyip toplu dönüştürme yapabilirsiniz'
            : 'PDF dosyalarınızı istediğiniz formata dönüştürün'}
        </p>
      </div>
      
      <div className="space-y-6">
        {mode === 'fromPdf' && (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <label className="block text-sm font-semibold text-white/90 mb-4">
              Dönüştürülecek Format:
            </label>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setOutputFormat('text')}
                className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  outputFormat === 'text'
                    ? 'bg-white/20 text-white shadow-glow scale-110'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:scale-105'
                }`}
              >
                📝 Text
              </button>
              <button
                onClick={() => setOutputFormat('html')}
                className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  outputFormat === 'html'
                    ? 'bg-white/20 text-white shadow-glow scale-110'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:scale-105'
                }`}
              >
                🌐 HTML
              </button>
              <button
                onClick={() => setOutputFormat('image')}
                className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  outputFormat === 'image'
                    ? 'bg-white/20 text-white shadow-glow scale-110'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:scale-105'
                }`}
              >
                🖼️ Görsel (PNG)
              </button>
            </div>
          </div>
        )}

        {mode === 'toPdf' && (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
            <label className="block text-sm font-semibold text-white/90 mb-6">
              PDF Ayarları:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs text-white/70 mb-2 font-medium">Sayfa Boyutu</label>
                <select 
                  value={pdfOptions.pageSize}
                  onChange={(e) => setPdfOptions({...pdfOptions, pageSize: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all backdrop-blur-md"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-2 font-medium">Yönelim</label>
                <select 
                  value={pdfOptions.orientation}
                  onChange={(e) => setPdfOptions({...pdfOptions, orientation: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all backdrop-blur-md"
                >
                  <option value="portrait">Dikey</option>
                  <option value="landscape">Yatay</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-2 font-medium">Kalite</label>
                <select 
                  value={pdfOptions.quality}
                  onChange={(e) => setPdfOptions({...pdfOptions, quality: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all backdrop-blur-md"
                >
                  <option value="high">Yüksek</option>
                  <option value="medium">Orta</option>
                  <option value="low">Düşük</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 overflow-hidden group ${
            isDragging 
              ? 'border-white/60 bg-white/20 scale-105 shadow-glow backdrop-blur-xl' 
              : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 backdrop-blur-md'
          }`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="text-8xl animate-float">📁</div>
            <p className="text-xl font-semibold text-white">
              Dosyaları buraya sürükleyin veya tıklayın
            </p>
            <label className="block">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept={mode === 'toPdf' ? '.doc,.docx,.xls,.xlsx,.txt,.html,.png,.jpg,.jpeg' : '.pdf'}
              />
              <span className="relative group/btn inline-block">
                <div className="absolute inset-0 bg-gradient-premium rounded-2xl blur-lg group-hover/btn:blur-xl transition-all" />
                <span className="relative bg-gradient-premium text-white px-8 py-4 rounded-2xl cursor-pointer inline-block transition-all hover:scale-110 font-semibold shadow-glow">
                  ✨ Dosya Seç
                </span>
              </span>
            </label>
            <p className="text-sm text-white/60">
              {mode === 'toPdf' 
                ? 'Desteklenen formatlar: DOC, DOCX, XLS, XLSX, TXT, HTML, PNG, JPG'
                : 'Yalnızca PDF dosyaları desteklenir'}
            </p>
          </div>
        </div>

        {/* Dosya Listesi */}
        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-xl font-bold text-white">
                Seçilen Dosyalar ({files.length})
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-white/70 hover:text-red-400 text-sm font-semibold transition-colors"
              >
                🗑️ Tümünü Temizle
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={fileListRef}>
              {files.map((item, index) => (
                <div 
                  key={index} 
                  className="relative group"
                  draggable
                  onDragStart={() => handleItemDragStart(index)}
                  onDragOver={(e) => handleItemDragOver(e, index)}
                  onDragEnd={handleItemDragEnd}
                >
                  <div 
                    onClick={() => openPreview(item.preview)}
                    className="cursor-pointer hover:scale-105 transition-all duration-300"
                  >
                    <FilePreview file={item} />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Progress Bar */}
        {isConverting && (
          <div className="relative bg-white/10 rounded-full h-4 overflow-hidden backdrop-blur-md border border-white/20">
            <div 
              className="bg-gradient-premium h-full transition-all duration-300 ease-out shadow-glow relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-shine animate-shimmer" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {Math.round(progress)}%
            </div>
          </div>
        )}

        {/* Convert / Merge Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className={`relative group/convert flex-1 py-5 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden ${
              isConverting
                ? 'bg-white/10 cursor-not-allowed text-white/50'
                : 'bg-gradient-premium text-white shadow-glow hover:shadow-glow-accent hover:scale-105 cursor-pointer'
            }`}
          >
            {!isConverting && (
              <>
                <div className="absolute inset-0 bg-gradient-shine group-hover/convert:animate-shimmer" />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/convert:opacity-100 transition-opacity" />
              </>
            )}
            <span className="relative">
              {isConverting ? `⏳ Dönüştürülüyor... ${Math.round(progress)}%` : `🚀 ${files.length} Dosyayı Dönüştür`}
            </span>
          </button>
          
          {mode === 'fromPdf' && files.length >= 2 && (
            <button
              onClick={handleMergePdfs}
              disabled={isConverting}
              className={`relative group/merge px-8 py-5 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isConverting
                  ? 'bg-white/10 cursor-not-allowed text-white/50'
                  : 'bg-gradient-premium text-white shadow-glow hover:shadow-glow-accent hover:scale-105 cursor-pointer'
              }`}
            >
              {!isConverting && (
                <>
                  <div className="absolute inset-0 bg-gradient-shine group-hover/merge:animate-shimmer" />
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/merge:opacity-100 transition-opacity" />
                </>
              )}
              <span className="relative">
                🔗 PDF Birleştir
              </span>
            </button>
          )}
        </div>

        {/* Modal ve Toast */}
        {showModal && (
          <FilePreviewModal
            // görünürlük
            isOpen={showModal}
            open={showModal}
            show={showModal}
            visible={showModal}
            // kapanma callback'leri (farklı API'ler için)
            onClose={() => setShowModal(false)}
            onRequestClose={() => setShowModal(false)}
            onDismiss={() => setShowModal(false)}
            close={() => setShowModal(false)}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            file={selectedPreview}
            key={selectedPreview?.name || 'preview-modal'}
          />
        )}
        {toast && (
          <Toast
            toast={toast}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}