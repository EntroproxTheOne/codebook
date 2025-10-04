'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRoom } from '@/components/room-context'
import { NoteItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { 
  Plus, 
  Type, 
  Code, 
  Image, 
  File, 
  X, 
  Move, 
  Maximize2,
  Minimize2,
  Copy,
  Trash2
} from 'lucide-react'
import { isCodeFile, getFileExtension, getLanguageFromExtension } from '@/lib/utils'
import { CodeBlock } from '@/components/code-block'
import { toast } from '@/lib/toast'

interface CanvasItemProps {
  item: NoteItem
  onUpdate: (id: string, updates: Partial<NoteItem>) => void
  onRemove: (id: string) => void
}

function CanvasItem({ item, onUpdate, onRemove }: CanvasItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const itemRef = useRef<HTMLDivElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging from anywhere on the item, except buttons and input fields
    const target = e.target as HTMLElement
    const isButton = target.closest('button')
    const isInput = target.closest('input, textarea')
    const isResizeHandle = target.closest('.resize-handle')
    
    if (!isButton && !isInput && !isResizeHandle) {
      e.preventDefault()
      e.stopPropagation()
      
      setIsDragging(true)
      setDragStart({
        x: e.clientX - item.position.x,
        y: e.clientY - item.position.y
      })
      
      // Add dragging class for visual feedback
      if (itemRef.current) {
        itemRef.current.style.zIndex = '1000'
        itemRef.current.style.opacity = '0.8'
      }
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      
      // Keep within canvas bounds
      const boundedX = Math.max(0, Math.min(newX, window.innerWidth - item.dimensions.width))
      const boundedY = Math.max(0, Math.min(newY, window.innerHeight - item.dimensions.height))
      
      // Update position visually without database calls during drag
      if (itemRef.current) {
        itemRef.current.style.left = boundedX + 'px'
        itemRef.current.style.top = boundedY + 'px'
      }
    }
  }, [isDragging, dragStart, item.dimensions])

  const scheduleUpdate = useCallback((x: number, y: number) => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    // Store pending position
    pendingPositionRef.current = { x, y }
    
    // Schedule update after 2 minutes (120000ms)
    updateTimeoutRef.current = setTimeout(() => {
      if (pendingPositionRef.current) {
        onUpdate(item.id, {
          position: pendingPositionRef.current
        })
        pendingPositionRef.current = null
      }
    }, 120000) // 2 minutes
  }, [item.id, onUpdate])

  const handleMouseUp = useCallback(() => {
    if (isDragging && itemRef.current) {
      // Get final position from DOM
      const finalX = parseInt(itemRef.current.style.left) || item.position.x
      const finalY = parseInt(itemRef.current.style.top) || item.position.y
      
      // Schedule database update (debounced)
      scheduleUpdate(finalX, finalY)
      
      // Remove dragging visual feedback
      itemRef.current.style.zIndex = '10'
      itemRef.current.style.opacity = '1'
    }
    
    setIsDragging(false)
    setIsResizing(false)
  }, [isDragging, item.position, scheduleUpdate])

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: item.dimensions.width,
      height: item.dimensions.height
    })
  }

  const copyContent = () => {
    navigator.clipboard.writeText(item.content)
    toast.success('Content copied to clipboard')
  }

  const getItemIcon = () => {
    switch (item.type) {
      case 'code':
        return <Code className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'file':
        return <File className="h-4 w-4" />
      default:
        return <Type className="h-4 w-4" />
    }
  }

  const getItemTitle = () => {
    if (item.filename) {
      return item.filename
    }
    
    switch (item.type) {
      case 'code':
        return 'Code Block'
      case 'image':
        return 'Image'
      case 'file':
        return 'File'
      default:
        return 'Text Note'
    }
  }

  return (
    <div
      ref={itemRef}
      className={`absolute cursor-move select-none ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.dimensions.width,
        height: item.dimensions.height,
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="h-full w-full overflow-hidden bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {getItemIcon()}
            <span className="font-mono text-xs text-[var(--text)] truncate">
              {getItemTitle()}
            </span>
            {item.language && (
              <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg)] px-1 rounded">
                {item.language}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-[var(--bg)]"
              onClick={copyContent}
              title="Copy content"
            >
              <Copy className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-[var(--bg)]"
              onClick={() => setIsEditing(!isEditing)}
              title={isEditing ? "View mode" : "Edit mode"}
            >
              {isEditing ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-[var(--bg)] text-[var(--error)]"
              onClick={() => onRemove(item.id)}
              title="Delete item"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-auto">
          {isEditing ? (
            <div className="p-3">
              <Textarea
                value={item.content}
                onChange={(e) => onUpdate(item.id, { content: e.target.value })}
                className="h-full resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                placeholder="Enter your content..."
              />
            </div>
          ) : (
            <div className="h-full">
              {item.type === 'code' ? (
                <CodeBlock
                  content={item.content}
                  language={item.language}
                  filename={item.filename}
                  className="h-full border-0 rounded-none"
                />
              ) : item.type === 'image' ? (
                <div className="h-full flex items-center justify-center p-3">
                  <img
                    src={item.content}
                    alt={item.filename || 'Image'}
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-center text-[var(--text-secondary)] p-4';
                      errorDiv.innerHTML = `
                        <div class="text-4xl mb-2">🖼️</div>
                        <div class="text-sm">Failed to load image</div>
                        <div class="text-xs mt-1 break-all">${item.content}</div>
                      `;
                      target.parentNode?.appendChild(errorDiv);
                    }}
                  />
                </div>
              ) : (
                <div className="p-3 text-sm whitespace-pre-wrap break-words h-full overflow-auto">
                  {item.content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-[var(--accent)] opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
        />
      </Card>
    </div>
  )
}

export function Canvas() {
  const { room, addItem, updateItem, removeItem } = useRoom()
  const [isAdding, setIsAdding] = useState(false)
  const [newItemType, setNewItemType] = useState<'text' | 'code' | 'image'>('text')
  const [isCreatingText, setIsCreatingText] = useState(false)
  const [textCreationPosition, setTextCreationPosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)

  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault()
    
    const items = e.clipboardData?.items
    if (!items) return

    // Get cursor position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const baseX = Math.round(Math.random() * 100 + 50) // Random offset from cursor
    const baseY = Math.round(Math.random() * 100 + 50)

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.type.startsWith('text/')) {
        item.getAsString((text) => {
          if (text.trim()) {
            // Check if it's an image URL
            const imageExtensions = /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff|dng|raw)$/i
            const isImageUrl = text.match(/^https?:\/\/.+/) && imageExtensions.test(text)
            
            if (isImageUrl) {
              addItem({
                type: 'image',
                content: text,
                position: { x: baseX, y: baseY },
                dimensions: { width: 400, height: 300 },
                filename: text.split('/').pop() || 'image'
              })
            } else {
              // Check for <code> tags
              const codeTagRegex = /<code[^>]*>([\s\S]*?)<\/code>/gi
              const codeMatches = text.match(codeTagRegex)
              
              if (codeMatches && codeMatches.length > 0) {
                // Extract code content from tags
                const codeContent = codeMatches.map(match => {
                  const content = match.replace(/<code[^>]*>|<\/code>/gi, '')
                  return content
                }).join('\n\n')
                
                addItem({
                  type: 'code',
                  content: codeContent,
                  position: { x: baseX, y: baseY },
                  dimensions: { width: 400, height: 300 },
                  language: 'text'
                })
              } else {
                // Regular text (not code)
                addItem({
                  type: 'text',
                  content: text,
                  position: { x: baseX, y: baseY },
                  dimensions: { width: 300, height: 200 }
                })
              }
            }
          }
        })
      } else if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            addItem({
              type: 'image',
              content: e.target?.result as string,
              position: { x: baseX, y: baseY },
              dimensions: { width: 400, height: 300 }
            })
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }, [addItem])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('paste', handlePaste)
      return () => canvas.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  const addNewItem = () => {
    const basePosition = { x: Math.round(Math.random() * 200 + 100), y: Math.round(Math.random() * 200 + 100) }
    
    if (newItemType === 'image') {
      // For images, prompt for URL
      const url = prompt('Enter image URL:')
      if (url && url.trim()) {
        addItem({
          type: 'image',
          content: url.trim(),
          position: basePosition,
          dimensions: { width: 400, height: 300 },
          filename: url.split('/').pop() || 'image'
        })
      }
    } else {
      addItem({
        type: newItemType,
        content: '',
        position: basePosition,
        dimensions: { width: 300, height: 200 },
        language: newItemType === 'code' ? 'text' : undefined
      })
    }
    setIsAdding(false)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only create text if clicking on empty canvas (not on items)
    if (e.target === e.currentTarget && !isAdding) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setTextCreationPosition({
          x: Math.round(e.clientX - rect.left),
          y: Math.round(e.clientY - rect.top)
        })
        setIsCreatingText(true)
      }
    }
  }

  const handleTextInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      finishTextCreation()
    } else if (e.key === 'Escape') {
      setIsCreatingText(false)
    }
  }

  const finishTextCreation = () => {
    const content = textInputRef.current?.value.trim()
    if (content) {
      addItem({
        type: 'text',
        content,
        position: { x: Math.round(textCreationPosition.x), y: Math.round(textCreationPosition.y) },
        dimensions: { width: 300, height: Math.max(100, content.split('\n').length * 20 + 40) }
      })
    }
    setIsCreatingText(false)
  }

  const handleTextInputBlur = () => {
    // Small delay to allow for Enter key handling
    setTimeout(() => {
      finishTextCreation()
    }, 100)
  }

  if (!room) return null

  return (
    <div className="flex-1 relative overflow-hidden bg-[var(--bg)]">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full relative cursor-crosshair"
        tabIndex={0}
        style={{ minHeight: 'calc(100vh - 200px)' }}
        onClick={handleCanvasClick}
      >
        {room.items.map((item) => (
          <CanvasItem
            key={item.id}
            item={item}
            onUpdate={updateItem}
            onRemove={removeItem}
          />
        ))}

        {/* Text Creation Input */}
        {isCreatingText && (
          <div
            className="absolute z-50"
            style={{
              left: textCreationPosition.x,
              top: textCreationPosition.y,
            }}
          >
            <Card className="bg-[var(--bg-secondary)] border-[var(--border)] shadow-lg">
              <Textarea
                ref={textInputRef}
                placeholder="Start typing..."
                className="w-80 min-h-20 resize-none border-0 bg-transparent p-3 focus-visible:ring-0 text-[var(--text)] placeholder:text-[var(--text-secondary)]"
                onKeyDown={handleTextInputKeyDown}
                onBlur={handleTextInputBlur}
                autoFocus
              />
              <div className="px-3 pb-2 text-xs text-[var(--text-secondary)]">
                Press Enter to save, Escape to cancel
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add Item Button */}
      <div className="absolute bottom-4 right-4 z-50">
        {isAdding ? (
          <div className="flex flex-col space-y-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3 shadow-lg">
            <div className="flex space-x-2">
              <Button
                variant={newItemType === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewItemType('text')}
              >
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button
                variant={newItemType === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewItemType('code')}
              >
                <Code className="h-4 w-4 mr-2" />
                Code
              </Button>
              <Button
                variant={newItemType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewItemType('image')}
              >
                <Image className="h-4 w-4 mr-2" />
                Image
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={addNewItem}
                className="glow-button"
              >
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsAdding(true)}
            className="glow-button rounded-full w-12 h-12"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Instructions */}
      {room.items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-[var(--text-secondary)]">
            <div className="font-mono text-lg mb-2">Welcome to CodeNote</div>
            <div className="text-sm">
              Click anywhere to add text, use the + button for other items, or paste content directly
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
