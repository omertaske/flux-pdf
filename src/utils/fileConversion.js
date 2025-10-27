
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas'
import * as pdfjsLib from 'pdfjs-dist'

// PDF.js worker dosyasını lokal olarak ayarla
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

/**
 * Çoklu PDF'leri birleştirir
 */
export const mergePdfs = async (files) => {
  try {
    const pdf = new jsPDF();
    let isFirstPage = true;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdfDoc = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        
        const imgData = canvas.toDataURL('image/png');
        
        if (!isFirstPage) {
          pdf.addPage([viewport.width, viewport.height]);
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, viewport.width, viewport.height);
        isFirstPage = false;
      }
    }

    return pdf.output('blob');
  } catch (error) {
    throw new Error('PDF birleştirme hatası: ' + error.message);
  }
};



export const convertToPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target.result
              let pdf
        
        switch (file.type) {
          case 'text/plain': {
            // Text dosyasını PDF'e çevir
            const textContent = new TextDecoder().decode(content)
                  pdf = new jsPDF()
                  pdf.text(textContent, 10, 10)
                  const pdfBlob = pdf.output('blob')
                  resolve(pdfBlob)
            break
          }
          
          case 'text/html': {
            // HTML'i PDF'e çevir (html2canvas + jsPDF)
            const htmlContent = new TextDecoder().decode(content)

            try {
              // gizli bir container oluşturup HTML içeriğini koy
              const container = document.createElement('div')
              container.style.position = 'fixed'
              container.style.left = '-9999px'
              container.style.top = '0'
              container.style.width = '900px' // render genişliği, gerekirse ayarla
              container.style.padding = '20px'
              container.innerHTML = htmlContent
              document.body.appendChild(container)

              // resimlerin yüklenmesini bekle
              const imgs = Array.from(container.querySelectorAll('img'))
              await Promise.all(imgs.map((img) => {
                if (img.complete) return Promise.resolve()
                return new Promise((res) => { img.onload = res; img.onerror = res })
              }))

              const canvas = await html2canvas(container, { scale: 2, useCORS: true })
              const imgData = canvas.toDataURL('image/png')
              // PDF boyutlarını canvas ile eşleştir
              const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })
              pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
              const pdfBlob = pdf.output('blob')

              document.body.removeChild(container)
              resolve(pdfBlob)
            } catch {
              // fallback: düz metin olarak ekle (eski davranış)
              pdf = new jsPDF()
              pdf.text(htmlContent.replace(/<[^>]+>/g, ''), 10, 10)
              const pdfBlob = pdf.output('blob')
              resolve(pdfBlob)
            }

            break
          }
          
          case 'image/png':
          case 'image/jpeg':
          case 'image/jpg': {
            // Görsel dosyayı PDF'e çevir
    const imgData = new Uint8Array(content)
    const base64String = arrayBufferToBase64(imgData)
    const mimeType = file.type
    pdf = new jsPDF({orientation: 'portrait'})
    pdf.addImage('data:' + mimeType + ';base64,' + base64String, 'JPEG', 10, 10, 180, 160)
    const pdfBlob = pdf.output('blob')
    resolve(pdfBlob)
            break
          }
          
          default:
            reject(new Error('Bu dosya türü henüz desteklenmiyor'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsArrayBuffer(file)
  })
}


function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const convertFromPdf = async (file, outputFormat = 'text') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const pdfData = new Uint8Array(e.target.result)
        const loadingTask = pdfjsLib.getDocument({ data: pdfData })
        const pdf = await loadingTask.promise
        
        if (outputFormat === 'text') {
          // Text çıktısı: tüm sayfalardan metin çıkar
          let fullText = ''
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items.map((item) => item.str).join(' ')
            fullText += `--- Sayfa ${pageNum} ---\n${pageText}\n\n`
          }
          resolve(new Blob([fullText], { type: 'text/plain' }))
        } else if (outputFormat === 'html') {
          // HTML çıktısı: metni HTML formatında oluştur
          let htmlContent = '<html><head><meta charset="UTF-8"><title>PDF Dönüştürme</title></head><body>'
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items.map((item) => item.str).join(' ')
            htmlContent += `<h2>Sayfa ${pageNum}</h2><p>${pageText}</p>`
          }
          htmlContent += '</body></html>'
          resolve(new Blob([htmlContent], { type: 'text/html' }))
        } else if (outputFormat === 'image') {
          // Görsel çıktısı: TÜM sayfaları PNG olarak render et ve ZIP olarak indir
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const viewport = page.getViewport({ scale: 2.0 })
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.width = viewport.width
            canvas.height = viewport.height
            
            await page.render({ canvasContext: context, viewport }).promise
            
            // Canvas'ı blob'a çevir
            const blob = await new Promise((res) => {
              canvas.toBlob((b) => res(b), 'image/png')
            })
            
            // ZIP'e ekle
            zip.file(`sayfa_${pageNum}.png`, blob)
          }
          
          // ZIP dosyasını oluştur
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          resolve(zipBlob)
        } else {
          reject(new Error('Geçersiz çıktı formatı'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsArrayBuffer(file)
  })
}