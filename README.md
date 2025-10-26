# "codebook"

![Logo](logo.png)

A modern, collaborative note-taking application with a VIM-inspired dark theme and canvas-based workspace.

## Features

- **Room-based Collaboration**: Share notes using 10-digit room keys (no login required)
- **Canvas Workspace**: Drag and drop items anywhere on an infinite canvas
- **Multiple Content Types**: 
  - Text blocks with auto-resize
  - Code blocks with syntax highlighting
  - Image support (PNG, JPG, JPEG, WebP, SVG, DNG, etc.)
- **Smart Paste Detection**: 
  - Images from URLs are automatically detected
  - Code blocks created with `<code>` HTML tags
  - Randomized positioning for pasted content
- **24-hour Auto-cleanup**: Rooms automatically expire after 24 hours
- **Dual Themes**: Dark (VIM-inspired) and light themes
- **Real-time Updates**: Changes sync across all users in the same room
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with custom CSS variables
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Code Highlighting**: React Syntax Highlighter

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon account)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd note-taking-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your database credentials:
```
DATABASE_URL=your_postgresql_connection_string
DB_POOL_MIN=2
DB_POOL_MAX=10
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Room

1. Visit the homepage
2. Click "Create Room" for a random room key, or
3. Enter a custom 10-character alphanumeric key and click "Create Custom Room"

### Adding Content

- **Text**: Click anywhere on the canvas to create a text block
- **Code**: Use the "+" button and select "Code Block"
- **Images**: Use the "+" button and select "Image", then paste an image URL
- **Paste**: Paste content directly - images and code will be auto-detected

### Sharing

Share the room URL with others. Anyone with the room key can view and edit the content.

## API Endpoints

- `POST /api/rooms` - Create a new room
- `GET /api/rooms/[key]` - Get room data
- `POST /api/rooms/[key]/items` - Add item to room
- `PUT /api/rooms/[key]/items/[itemId]` - Update item
- `DELETE /api/rooms/[key]/items/[itemId]` - Remove item
- `POST /api/rooms/[key]/clear` - Clear all items
- `POST /api/cleanup` - Manual cleanup of expired rooms

## Database Schema

### Rooms Table
- `id` - Primary key
- `key` - 10-character room identifier
- `created_at` - Creation timestamp
- `expires_at` - Expiration timestamp (24 hours)

### Items Table
- `id` - Primary key
- `room_key` - Foreign key to rooms
- `type` - Item type (text, code, image)
- `content` - Item content
- `filename` - Original filename (for images)
- `language` - Programming language (for code)
- `size` - File size
- `position_x`, `position_y` - Canvas position
- `width`, `height` - Item dimensions
- `created_at`, `updated_at` - Timestamps

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `DB_POOL_MIN` - Minimum database connections (default: 2)
- `DB_POOL_MAX` - Maximum database connections (default: 10)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Notion and OneNote
- VIM color scheme for the dark theme
- Built with modern web technologies
