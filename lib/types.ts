export interface NoteItem {
  id: string
  type: 'text' | 'code' | 'image' | 'file'
  content: string
  filename?: string
  language?: string
  size?: number
  createdAt: Date | string
  position: {
    x: number
    y: number
  }
  dimensions: {
    width: number
    height: number
  }
}

export interface Room {
  id: string
  key: string
  name?: string
  items: NoteItem[]
  createdAt: Date | string
  expiresAt: Date | string
  theme: 'dark' | 'light'
}

export interface ThemeContextType {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export interface RoomContextType {
  room: Room | null
  setRoom: (room: Room | null) => void
  addItem: (item: Omit<NoteItem, 'id' | 'createdAt'>) => void
  updateItem: (id: string, updates: Partial<NoteItem>) => void
  removeItem: (id: string) => void
  clearRoom: () => void
}
