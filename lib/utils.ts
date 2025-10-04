import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRoomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function validateRoomKey(key: string): boolean {
  return /^[A-Z0-9]{10}$/.test(key)
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isCodeFile(filename: string): boolean {
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt',
    'html', 'css', 'scss', 'sass', 'less', 'xml', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg',
    'sql', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd', 'dockerfile', 'makefile',
    'md', 'markdown', 'txt', 'log', 'conf', 'config', 'env', 'gitignore', 'gitattributes'
  ]
  return codeExtensions.includes(getFileExtension(filename))
}

export function getLanguageFromExtension(extension: string): string {
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'xml': 'xml',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'bash',
    'ps1': 'powershell',
    'bat': 'batch',
    'cmd': 'batch',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'md': 'markdown',
    'markdown': 'markdown',
    'txt': 'text',
    'log': 'text',
    'conf': 'text',
    'config': 'text',
    'env': 'text',
    'gitignore': 'text',
    'gitattributes': 'text'
  }
  return languageMap[extension] || 'text'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getTimeRemaining(createdAt: Date | string): string {
  const now = new Date()
  const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const diff = 24 * 60 * 60 * 1000 - (now.getTime() - createdDate.getTime())
  
  if (diff <= 0) return 'Expired'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
