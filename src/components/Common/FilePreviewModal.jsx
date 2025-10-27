import React from "react";

export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null;
  
  const fileType = file.type || file.preview?.type || "";
  const fileName = file.name || file.preview?.name || "Bilinmeyen dosya";
  const fileContent = file.content || file.preview?.content || "";
  
  const getFileIcon = () => {
    if (!fileType) return "📁";
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    return "📁";
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-2xl bg-black/40 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative backdrop-blur-3xl bg-white/10 rounded-3xl shadow-premium max-w-4xl w-full mx-4 p-10 flex flex-col gap-8 animate-scaleIn border border-white/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
  <div className="absolute inset-0 bg-linear-to-br from-white/20 via-white/5 to-transparent pointer-events-none" />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl backdrop-blur-xl bg-white/10 hover:bg-red-500/80 hover:text-white transition-all duration-300 text-white/70 text-2xl font-bold shadow-glass z-10 hover:scale-110 hover:rotate-90 border border-white/20"
          aria-label="Kapat"
        >
          ×
        </button>
        <div className="relative flex items-center gap-6 pb-6 border-b border-white/20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-premium rounded-2xl blur-xl opacity-50" />
            <span className="relative text-5xl block p-3">{getFileIcon()}</span>
          </div>
          <div>
            <div className="font-bold text-2xl text-white">{fileName}</div>
            <div className="text-sm text-white/60 mt-1">{fileType || "Bilinmeyen tür"}</div>
          </div>
        </div>
        {fileType.startsWith("image/") && (
          <div className="relative rounded-2xl overflow-hidden border border-white/30 shadow-glass">
            <img src={fileContent} alt="Preview" className="max-h-[70vh] object-contain mx-auto w-full" />
          </div>
        )}
        {fileType.startsWith("text/") && (
          <div className="backdrop-blur-xl bg-white/5 p-6 rounded-2xl border border-white/20 text-sm max-h-[60vh] overflow-auto shadow-glass">
            <pre className="whitespace-pre-wrap font-mono text-white/90">{fileContent}</pre>
          </div>
        )}
        {fileType === "application/pdf" && (
          <div className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl text-center text-white text-lg border border-white/20 shadow-glass">
            📄 PDF dosyası önizlemesi desteklenmiyor. İndirmek için dönüştürme işlemini tamamlayın.
          </div>
        )}
        {!fileType.startsWith("image/") && !fileType.startsWith("text/") && fileType !== "application/pdf" && (
          <div className="backdrop-blur-xl bg-white/5 p-8 rounded-2xl border border-white/20 text-lg text-white/70 text-center shadow-glass">
            Bu dosya türü için önizleme desteklenmiyor.
          </div>
        )}
      </div>
    </div>
  );
}
