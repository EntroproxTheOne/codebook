'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Terminal, Key, Home, Plus } from 'lucide-react'
import { generateRoomKey, validateRoomKey } from '@/lib/utils'
import { toast } from '@/lib/toast'

export function Header() {
  const [roomKey, setRoomKey] = useState('')
  const [customRoomKey, setCustomRoomKey] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showCustomKey, setShowCustomKey] = useState(false)
  const router = useRouter()

  const handleJoinRoom = () => {
    if (!roomKey.trim()) {
      toast.error('Please enter a room key')
      return
    }

    if (!validateRoomKey(roomKey.toUpperCase())) {
      toast.error('Invalid room key format')
      return
    }

    router.push(`/room/${roomKey.toUpperCase()}`)
  }

  const handleCreateRoom = async (customKey?: string) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          theme: 'dark',
          customKey: customKey || undefined
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push(`/room/${data.room.key}`)
        setShowCustomKey(false)
        setCustomRoomKey('')
      } else {
        toast.error(data.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateCustomRoom = () => {
    if (!customRoomKey.trim()) {
      toast.error('Please enter a custom room key')
      return
    }

    if (!validateRoomKey(customRoomKey.toUpperCase())) {
      toast.error('Invalid room key format. Use 10 alphanumeric characters.')
      return
    }

    handleCreateRoom(customRoomKey.toUpperCase())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom()
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 hover:bg-transparent"
          >
            <Terminal className="h-6 w-6 text-[var(--accent)]" />
            <span className="font-mono font-bold text-lg text-[var(--accent)]">
              CodeNote
            </span>
          </Button>
        </div>

        {/* Room Key Input */}
        <div className="flex items-center space-x-2 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Enter room key (10 chars)"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="pl-10 font-mono text-center tracking-widest"
              maxLength={10}
            />
          </div>
          <Button
            onClick={handleJoinRoom}
            variant="outline"
            size="sm"
            className="glow-button"
          >
            Join
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {showCustomKey ? (
            <div className="flex items-center space-x-2 bg-hacker-bg-secondary border border-hacker-border rounded-lg p-2">
              <Input
                placeholder="Custom key (10 chars)"
                value={customRoomKey}
                onChange={(e) => setCustomRoomKey(e.target.value.toUpperCase())}
                className="w-32 font-mono text-center tracking-widest"
                maxLength={10}
              />
              <Button
                onClick={handleCreateCustomRoom}
                disabled={isCreating}
                variant="default"
                size="sm"
                className="glow-button"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomKey(false)
                  setCustomRoomKey('')
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowCustomKey(true)}
              variant="outline"
              size="sm"
              className="glow-button"
            >
              <Key className="h-4 w-4 mr-2" />
              Custom Key
            </Button>
          )}
          
          <Button
            onClick={() => handleCreateRoom()}
            disabled={isCreating}
            variant="default"
            size="sm"
            className="glow-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'New Room'}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            title="Home"
          >
            <Home className="h-4 w-4" />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
