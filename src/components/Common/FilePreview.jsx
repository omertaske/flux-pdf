import React from "react";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(type) {
  if (!type) return "📁";
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.startsWith("text/")) return "📑";
  if (type.includes("word")) return "📝";
  if (type.includes("excel")) return "📊";
  return "📁";
}

export default function FilePreview({ file }) {
  if (!file) return null;
  
  const fileType = file.type || file.preview?.type || "";
  const fileName = file.name || file.preview?.name || "Bilinmeyen dosya";
  const fileSize = file.size || file.preview?.size || 0;
  const fileContent = file.content || file.preview?.content || "";
  
  return (
    <div className="group relative max-w-md mx-auto p-6 backdrop-blur-xl bg-white/10 rounded-2xl shadow-glass border border-white/20 flex flex-col gap-4 hover:bg-white/15 transition-all duration-300 hover:scale-105">
  <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-premium rounded-xl blur-md opacity-50" />
          <span className="relative text-4xl block p-2">{getFileIcon(fileType)}</span>
        </div>
        <div>
          <div className="font-bold text-lg text-white truncate max-w-xs">{fileName}</div>
          <div className="text-xs text-white/60">{fileType || "Bilinmeyen tür"}</div>
          <div className="text-xs text-white/50 font-semibold">{formatFileSize(fileSize)}</div>
        </div>
      </div>
      {fileType.startsWith("image/") && (
        <div className="relative rounded-xl overflow-hidden border border-white/20">
          <img src={fileContent} alt="Preview" className="max-h-64 object-contain mx-auto w-full" />
        </div>
      )}
      {fileType.startsWith("text/") && (
        <div className="relative bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-sm max-h-48 overflow-auto">
          <pre className="whitespace-pre-wrap text-white/80 font-mono">{fileContent}</pre>
        </div>
      )}
      {fileType === "application/pdf" && (
        <div className="relative bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center text-white/70 text-sm">
          PDF dosyası önizlemesi desteklenmiyor. İndirmek için tıklayınız.
        </div>
      )}
      {/* Diğer dosya türleri için kısa bilgi */}
      {!fileType.startsWith("image/") && !fileType.startsWith("text/") && fileType !== "application/pdf" && (
        <div className="relative bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-sm text-white/70 text-center">
          Bu dosya türü için önizleme desteklenmiyor.
        </div>
      )}
    </div>
  );
}
