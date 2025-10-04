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
    const itemData = await request.json()
    
    if (!validateRoomKey(key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room key format' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!itemData.type || !itemData.content) {
      return NextResponse.json(
        { success: false, error: 'Type and content are required' },
        { status: 400 }
      )
    }
    
    const item = await RoomStorage.addItem(key.toUpperCase(), itemData)
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Room not found or expired' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error('Error adding item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add item' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params
    
    if (!validateRoomKey(key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room key format' },
        { status: 400 }
      )
    }
    
    const room = await RoomStorage.getRoom(key.toUpperCase())
    
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found or expired' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      items: room.items
    })
  } catch (error) {
    console.error('Error getting items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get items' },
      { status: 500 }
    )
  }
}
