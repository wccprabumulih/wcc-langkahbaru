import { useEffect } from 'react'
import CustomCursor from '../components/CustomCursor'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import About from '../components/About'
import Services from '../components/Services'
import Process from '../components/Process'
import Gallery from '../components/Gallery'
import Testimonials from '../components/Testimonials'
import Partners from '../components/Partners'
import Booking from '../components/Booking'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'

export default function Home() {
  useEffect(() => {
    // Scroll reveal observer
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .process-step')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0
          setTimeout(() => el.classList.add('visible'), delay)
          observer.unobserve(el)
        }
      })
    }, { threshold: 0.15 })

    els.forEach((el, i) => {
      if (el.classList.contains('process-step')) {
        (el as HTMLElement).dataset.delay = String(i * 150)
      }
      observer.observe(el)
    })

    // Re-run for dynamically-added elements after a short delay
    const timer = setTimeout(() => {
      const newEls = document.querySelectorAll('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible), .process-step:not(.visible)')
      newEls.forEach((el, i) => {
        if (el.classList.contains('process-step')) {
          (el as HTMLElement).dataset.delay = String(i * 150)
        }
        observer.observe(el)
      })
    }, 300)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <About />
        <Services />
        <Process />
        <Gallery />
        <Testimonials />
        <Partners />
        <Booking />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
