import { NextRequest, NextResponse } from 'next/server'
import { RoomStorage } from '@/lib/storage'
import { validateRoomKey } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string; itemId: string } }
) {
  try {
    const { key, itemId } = params
    const updates = await request.json()
    
    if (!validateRoomKey(key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room key format' },
        { status: 400 }
      )
    }
    
    const item = await RoomStorage.updateItem(key.toUpperCase(), itemId, updates)
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string; itemId: string } }
) {
  try {
    const { key, itemId } = params
    
    if (!validateRoomKey(key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room key format' },
        { status: 400 }
      )
    }
    
    const success = await RoomStorage.removeItem(key.toUpperCase(), itemId)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
