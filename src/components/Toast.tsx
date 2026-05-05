import { useEffect, useRef } from 'react'

export interface ToastData {
  type: 'success' | 'error'
  title: string
  msg: string
}

interface Props {
  toast: ToastData | null
  onClose: () => void
}

export default function Toast({ toast, onClose }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!toast) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(onClose, 4000)
    return () => clearTimeout(timerRef.current)
  }, [toast, onClose])

  return (
    <div className={`toast ${toast ? toast.type + ' show' : ''}`}>
      <div className="toast-icon">{toast?.type === 'success' ? '✅' : '❌'}</div>
      <div className="toast-msg">
        <strong>{toast?.title}</strong>
        {toast?.msg}
      </div>
    </div>
  )
}
