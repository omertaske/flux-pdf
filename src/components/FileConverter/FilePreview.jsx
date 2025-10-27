export function FilePreview({ file }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{file.name}</h3>
        <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
      </div>

      {file.type.startsWith('image/') ? (
        <img
          src={file.content}
          alt="Preview"
          className="max-w-full h-auto rounded"
        />
      ) : (
        <div className="bg-white p-4 rounded border border-gray-200 max-h-60 overflow-auto">
          <pre className="text-sm whitespace-pre-wrap">{file.content}</pre>
        </div>
      )}
    </div>
  )
}