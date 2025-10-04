import { NextRequest, NextResponse } from 'next/server'
import { RoomStorage } from '@/lib/storage'
import { validateRoomKey } from '@/lib/utils'

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params
    const updates = await request.json()
    
    if (!validateRoomKey(key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room key format' },
        { status: 400 }
      )
    }
    
    const room = await RoomStorage.updateRoom(key.toUpperCase(), updates)
    
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
    console.error('Error updating room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    const success = await RoomStorage.deleteRoom(key.toUpperCase())
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete room' },
      { status: 500 }
    )
  }
}
