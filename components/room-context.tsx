'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { Room, NoteItem, RoomContextType } from '@/lib/types'
import { toast } from '@/lib/toast'
import { v4 as uuidv4 } from 'uuid'

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export function RoomProvider({ children, roomKey }: { children: React.ReactNode; roomKey?: string }) {
  const [room, setRoomState] = useState<Room | null>(null)
  
  // Local cache for fast pasting
  const localItemsRef = useRef<Map<string, NoteItem>>(new Map())
  const syncTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const batchSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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

  // Optimized addItem with local cache
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

    // Schedule database sync after 10-15 seconds
    const syncTimeout = setTimeout(() => {
      syncItemToDatabase(localId, localItem)
    }, 12000 + Math.random() * 3000) // Random delay between 12-15 seconds

    syncTimeoutsRef.current.set(localId, syncTimeout)
    pendingSyncItemsRef.current.add(localId)

    // Show immediate feedback
    toast.success('Item added (syncing...)')
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

  // Optimized updateItem with local cache
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

    // For database items, debounce the update
    const existingTimeout = syncTimeoutsRef.current.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const updateTimeout = setTimeout(async () => {
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
            items: prev.items.map(item => 
              item.id === id ? { ...data.item, pendingSync: false } : item
            )
          } : null)
        } else {
          console.error('Failed to update item:', data.error)
          // Revert optimistic update on failure
          setRoomState(prev => prev ? {
            ...prev,
            items: prev.items.map(item => 
              item.id === id ? { ...item, pendingSync: false } : item
            )
          } : null)
        }
      } catch (error) {
        console.error('Error updating item:', error)
        // Revert optimistic update on failure
        setRoomState(prev => prev ? {
          ...prev,
          items: prev.items.map(item => 
            item.id === id ? { ...item, pendingSync: false } : item
          )
        } : null)
      } finally {
        syncTimeoutsRef.current.delete(id)
      }
    }, 2000) // 2 second debounce

    syncTimeoutsRef.current.set(id, updateTimeout)
  }, [room])

  // Optimized removeItem with local cache
  const removeItem = useCallback((id: string) => {
    if (!room) return

    // Check if it's a local item
    const item = room.items.find(item => item.id === id)
    if (item?.isLocal) {
      // Remove from local cache immediately
      localItemsRef.current.delete(item.localId!)
      pendingSyncItemsRef.current.delete(item.localId!)
      
      // Clear any pending sync timeout
      const timeout = syncTimeoutsRef.current.get(item.localId!)
      if (timeout) {
        clearTimeout(timeout)
        syncTimeoutsRef.current.delete(item.localId!)
      }
      
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

    // Then sync to database
    fetch(`/api/rooms/${room.key}/items/${id}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        toast.success('Item removed successfully')
      } else {
        // Revert on failure
        setRoomState(prev => prev ? {
          ...prev,
          items: [...prev.items, item!]
        } : null)
        toast.error(data.error || 'Failed to remove item')
      }
    })
    .catch(error => {
      console.error('Error removing item:', error)
      // Revert on failure
      setRoomState(prev => prev ? {
        ...prev,
        items: [...prev.items, item!]
      } : null)
      toast.error('Failed to remove item')
    })
  }, [room])

  const clearRoom = async () => {
    if (!room) return

    // Clear all local cache
    localItemsRef.current.clear()
    pendingSyncItemsRef.current.clear()
    
    // Clear all timeouts
    syncTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    syncTimeoutsRef.current.clear()
    
    if (batchSyncTimeoutRef.current) {
      clearTimeout(batchSyncTimeoutRef.current)
      batchSyncTimeoutRef.current = null
    }

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

  // Batch sync function for better performance
  const batchSyncItems = useCallback(async () => {
    if (!room || pendingSyncItemsRef.current.size === 0) return

    const itemsToSync = Array.from(pendingSyncItemsRef.current)
      .map(localId => localItemsRef.current.get(localId))
      .filter((item): item is NoteItem => item !== undefined)

    if (itemsToSync.length === 0) return

    try {
      // Remove local flags for batch sync
      const itemsForSync = itemsToSync.map(({ isLocal, pendingSync, localId, ...item }) => item)
      
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
            const localIndex = itemsToSync.findIndex(localItem => localItem.localId === item.localId)
            if (localIndex !== -1) {
              return { ...data.items[localIndex], isLocal: false, pendingSync: false }
            }
            return item
          })
        } : null)

        // Clean up local cache
        itemsToSync.forEach(item => {
          localItemsRef.current.delete(item.localId!)
          pendingSyncItemsRef.current.delete(item.localId!)
        })
        
        console.log(`Batch synced ${data.count} items to database`)
      } else {
        console.error('Failed to batch sync items:', data.error)
        // Mark items as failed sync
        setRoomState(prev => prev ? {
          ...prev,
          items: prev.items.map(item => 
            itemsToSync.some(localItem => localItem.localId === item.localId) 
              ? { ...item, pendingSync: false } 
              : item
          )
        } : null)
      }
    } catch (error) {
      console.error('Error batch syncing items:', error)
      // Mark items as failed sync
      setRoomState(prev => prev ? {
        ...prev,
        items: prev.items.map(item => 
          itemsToSync.some(localItem => localItem.localId === item.localId) 
            ? { ...item, pendingSync: false } 
            : item
        )
      } : null)
    }
  }, [room])

  // Schedule batch sync every 20 seconds
  useEffect(() => {
    if (!room) return

    const batchSyncInterval = setInterval(() => {
      if (pendingSyncItemsRef.current.size > 0) {
        batchSyncItems()
      }
    }, 20000) // 20 seconds

    return () => clearInterval(batchSyncInterval)
  }, [room, batchSyncItems])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      syncTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      if (batchSyncTimeoutRef.current) {
        clearTimeout(batchSyncTimeoutRef.current)
      }
    }
  }, [])

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
