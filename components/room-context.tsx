'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { Room, NoteItem, RoomContextType } from '@/lib/types'
import { toast } from '@/lib/toast'
import { v4 as uuidv4 } from 'uuid'

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export function RoomProvider({ children, roomKey }: { children: React.ReactNode; roomKey?: string }) {
  const [room, setRoomState] = useState<Room | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Local cache for fast pasting
  const localItemsRef = useRef<Map<string, NoteItem>>(new Map())
  const pendingSyncItemsRef = useRef<Set<string>>(new Set())

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

  // Optimized addItem with local cache (no auto-sync)
  const addItem = useCallback((item: Omit<NoteItem, 'id' | 'createdAt'>) => {
    if (!room) {
      console.error('No room available for adding item')
      toast.error('No room available')
      return
    }

    // Generate local ID for immediate UI update
    const localId = uuidv4()
    const localItem: NoteItem = {
      ...item,
      id: localId,
      localId,
      isLocal: true,
      pendingSync: true,
      createdAt: new Date().toISOString()
    }

    // Add to local cache immediately
    localItemsRef.current.set(localId, localItem)
    
    // Update UI immediately with local item
    setRoomState(prev => prev ? { 
      ...prev, 
      items: [...prev.items, localItem] 
    } : null)

    // Add to pending sync list
    pendingSyncItemsRef.current.add(localId)

    // Show immediate feedback
    toast.success('Item added (pending sync)')
  }, [room])

  // Sync individual item to database
  const syncItemToDatabase = async (localId: string, localItem: NoteItem) => {
    if (!room) return

    try {
      // Remove local flags for database sync
      const { isLocal, pendingSync, localId: _, ...itemForSync } = localItem
      
      const response = await fetch(`/api/rooms/${room.key}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemForSync)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Replace local item with database item
        setRoomState(prev => prev ? {
          ...prev,
          items: prev.items.map(item => 
            item.localId === localId ? { ...data.item, isLocal: false, pendingSync: false } : item
          )
        } : null)

        // Clean up local cache
        localItemsRef.current.delete(localId)
        pendingSyncItemsRef.current.delete(localId)
        
        console.log('Item synced to database:', data.item.id)
      } else {
        console.error('Failed to sync item:', data.error)
        // Mark as failed sync, will retry later
        setRoomState(prev => prev ? {
          ...prev,
          items: prev.items.map(item => 
            item.localId === localId ? { ...item, pendingSync: false } : item
          )
        } : null)
      }
    } catch (error) {
      console.error('Error syncing item:', error)
      // Mark as failed sync
      setRoomState(prev => prev ? {
        ...prev,
        items: prev.items.map(item => 
          item.localId === localId ? { ...item, pendingSync: false } : item
        )
      } : null)
    } finally {
      // Clean up timeout
      const timeout = syncTimeoutsRef.current.get(localId)
      if (timeout) {
        clearTimeout(timeout)
        syncTimeoutsRef.current.delete(localId)
      }
    }
  }

  // Optimized updateItem with local cache (no auto-sync)
  const updateItem = useCallback((id: string, updates: Partial<NoteItem>) => {
    if (!room) return

    // Update UI immediately
    setRoomState(prev => prev ? {
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, ...updates, pendingSync: true } : item
      )
    } : null)

    // Check if it's a local item
    const item = room.items.find(item => item.id === id)
    if (item?.isLocal) {
      // Update local cache
      const localItem = localItemsRef.current.get(item.localId!)
      if (localItem) {
        localItemsRef.current.set(item.localId!, { ...localItem, ...updates })
      }
      return
    }

    // For database items, just mark as pending sync
    // No automatic sync - will be handled by manual sync
  }, [room])

  // Optimized removeItem with local cache (no auto-sync)
  const removeItem = useCallback((id: string) => {
    if (!room) return

    // Check if it's a local item
    const item = room.items.find(item => item.id === id)
    if (item?.isLocal) {
      // Remove from local cache immediately
      localItemsRef.current.delete(item.localId!)
      pendingSyncItemsRef.current.delete(item.localId!)
      
      // Remove from UI immediately
      setRoomState(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      } : null)
      
      toast.success('Item removed')
      return
    }

    // For database items, remove immediately from UI (optimistic)
    setRoomState(prev => prev ? {
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    } : null)

    // Mark for manual sync - don't sync immediately
    toast.success('Item removed (pending sync)')
  }, [room])

  const clearRoom = async () => {
    if (!room) return

    // Clear all local cache
    localItemsRef.current.clear()
    pendingSyncItemsRef.current.clear()

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

  // Manual sync function
  const syncToDatabase = useCallback(async () => {
    if (!room || isSyncing) return

    setIsSyncing(true)
    
    try {
      // Get all pending items (both local and updated database items)
      const pendingItems = room.items.filter(item => item.pendingSync || item.isLocal)
      
      if (pendingItems.length === 0) {
        toast.success('No items to sync')
        return
      }

      // Separate local items and updated database items
      const localItems = pendingItems.filter(item => item.isLocal)
      const updatedItems = pendingItems.filter(item => !item.isLocal)

      let syncedCount = 0

      // Sync new local items
      if (localItems.length > 0) {
        const itemsForSync = localItems.map(({ isLocal, pendingSync, localId, ...item }) => item)
        
        const response = await fetch(`/api/rooms/${room.key}/items/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: itemsForSync })
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Replace local items with database items
          setRoomState(prev => prev ? {
            ...prev,
            items: prev.items.map(item => {
              const localIndex = localItems.findIndex(localItem => localItem.localId === item.localId)
              if (localIndex !== -1) {
                return { ...data.items[localIndex], isLocal: false, pendingSync: false }
              }
              return item
            })
          } : null)

          // Clean up local cache
          localItems.forEach(item => {
            localItemsRef.current.delete(item.localId!)
            pendingSyncItemsRef.current.delete(item.localId!)
          })
          
          syncedCount += data.count
        } else {
          throw new Error(data.error || 'Failed to sync new items')
        }
      }

      // Sync updated database items
      for (const item of updatedItems) {
        try {
          const { isLocal, pendingSync, localId, ...itemForSync } = item
          
          const response = await fetch(`/api/rooms/${room.key}/items/${item.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemForSync)
          })
          
          const data = await response.json()
          
          if (data.success) {
            setRoomState(prev => prev ? {
              ...prev,
              items: prev.items.map(prevItem => 
                prevItem.id === item.id ? { ...data.item, pendingSync: false } : prevItem
              )
            } : null)
            syncedCount++
          } else {
            console.error(`Failed to sync item ${item.id}:`, data.error)
          }
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error)
        }
      }

      toast.success(`Synced ${syncedCount} items to database`)
      
    } catch (error) {
      console.error('Error syncing to database:', error)
      toast.error('Failed to sync to database')
    } finally {
      setIsSyncing(false)
    }
  }, [room, isSyncing])

  // Get pending items count
  const getPendingItemsCount = useCallback(() => {
    if (!room) return 0
    return room.items.filter(item => item.pendingSync || item.isLocal).length
  }, [room])

  const value: RoomContextType = {
    room,
    setRoom,
    addItem,
    updateItem,
    removeItem,
    clearRoom,
    syncToDatabase,
    isSyncing,
    getPendingItemsCount
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
