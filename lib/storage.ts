import { Room, NoteItem } from './types'

// Server-side database functions
let pool: any = null

async function getPool() {
  if (typeof window !== 'undefined') {
    throw new Error('Database queries can only be run on the server')
  }
  
  if (!pool) {
    const { Pool } = await import('pg')
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle client', err)
    })
  }
  
  return pool
}

async function query(text: string, params?: any[]): Promise<any> {
  const pool = await getPool()
  const start = Date.now()
  
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error', { text, error })
    throw error
  }
}

export class RoomStorage {
  static async createRoom(key: string, theme: 'dark' | 'light' = 'dark'): Promise<Room> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const result = await query(
      'INSERT INTO rooms (id, key, theme, expires_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [key, key, theme, expiresAt]
    )
    
    const roomData = result.rows[0]
    
    return {
      id: roomData.id,
      key: roomData.key,
      name: roomData.name,
      items: [],
      createdAt: new Date(roomData.created_at),
      expiresAt: new Date(roomData.expires_at),
      theme: roomData.theme
    }
  }

  static async getRoom(key: string): Promise<Room | null> {
    const result = await query(
      'SELECT * FROM rooms WHERE key = $1 AND expires_at > NOW()',
      [key]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const roomData = result.rows[0]
    
    // Get items for this room
    const itemsResult = await query(
      'SELECT * FROM items WHERE room_key = $1 ORDER BY created_at ASC',
      [key]
    )
    
    const items: NoteItem[] = itemsResult.rows.map((item: any) => ({
      id: item.id,
      type: item.type,
      content: item.content,
      filename: item.filename,
      language: item.language,
      size: item.size,
      position: {
        x: item.position_x,
        y: item.position_y
      },
      dimensions: {
        width: item.width,
        height: item.height
      },
      createdAt: new Date(item.created_at)
    }))
    
    return {
      id: roomData.id,
      key: roomData.key,
      name: roomData.name,
      items,
      createdAt: new Date(roomData.created_at),
      expiresAt: new Date(roomData.expires_at),
      theme: roomData.theme
    }
  }

  static async updateRoom(key: string, updates: Partial<Room>): Promise<Room | null> {
    const setClause = []
    const values = []
    let paramCount = 1
    
    if (updates.name !== undefined) {
      setClause.push(`name = $${paramCount++}`)
      values.push(updates.name)
    }
    
    if (updates.theme !== undefined) {
      setClause.push(`theme = $${paramCount++}`)
      values.push(updates.theme)
    }
    
    if (setClause.length === 0) {
      return await this.getRoom(key)
    }
    
    values.push(key)
    
    const result = await query(
      `UPDATE rooms SET ${setClause.join(', ')} WHERE key = $${paramCount} RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    return await this.getRoom(key)
  }

  static async addItem(roomKey: string, item: Omit<NoteItem, 'id' | 'createdAt'>): Promise<NoteItem | null> {
    const itemId = Math.random().toString(36).substr(2, 9)
    
    const result = await query(
      `INSERT INTO items (
        id, room_key, type, content, filename, language, size,
        position_x, position_y, width, height
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        itemId,
        roomKey,
        item.type,
        item.content,
        item.filename || null,
        item.language || null,
        item.size || null,
        Math.round(item.position.x),
        Math.round(item.position.y),
        Math.round(item.dimensions.width),
        Math.round(item.dimensions.height)
      ]
    )
    
    const itemData = result.rows[0]
    
    return {
      id: itemData.id,
      type: itemData.type,
      content: itemData.content,
      filename: itemData.filename,
      language: itemData.language,
      size: itemData.size,
      position: {
        x: itemData.position_x,
        y: itemData.position_y
      },
      dimensions: {
        width: itemData.width,
        height: itemData.height
      },
      createdAt: new Date(itemData.created_at)
    }
  }

  static async updateItem(roomKey: string, itemId: string, updates: Partial<NoteItem>): Promise<NoteItem | null> {
    const setClause = []
    const values = []
    let paramCount = 1
    
    if (updates.type !== undefined) {
      setClause.push(`type = $${paramCount++}`)
      values.push(updates.type)
    }
    
    if (updates.content !== undefined) {
      setClause.push(`content = $${paramCount++}`)
      values.push(updates.content)
    }
    
    if (updates.filename !== undefined) {
      setClause.push(`filename = $${paramCount++}`)
      values.push(updates.filename)
    }
    
    if (updates.language !== undefined) {
      setClause.push(`language = $${paramCount++}`)
      values.push(updates.language)
    }
    
    if (updates.size !== undefined) {
      setClause.push(`size = $${paramCount++}`)
      values.push(updates.size)
    }
    
    if (updates.position !== undefined) {
      setClause.push(`position_x = $${paramCount++}`)
      values.push(Math.round(updates.position.x))
      setClause.push(`position_y = $${paramCount++}`)
      values.push(Math.round(updates.position.y))
    }
    
    if (updates.dimensions !== undefined) {
      setClause.push(`width = $${paramCount++}`)
      values.push(Math.round(updates.dimensions.width))
      setClause.push(`height = $${paramCount++}`)
      values.push(Math.round(updates.dimensions.height))
    }
    
    if (setClause.length === 0) {
      return null
    }
    
    values.push(itemId, roomKey)
    
    const result = await query(
      `UPDATE items SET ${setClause.join(', ')} WHERE id = $${paramCount} AND room_key = $${paramCount + 1} RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const itemData = result.rows[0]
    
    return {
      id: itemData.id,
      type: itemData.type,
      content: itemData.content,
      filename: itemData.filename,
      language: itemData.language,
      size: itemData.size,
      position: {
        x: itemData.position_x,
        y: itemData.position_y
      },
      dimensions: {
        width: itemData.width,
        height: itemData.height
      },
      createdAt: new Date(itemData.created_at)
    }
  }

  static async removeItem(roomKey: string, itemId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM items WHERE id = $1 AND room_key = $2',
      [itemId, roomKey]
    )
    
    return result.rowCount > 0
  }

  static async clearRoom(roomKey: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM items WHERE room_key = $1',
      [roomKey]
    )
    
    return true // Always return true, even if no items were deleted
  }

  static async deleteRoom(roomKey: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM rooms WHERE key = $1',
      [roomKey]
    )
    
    return result.rowCount > 0
  }

  // Cleanup expired rooms
  static async cleanupExpiredRooms(): Promise<number> {
    const result = await query(
      'DELETE FROM rooms WHERE expires_at <= NOW()'
    )
    
    return result.rowCount || 0
  }

  // Get room statistics
  static async getStats(): Promise<{ totalRooms: number; totalItems: number }> {
    const roomsResult = await query('SELECT COUNT(*) as count FROM rooms WHERE expires_at > NOW()')
    const itemsResult = await query('SELECT COUNT(*) as count FROM items i JOIN rooms r ON i.room_key = r.key WHERE r.expires_at > NOW()')
    
    return {
      totalRooms: parseInt(roomsResult.rows[0].count),
      totalItems: parseInt(itemsResult.rows[0].count)
    }
  }
}
