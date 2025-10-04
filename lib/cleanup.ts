import { RoomStorage } from './storage'

export class CleanupService {
  private static instance: CleanupService
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService()
    }
    return CleanupService.instance
  }

  start(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('Cleanup service is already running')
      return
    }

    console.log(`Starting cleanup service with ${intervalMinutes} minute intervals`)
    
    // Run cleanup immediately
    this.runCleanup()
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.runCleanup()
    }, intervalMinutes * 60 * 1000)

    this.isRunning = true
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Cleanup service stopped')
  }

  private async runCleanup(): Promise<void> {
    try {
      console.log('Running cleanup of expired rooms...')
      const cleanedCount = await RoomStorage.cleanupExpiredRooms()
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired rooms`)
      } else {
        console.log('No expired rooms to clean up')
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  async getStats(): Promise<{ totalRooms: number; totalItems: number }> {
    return await RoomStorage.getStats()
  }

  isActive(): boolean {
    return this.isRunning
  }
}

// Initialize cleanup service
const cleanupService = CleanupService.getInstance()

// Start cleanup service in production
if (process.env.NODE_ENV === 'production') {
  cleanupService.start(60) // Run every hour
}

export { cleanupService }
