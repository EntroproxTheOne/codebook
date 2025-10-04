import { NextRequest, NextResponse } from 'next/server'
import { RoomStorage } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (in production, use proper auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CLEANUP_SECRET || 'cleanup-secret'}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const cleanedCount = await RoomStorage.cleanupExpiredRooms()
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired rooms`,
      cleanedCount
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup expired rooms' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await RoomStorage.getStats()
    
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
