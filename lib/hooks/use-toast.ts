import toast from 'react-hot-toast'

export interface Toast {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  return {
    toast: ({ title, description, variant }: Toast) => {
      const message = description || title || ''

      if (variant === 'destructive') {
        toast.error(message)
      } else {
        toast.success(message)
      }
    }
  }
}
