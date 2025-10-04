'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Terminal, 
  Key, 
  Clock, 
  Users, 
  Code, 
  Type, 
  Image, 
  File,
  ArrowRight,
  Zap,
  Shield,
  Globe
} from 'lucide-react'
import { generateRoomKey, validateRoomKey } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function HomePage() {
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Terminal className="h-16 w-16 text-[var(--accent)] mr-4" />
            <h1 className="text-5xl font-bold font-mono text-[var(--accent)]">
              CodeNote
            </h1>
          </div>
          <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            A hacker-style note-taking app with room keys. No login required. 
            Share your notes instantly with anyone using a 10-digit room key.
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-col gap-4 justify-center items-center mb-12">
            <div className="flex items-center space-x-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <Key className="h-5 w-5 text-[var(--accent)]" />
              <Input
                placeholder="Enter room key"
                value={roomKey}
                onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="w-48 font-mono text-center tracking-widest border-0 bg-transparent"
                maxLength={10}
              />
              <Button
                onClick={handleJoinRoom}
                variant="outline"
                size="sm"
                className="glow-button"
              >
                Join
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                onClick={() => handleCreateRoom()}
                disabled={isCreating}
                variant="default"
                size="lg"
                className="glow-button"
              >
                <Zap className="h-5 w-5 mr-2" />
                {isCreating ? 'Creating...' : 'Create Random Room'}
              </Button>
              
              {showCustomKey ? (
                <div className="flex items-center space-x-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
                  <Key className="h-5 w-5 text-[var(--accent)]" />
                  <Input
                    placeholder="Custom key (10 chars)"
                    value={customRoomKey}
                    onChange={(e) => setCustomRoomKey(e.target.value.toUpperCase())}
                    className="w-48 font-mono text-center tracking-widest border-0 bg-transparent"
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
                  size="lg"
                  className="glow-button"
                >
                  <Key className="h-5 w-5 mr-2" />
                  Create Custom Room
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-[var(--accent)]" />
                <CardTitle className="text-[var(--text)]">Room Keys</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[var(--text)]-secondary">
                Generate unique 10-digit room keys to share your notes. No accounts needed.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-[var(--accent)]" />
                <CardTitle className="text-[var(--text)]">24-Hour Limit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[var(--text)]-secondary">
                Rooms automatically expire after 24 hours to keep things clean and secure.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-[var(--accent)]" />
                <CardTitle className="text-[var(--text)]">Code Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[var(--text)]-secondary">
                Syntax highlighting for multiple programming languages with file detection.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Type className="h-5 w-5 text-[var(--accent)]" />
                <CardTitle className="text-[var(--text)]">Rich Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[var(--text)]-secondary">
                Support for text, code, images, and files. Drag and drop to organize.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-[var(--accent)]" />
                <CardTitle className="text-[var(--text)]">No Login</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[var(--text)]-secondary">
                Completely anonymous. No personal data collected or stored.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-[var(--accent)]" />
                <CardTitle className="text-[var(--text)]">Instant Sharing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[var(--text)]-secondary">
                Share your room key with anyone. They can view and edit immediately.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-mono text-[var(--accent)] mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--bg)]">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Room</h3>
              <p className="text-[var(--text)]-secondary">
                Click "Create New Room" to generate a unique 10-digit room key
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--bg)]">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Content</h3>
              <p className="text-[var(--text)]-secondary">
                Paste text, code, images, or files. Organize with drag and drop
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--bg)]">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Share & Collaborate</h3>
              <p className="text-[var(--text)]-secondary">
                Share your room key with others. They can view and edit instantly
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button
            onClick={() => handleCreateRoom()}
            disabled={isCreating}
            variant="default"
            size="lg"
            className="glow-button text-lg px-8 py-4"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  )
}
