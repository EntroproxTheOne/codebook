'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Clock, Users, Trash2, Share2 } from 'lucide-react'
import { useRoom } from '@/components/room-context'
import { getTimeRemaining } from '@/lib/utils'
import { toast } from '@/lib/toast'

export function RoomInfo() {
  const { room, clearRoom } = useRoom()
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!room) return

    const updateTime = () => {
      setTimeRemaining(getTimeRemaining(room.createdAt))
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [room])

  const copyRoomKey = async () => {
    if (!room) return

    try {
      await navigator.clipboard.writeText(room.key)
      setIsCopied(true)
      toast.success('Room key copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy room key')
    }
  }

  const shareRoom = async () => {
    if (!room) return

    const url = `${window.location.origin}/room/${room.key}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CodeNote Room: ${room.key}`,
          text: 'Join my note-taking room',
          url: url
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyRoomKey()
    }
  }

  const handleClearRoom = () => {
    if (window.confirm('Are you sure you want to clear all items in this room?')) {
      clearRoom()
    }
  }

  if (!room) return null

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[var(--success)] animate-pulse"></div>
              <span className="font-mono text-sm text-[var(--text-secondary)]">
                Room Active
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="font-mono text-sm text-[var(--text-secondary)]">
                {timeRemaining}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="font-mono text-sm text-[var(--text-secondary)]">
                {room.items.length} items
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyRoomKey}
              className="glow-button"
            >
              <Copy className="h-4 w-4 mr-2" />
              {isCopied ? 'Copied!' : room.key}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shareRoom}
              className="glow-button"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRoom}
              className="glow-button text-[var(--error)] hover:text-[var(--error)]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
