// Simple toast implementation to replace react-hot-toast
interface ToastOptions {
  duration?: number
}

class ToastManager {
  private container: HTMLElement | null = null

  private createContainer() {
    if (this.container) return this.container

    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(this.container)
    return this.container
  }

  private show(message: string, type: 'success' | 'error' | 'info', options: ToastOptions = {}) {
    const container = this.createContainer()
    const toast = document.createElement('div')
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6'
    }

    toast.style.cssText = `
      background: var(--bg-secondary, #1f2937);
      color: var(--text, #f9fafb);
      border: 1px solid var(--border, #374151);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
      border-left: 4px solid ${colors[type]};
    `

    toast.textContent = message
    container.appendChild(toast)

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
    }, 10)

    // Auto remove
    const duration = options.duration || 3000
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, duration)
  }

  success(message: string, options?: ToastOptions) {
    this.show(message, 'success', options)
  }

  error(message: string, options?: ToastOptions) {
    this.show(message, 'error', options)
  }

  info(message: string, options?: ToastOptions) {
    this.show(message, 'info', options)
  }
}

export const toast = new ToastManager()
