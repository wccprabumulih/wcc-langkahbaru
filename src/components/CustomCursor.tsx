import { useEffect, useRef } from 'react'

interface Props {
  disabled?: boolean
}

export default function CustomCursor({ disabled = false }: Props) {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  // Use a ref so event listeners always read the latest value without stale closures
  const disabledRef = useRef(disabled)

  useEffect(() => {
    disabledRef.current = disabled
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return
    if (disabled) {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }
    // CSS handles cursor:none globally; admin layout restores it via CSS too
  }, [disabled])

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = 0, mouseY = 0
    let ringX = 0, ringY = 0
    let visible = false
    let animId: number

    const show = () => {
      if (disabledRef.current) return
      if (!visible) {
        visible = true
        dot.style.opacity = '1'
        ring.style.opacity = ring.classList.contains('hovered') ? '0.6' : '1'
      }
    }

    const hide = () => {
      visible = false
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }

    const onMove = (e: MouseEvent) => {
      if (disabledRef.current) return
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.left = mouseX + 'px'
      dot.style.top = mouseY + 'px'
      show()
    }

    const onLeave = () => hide()
    const onEnter = () => { if (!disabledRef.current) show() }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      ring.style.left = ringX + 'px'
      ring.style.top = ringY + 'px'
      animId = requestAnimationFrame(animate)
    }
    animate()

    document.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)

    const addHoverListeners = () => {
      document.querySelectorAll('a, button, .service-card, .gallery-item, .testi-card, input, select, textarea, label[for]').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovered'))
        el.addEventListener('mouseleave', () => ring.classList.remove('hovered'))
      })
    }

    addHoverListeners()
    const observer = new MutationObserver(addHoverListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(animId)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="cursor">
      <div className="cursor-dot" ref={dotRef} style={{ opacity: 0 }} />
      <div className="cursor-ring" ref={ringRef} style={{ opacity: 0 }} />
    </div>
  )
}
