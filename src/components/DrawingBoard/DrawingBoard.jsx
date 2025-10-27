import { useState, useRef, useEffect, useCallback } from 'react'
import { jsPDF } from 'jspdf'

export function DrawingBoard() {
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(3)
  const [history, setHistory] = useState([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [canvasWidth, setCanvasWidth] = useState(1241)
  const [canvasHeight, setCanvasHeight] = useState(600)
  const [objects, setObjects] = useState([]) // {type: 'text'|'image', x, y, width, height, content, ...}
  const [selectedObject, setSelectedObject] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Canvas'ı başlat ve resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        
        // Mevcut içeriği kaydet
        const imageData = canvas.width > 0 ? canvas.toDataURL() : null
        
        canvas.width = canvasWidth
        canvas.height = canvasHeight

        const context = canvas.getContext('2d')
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.strokeStyle = color
        context.fillStyle = color
        context.lineWidth = lineWidth
        contextRef.current = context
        
        // Beyaz arkaplan
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = color
        
        // Eski içeriği geri yükle
        if (imageData) {
          const img = new Image()
          img.onload = () => {
            context.drawImage(img, 0, 0)
            redrawObjects()
          }
          img.src = imageData
        } else {
          saveToHistory()
        }
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth, canvasHeight])

  // Renk ve kalınlık değiştiğinde context'i güncelle
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color
      contextRef.current.fillStyle = color
      contextRef.current.lineWidth = lineWidth
    }
  }, [color, lineWidth])

  // History'ye kaydet
  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL()
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1)
      newHistory.push(dataURL)
      // Max 50 adım tut
      if (newHistory.length > 50) newHistory.shift()
      return newHistory
    })
    setHistoryStep(prev => Math.min(prev + 1, 49))
  }, [historyStep])

  // Objeleri yeniden çiz
  const redrawObjects = useCallback(() => {
    if (!contextRef.current) return
    const ctx = contextRef.current
    
    objects.forEach(obj => {
      if (obj.type === 'text') {
        ctx.font = `${obj.fontSize}px Arial`
        ctx.fillStyle = obj.color
        ctx.fillText(obj.content, obj.x, obj.y)
      } else if (obj.type === 'image' && obj.imageData) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height)
        }
        img.src = obj.imageData
      }
    })
    
    // Seçili objeyi göster
    if (selectedObject !== null && objects[selectedObject]) {
      const obj = objects[selectedObject]
      ctx.strokeStyle = '#0066ff'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      if (obj.type === 'text') {
        ctx.strokeRect(obj.x - 5, obj.y - obj.fontSize - 5, obj.width + 10, obj.fontSize + 15)
      } else {
        ctx.strokeRect(obj.x - 5, obj.y - 5, obj.width + 10, obj.height + 10)
      }
      ctx.setLineDash([])
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
    }
  }, [objects, selectedObject, color, lineWidth])

  // Mouse/Touch pozisyonu al
  const getPosition = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.clientX || e.touches?.[0]?.clientX
    const clientY = e.clientY || e.touches?.[0]?.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e) => {
    if (!canvasRef.current || !contextRef.current) return
    const pos = getPosition(e)
    setStartPos(pos)
    
    // Obje seçimi kontrolü
    let clickedObjIndex = -1
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      if (obj.type === 'text') {
        if (pos.x >= obj.x - 5 && pos.x <= obj.x + obj.width + 5 &&
            pos.y >= obj.y - obj.fontSize - 5 && pos.y <= obj.y + 15) {
          clickedObjIndex = i
          break
        }
      } else if (obj.type === 'image') {
        if (pos.x >= obj.x - 5 && pos.x <= obj.x + obj.width + 5 &&
            pos.y >= obj.y - 5 && pos.y <= obj.y + obj.height + 5) {
          clickedObjIndex = i
          break
        }
      }
    }
    
    if (clickedObjIndex !== -1) {
      setSelectedObject(clickedObjIndex)
      setIsDragging(true)
      setDragOffset({ x: pos.x - objects[clickedObjIndex].x, y: pos.y - objects[clickedObjIndex].y })
      return
    } else {
      setSelectedObject(null)
    }
    
    setIsDrawing(true)
    const ctx = contextRef.current
    
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
  }

  const draw = (e) => {
    if (!contextRef.current) return
    e.preventDefault()
    
    const pos = getPosition(e)
    const ctx = contextRef.current
    
    if (isDragging && selectedObject !== null) {
      const newObjects = [...objects]
      newObjects[selectedObject] = {
        ...newObjects[selectedObject],
        x: pos.x - dragOffset.x,
        y: pos.y - dragOffset.y
      }
      setObjects(newObjects)
      
      // Canvas'ı temizle ve yeniden çiz
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      redrawObjects()
      return
    }
    
    if (!isDrawing) return
    
    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }

  const stopDrawing = (e) => {
    if (isDragging) {
      setIsDragging(false)
      saveToHistory()
      return
    }
    
    if (!isDrawing) return
    
    const pos = getPosition(e)
    const ctx = contextRef.current
    
    if (tool === 'rectangle') {
      const width = pos.x - startPos.x
      const height = pos.y - startPos.y
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeRect(startPos.x, startPos.y, width, height)
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2))
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (tool === 'line') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      ctx.moveTo(startPos.x, startPos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    
    setIsDrawing(false)
    ctx.globalCompositeOperation = 'source-over'
    saveToHistory()
  }

  const addText = (e) => {
    if (tool !== 'text') return
    const pos = getPosition(e)
    const text = prompt('Metni girin:')
    if (text && contextRef.current) {
      const fontSize = lineWidth * 8
      const ctx = contextRef.current
      ctx.font = `${fontSize}px Arial`
      const metrics = ctx.measureText(text)
      
      const newObj = {
        type: 'text',
        content: text,
        x: pos.x,
        y: pos.y,
        width: metrics.width,
        height: fontSize,
        fontSize,
        color
      }
      
      setObjects(prev => [...prev, newObj])
      ctx.fillStyle = color
      ctx.fillText(text, pos.x, pos.y)
      saveToHistory()
    }
  }

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            const ctx = contextRef.current
            const scale = Math.min(
              canvasRef.current.width / img.width * 0.3,
              canvasRef.current.height / img.height * 0.3,
              1
            )
            const width = img.width * scale
            const height = img.height * scale
            const x = (canvasRef.current.width - width) / 2
            const y = (canvasRef.current.height - height) / 2
            
            const newObj = {
              type: 'image',
              x,
              y,
              width,
              height,
              imageData: event.target.result
            }
            
            setObjects(prev => [...prev, newObj])
            ctx.drawImage(img, x, y, width, height)
            saveToHistory()
          }
          img.src = event.target.result
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1)
      const img = new Image()
      img.onload = () => {
        const ctx = contextRef.current
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = history[historyStep - 1]
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1)
      const img = new Image()
      img.onload = () => {
        const ctx = contextRef.current
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = history[historyStep + 1]
    }
  }

  const resizeSelectedObject = (scale) => {
    if (selectedObject === null || !objects[selectedObject]) return
    const newObjects = [...objects]
    const obj = newObjects[selectedObject]
    
    if (obj.type === 'text') {
      obj.fontSize = Math.max(10, Math.min(obj.fontSize * scale, 200))
      obj.height = obj.fontSize
      // Metin genişliğini yeniden hesapla
      const ctx = contextRef.current
      ctx.font = `${obj.fontSize}px Arial`
      const metrics = ctx.measureText(obj.content)
      obj.width = metrics.width
    } else if (obj.type === 'image') {
      obj.width = Math.max(20, obj.width * scale)
      obj.height = Math.max(20, obj.height * scale)
    }
    
    setObjects(newObjects)
    
    // Canvas'ı yeniden çiz
    const ctx = contextRef.current
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    
    // Tüm objeleri çiz
    newObjects.forEach(o => {
      if (o.type === 'text') {
        ctx.font = `${o.fontSize}px Arial`
        ctx.fillStyle = o.color
        ctx.fillText(o.content, o.x, o.y)
      } else if (o.type === 'image' && o.imageData) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, o.x, o.y, o.width, o.height)
        img.src = o.imageData
      }
    })
    
    saveToHistory()
  }

  const deleteSelectedObject = () => {
    if (selectedObject === null) return
    const newObjects = objects.filter((_, i) => i !== selectedObject)
    setObjects(newObjects)
    setSelectedObject(null)
    
    // Canvas'ı yeniden çiz
    const ctx = contextRef.current
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    redrawObjects()
    saveToHistory()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = color
    saveToHistory()
  }

  const downloadAsPDF = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    })
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save('cizim.pdf')
  }

  const downloadAsPNG = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cizim.png'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const colorPresets = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFFFFF']

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Çizim Panosu</h2>
      
      {/* Canvas Boyut Ayarları */}
      <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-4 mb-4 border border-purple-200">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <span className="text-sm font-medium text-gray-700">Canvas Boyutu:</span>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">Genişlik:</span>
            <input
              type="number"
              value={canvasWidth}
              onChange={(e) => setCanvasWidth(Math.max(200, Math.min(2000, Number.parseInt(e.target.value) || 800)))}
              className="w-24 px-3 py-1 border border-gray-300 rounded"
              min="200"
              max="2000"
            />
            <span className="text-sm text-gray-600">px</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">Yükseklik:</span>
            <input
              type="number"
              value={canvasHeight}
              onChange={(e) => setCanvasHeight(Math.max(200, Math.min(1500, Number.parseInt(e.target.value) || 600)))}
              className="w-24 px-3 py-1 border border-gray-300 rounded"
              min="200"
              max="1500"
            />
            <span className="text-sm text-gray-600">px</span>
          </div>
        </div>
      </div>

      {/* Seçili Obje Kontrolleri */}
      {selectedObject !== null && (
        <div className="bg-yellow-50 rounded-xl shadow-md p-4 mb-4 border border-yellow-300">
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <span className="text-sm font-semibold text-gray-700">Seçili Obje:</span>
            <button
              onClick={() => resizeSelectedObject(1.1)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              🔍+ Büyüt
            </button>
            <button
              onClick={() => resizeSelectedObject(0.9)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            >
              🔍- Küçült
            </button>
            <button
              onClick={deleteSelectedObject}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
            >
              🗑️ Sil
            </button>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
        <div className="flex flex-wrap gap-3 items-center justify-center">
          {/* Araçlar */}
          <div className="flex gap-2 border-r pr-3">
            <ToolButton icon="✏️" label="Kalem" active={tool === 'pen'} onClick={() => setTool('pen')} />
            <ToolButton icon="🧹" label="Silgi" active={tool === 'eraser'} onClick={() => setTool('eraser')} />
            <ToolButton icon="📏" label="Çizgi" active={tool === 'line'} onClick={() => setTool('line')} />
            <ToolButton icon="▭" label="Dikdörtgen" active={tool === 'rectangle'} onClick={() => setTool('rectangle')} />
            <ToolButton icon="⭕" label="Daire" active={tool === 'circle'} onClick={() => setTool('circle')} />
            <ToolButton icon="📝" label="Metin" active={tool === 'text'} onClick={() => setTool('text')} />
            <ToolButton icon="🖼️" label="Görsel" active={tool === 'image'} onClick={() => { setTool('image'); addImage(); }} />
          </div>
          
          {/* Renk */}
          <div className="flex gap-2 items-center border-r pr-3">
            <span className="text-sm font-medium text-gray-700">Renk:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300"
            />
            <div className="flex gap-1">
              {colorPresets.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded border-2 ${color === c ? 'border-blue-500' : 'border-gray-300'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          {/* Kalınlık */}
          <div className="flex gap-2 items-center border-r pr-3">
            <span className="text-sm font-medium text-gray-700">Kalınlık: {lineWidth}px</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number.parseInt(e.target.value))}
              className="w-32"
            />
          </div>
          
          {/* Geri Al / İleri Al */}
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ↶ Geri Al
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ↷ İleri Al
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-300 rounded-lg shadow-xl touch-none bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={() => isDrawing && stopDrawing({ clientX: 0, clientY: 0 })}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onClick={tool === 'text' ? addText : undefined}
        />
      </div>

      {/* Alt Butonlar */}
      <div className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={clearCanvas}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium shadow-md transition-all"
        >
          🗑️ Temizle
        </button>
        <button
          onClick={downloadAsPNG}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all"
        >
          💾 PNG İndir
        </button>
        <button
          onClick={downloadAsPDF}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium shadow-md transition-all"
        >
          📄 PDF İndir
        </button>
      </div>
    </div>
  )
}

function ToolButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      title={label}
    >
      <span className="text-xl">{icon}</span>
    </button>
  )
}