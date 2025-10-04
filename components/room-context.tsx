'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Room, NoteItem, RoomContextType } from '@/lib/types'
import { toast } from '@/lib/toast'

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export function RoomProvider({ children, roomKey }: { children: React.ReactNode; roomKey?: string }) {
  const [room, setRoomState] = useState<Room | null>(null)

  useEffect(() => {
    if (roomKey) {
      loadRoom(roomKey)
    }
  }, [roomKey])

  const loadRoom = async (key: string) => {
    try {
      const response = await fetch(`/api/rooms/${key}`)
      const data = await response.json()
      
      if (data.success) {
        setRoomState(data.room)
      } else {
        toast.error('Room not found or expired')
      }
    } catch (error) {
      console.error('Error loading room:', error)
      toast.error('Failed to load room')
    }
  }

  const setRoom = (newRoom: Room | null) => {
    setRoomState(newRoom)
  }

  const addItem = async (item: Omit<NoteItem, 'id' | 'createdAt'>) => {
    if (!room) {
      console.error('No room available for adding item')
      toast.error('No room available')
      return
    }

    try {
      console.log('Adding item to room:', room.key, item)
      const response = await fetch(`/api/rooms/${room.key}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      })
      
      const data = await response.json()
      console.log('Add item response:', data)
      
      if (data.success) {
        setRoomState(prev => prev ? { ...prev, items: [...prev.items, data.item] } : null)
        toast.success('Item added successfully')
      } else {
        console.error('Failed to add item:', data.error)
        toast.error(data.error || 'Failed to add item')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    }
  }

  const updateItem = async (id: string, updates: Partial<NoteItem>) => {
    if (!room) return

    try {
      const response = await fetch(`/api/rooms/${room.key}/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRoomState(prev => prev ? {
          ...prev,
          items: prev.items.map(item => item.id === id ? data.item : item)
        } : null)
        toast.success('Item updated successfully')
      } else {
        toast.error(data.error || 'Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    }
  }

  const removeItem = async (id: string) => {
    if (!room) return

    try {
      const response = await fetch(`/api/rooms/${room.key}/items/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRoomState(prev => prev ? {
          ...prev,
          items: prev.items.filter(item => item.id !== id)
        } : null)
        toast.success('Item removed successfully')
      } else {
        toast.error(data.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    }
  }

  const clearRoom = async () => {
    if (!room) return

    try {
      const response = await fetch(`/api/rooms/${room.key}/clear`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRoomState(prev => prev ? { ...prev, items: [] } : null)
        toast.success('Room cleared successfully')
      } else {
        toast.error(data.error || 'Failed to clear room')
      }
    } catch (error) {
      console.error('Error clearing room:', error)
      toast.error('Failed to clear room')
    }
  }

  const value: RoomContextType = {
    room,
    setRoom,
    addItem,
    updateItem,
    removeItem,
    clearRoom
  }

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const context = useContext(RoomContext)
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider')
  }
  return context
}
