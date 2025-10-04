'use client'

import { useState, useEffect } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/light'
import vs2015 from 'react-syntax-highlighter/dist/styles/vs2015'
import vs from 'react-syntax-highlighter/dist/styles/vs'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Copy, Check, Download, Eye, EyeOff } from 'lucide-react'
import { getLanguageFromExtension } from '@/lib/utils'
import { toast } from '@/lib/toast'

interface CodeBlockProps {
  content: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({ 
  content, 
  language = 'text', 
  filename, 
  showLineNumbers = true,
  className = ''
}: CodeBlockProps) {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const [detectedLanguage, setDetectedLanguage] = useState(language)

  useEffect(() => {
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      setDetectedLanguage(getLanguageFromExtension(ext))
    }
  }, [filename])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const downloadCode = () => {
    if (!filename) {
      toast.error('No filename specified')
      return
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Code downloaded!')
  }

  const getLanguageDisplayName = (lang: string): string => {
    const languageNames: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'jsx': 'JSX',
      'tsx': 'TSX',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less',
      'xml': 'XML',
      'json': 'JSON',
      'yaml': 'YAML',
      'toml': 'TOML',
      'ini': 'INI',
      'sql': 'SQL',
      'bash': 'Bash',
      'powershell': 'PowerShell',
      'batch': 'Batch',
      'dockerfile': 'Dockerfile',
      'makefile': 'Makefile',
      'markdown': 'Markdown',
      'text': 'Text'
    }
    return languageNames[lang] || lang.toUpperCase()
  }

  const getFileIcon = (lang: string): string => {
    const icons: { [key: string]: string } = {
      'javascript': '🟨',
      'typescript': '🔷',
      'python': '🐍',
      'java': '☕',
      'cpp': '⚡',
      'c': '⚡',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'yaml': '📄',
      'sql': '🗄️',
      'bash': '💻',
      'dockerfile': '🐳',
      'markdown': '📝'
    }
    return icons[lang] || '📄'
  }

  if (!showContent) {
    return (
      <Card className={`bg-[var(--bg-secondary)] border-[var(--border)] ${className}`}>
        <div className="p-4 text-center text-[var(--text-secondary)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContent(true)}
            className="text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            <Eye className="h-4 w-4 mr-2" />
            Show Code Block
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`bg-[var(--bg-secondary)] border-[var(--border)] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="text-lg">{getFileIcon(detectedLanguage)}</span>
          <div className="min-w-0 flex-1">
            {filename && (
              <div className="font-mono text-sm text-[var(--text)] truncate">
                {filename}
              </div>
            )}
            <div className="text-xs text-[var(--text-secondary)]">
              {getLanguageDisplayName(detectedLanguage)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContent(false)}
            className="h-8 px-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
            title="Hide code block"
          >
            <EyeOff className="h-3 w-3" />
          </Button>

          {filename && (
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadCode}
              className="h-8 px-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
              title="Download file"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 px-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-[var(--success)]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <SyntaxHighlighter
          language={detectedLanguage}
          style={theme === 'dark' ? vs2015 : vs}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
          }}
          lineNumberStyle={{
            color: theme === 'dark' ? '#6e7681' : '#8b949e',
            marginRight: '1rem',
            userSelect: 'none',
          }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </Card>
  )
}
