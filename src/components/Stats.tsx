import { useEffect, useRef } from 'react'

const stats = [
  { target: 50, suffix: '+', label: 'Klien Puas' },
  { target: 100, suffix: '%', label: 'Kepuasan Klien' },
  { target: 24, suffix: 'jam', label: 'Editing Story' },
  { target: 3, suffix: '', label: 'Pilihan Paket' },
]

function easeOut(t: number) { return 1 - Math.pow(1 - t, 4) }

export default function Stats() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLDivElement
        const target = parseFloat(el.dataset.target || '0')
        const suffix = el.dataset.suffix || ''
        const duration = 1800
        const start = performance.now()
        const tick = (now: number) => {
          const elapsed = Math.min(now - start, duration)
          const progress = easeOut(elapsed / duration)
          const val = target < 10 ? (progress * target).toFixed(1) : Math.round(progress * target)
          el.textContent = val + suffix
          if (elapsed < duration) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.unobserve(el)
      })
    }, { threshold: 0.5 })

    refs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="stats">
      <div className="container">
        {stats.map((s, i) => (
          <div key={i} className="stat-item reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
            <div
              className="stat-number"
              data-target={s.target}
              data-suffix={s.suffix}
              ref={el => { refs.current[i] = el }}
            >
              0{s.suffix}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
