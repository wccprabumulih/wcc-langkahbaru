export interface Order {
  id: number
  nama: string
  whatsapp: string
  tanggal: string
  lokasi: string
  paket: string
  catatan: string
  status: string
  created_at: string
}

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

export const paketLabel: Record<string, string> = { silver: 'Silver', gold: 'Gold', premium: 'Premium' }
export const paketClass: Record<string, string> = { silver: 'pkg-silver', gold: 'pkg-gold', premium: 'pkg-premium' }

const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

export function formatDate(s: string) {
  if (!s) return '-'
  const d = new Date(s)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(s: string) {
  if (!s) return '-'
  const d = new Date(s)
  return `${formatDate(s)} ${d.toTimeString().slice(0, 5)}`
}
