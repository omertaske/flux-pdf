// Dosya validasyon fonksiyonları

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// İzin verilen dosya türleri
const ALLOWED_TYPES = {
  toPdf: [
    'text/plain',
    'text/html',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ],
  fromPdf: ['application/pdf'],
};

/**
 * Dosya boyutunu kontrol eder
 */
export const validateFileSize = (file, maxSize = MAX_FILE_SIZE) => {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    throw new Error(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır`);
  }
  return true;
};

/**
 * Dosya türünü kontrol eder
 */
export const validateFileType = (file, mode) => {
  const allowedTypes = ALLOWED_TYPES[mode];
  
  if (!allowedTypes || !allowedTypes.includes(file.type)) {
    throw new Error(`Bu dosya türü desteklenmiyor: ${file.type || 'Bilinmeyen'}`);
  }
  return true;
};

/**
 * Dosyayı tam olarak doğrular
 */
export const validateFile = (file, mode) => {
  try {
    validateFileSize(file);
    validateFileType(file, mode);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Dosya boyutunu okunabilir formata çevirir
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
