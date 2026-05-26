const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo "${file.name}" excede o limite de 20 MB.`
  }
  // HEIC/HEIF não têm MIME type confiável em todos os browsers — aceita pela extensão
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isHeic = ['heic', 'heif'].includes(ext)
  if (!ALLOWED_MIME_TYPES.has(file.type) && !isHeic) {
    return `Tipo de arquivo não permitido: "${file.name}". Use PDF, imagem ou Word.`
  }
  return null
}

// Remove path traversal, caracteres especiais e limita comprimento
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\]/g, '')          // path traversal
    .replace(/[^\w.\-\s]/g, '_')   // só alfanumérico, ponto, hífen, espaço
    .replace(/\.{2,}/g, '.')        // double-dot sequences
    .slice(0, 200)                   // limite de tamanho
    .trim()
}
