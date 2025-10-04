import { NextRequest, NextResponse } from 'next/server'
import { RoomStorage } from '@/lib/storage'
import { validateRoomKey } from '@/lib/utils'

export async function POST(
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
    
    const success = await RoomStorage.clearRoom(key.toUpperCase())
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Room cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear room' },
      { status: 500 }
    )
  }
}
