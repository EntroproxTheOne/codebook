'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { RoomInfo } from '@/components/room-info'
import { Canvas } from '@/components/canvas'
import { RoomProvider } from '@/components/room-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Home } from 'lucide-react'
import { validateRoomKey } from '@/lib/utils'
import { Room } from '@/lib/types'
import { toast } from '@/lib/toast'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const roomKey = params.key as string

  useEffect(() => {
    if (!roomKey || !validateRoomKey(roomKey)) {
      setError('Invalid room key format')
      setLoading(false)
      return
    }

    loadRoom()
  }, [roomKey])

  const loadRoom = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/rooms/${roomKey}`)
      const data = await response.json()

      if (!data.success) {
        if (response.status === 404) {
          setError('Room not found or expired')
        } else {
          setError(data.error || 'Failed to load room')
        }
        return
      }

      setRoom(data.room)
    } catch (error) {
      console.error('Error loading room:', error)
      setError('Failed to load room')
    } finally {
      setLoading(false)
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Loading room...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-hacker-error mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Room Error</h2>
              <p className="text-hacker-text-secondary mb-4">{error}</p>
              <Button onClick={handleGoHome} variant="default" className="glow-button">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-hacker-text-secondary">Room not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RoomProvider roomKey={roomKey}>
      <div className="h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col container mx-auto px-4 py-4">
          <RoomInfo />
          <Canvas />
        </div>
      </div>
    </RoomProvider>
  )
}
