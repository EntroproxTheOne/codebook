import { NextRequest, NextResponse } from 'next/server'
import { RoomStorage } from '@/lib/storage'
import { generateRoomKey, validateRoomKey } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { theme = 'dark', customKey } = await request.json()
    
    let roomKey: string
    
    if (customKey) {
      // Validate custom key
      if (!validateRoomKey(customKey)) {
        return NextResponse.json(
          { success: false, error: 'Invalid custom room key format' },
          { status: 400 }
        )
      }
      
      // Check if room already exists
      const existingRoom = await RoomStorage.getRoom(customKey.toUpperCase())
      if (existingRoom) {
        return NextResponse.json(
          { success: false, error: 'Room key already exists' },
          { status: 409 }
        )
      }
      
      roomKey = customKey.toUpperCase()
    } else {
      roomKey = generateRoomKey()
    }
    
    const room = await RoomStorage.createRoom(roomKey, theme)
    
    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        key: room.key,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        theme: room.theme,
        items: room.items
      }
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create room' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Room key is required' },
        { status: 400 }
      )
    }
    
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
      room: {
        id: room.id,
        key: room.key,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        theme: room.theme,
        items: room.items
      }
    })
  } catch (error) {
    console.error('Error getting room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get room' },
      { status: 500 }
    )
  }
}
