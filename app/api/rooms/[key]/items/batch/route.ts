import { NextRequest, NextResponse } from 'next/server'
import { RoomStorage } from '@/lib/storage'
import { validateRoomKey } from '@/lib/utils'
import { NoteItem } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params
    const { items } = await request.json()
    
    if (!validateRoomKey(key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room key format' },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      )
    }
    
    // Validate all items
    for (const item of items) {
      if (!item.type || !item.content) {
        return NextResponse.json(
          { success: false, error: 'Type and content are required for all items' },
          { status: 400 }
        )
      }
    }
    
    const addedItems: NoteItem[] = []
    
    // Add items one by one (could be optimized to batch insert in the future)
    for (const itemData of items) {
      const item = await RoomStorage.addItem(key.toUpperCase(), itemData)
      if (item) {
        addedItems.push(item)
      }
    }
    
    if (addedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Room not found or expired' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      items: addedItems,
      count: addedItems.length
    })
  } catch (error) {
    console.error('Error adding batch items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add items' },
      { status: 500 }
    )
  }
}
