export function formatCurrency(value) {
  const num = Number(value) || 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

export function formatDate(date, opts = {}) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', ...opts
  }).format(new Date(date))
}

export function formatDateTime(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export function formatDocument(doc) {
  if (!doc) return '—'
  const d = doc.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

export function formatPhone(phone) {
  if (!phone) return '—'
  const p = phone.replace(/\D/g, '')
  if (p.length === 11) return p.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (p.length === 10) return p.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return phone
}

export function formatPlate(plate) {
  if (!plate) return '—'
  return plate.toUpperCase()
}

export function truncate(str, max = 30) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function relativeTime(date) {
  if (!date) return '—'
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return formatDate(date)
}
