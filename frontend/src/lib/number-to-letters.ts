const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
]
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante']

function lt100(n: number): string {
  if (n < 20) return UNITS[n]
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10
    if (u === 0) return TENS[t]
    if (u === 1) return `${TENS[t]} et un`
    return `${TENS[t]}-${UNITS[u]}`
  }
  if (n < 80) {
    const r = n - 60
    if (r === 11) return 'soixante et onze'
    return `soixante-${UNITS[r]}`
  }
  if (n === 80) return 'quatre-vingts'
  return `quatre-vingt-${UNITS[n - 80]}`
}

function lt1000(n: number): string {
  if (n < 100) return lt100(n)
  const h = Math.floor(n / 100), r = n % 100
  let s = h === 1 ? 'cent' : r === 0 ? `${UNITS[h]} cents` : `${UNITS[h]} cent`
  if (r > 0) s += ` ${lt100(r)}`
  return s
}

function lt1M(n: number): string {
  if (n < 1000) return lt1000(n)
  const t = Math.floor(n / 1000), r = n % 1000
  let s = t === 1 ? 'mille' : `${lt1000(t)} mille`
  if (r > 0) s += ` ${lt1000(r)}`
  return s
}

export function numberToLetters(n: number): string {
  if (n === 0) return 'zero'
  if (n < 0) return `moins ${numberToLetters(-n)}`
  n = Math.floor(n)
  if (n < 1000000) return lt1M(n)
  const m = Math.floor(n / 1000000), r = n % 1000000
  let s = m === 1 ? 'un million' : `${lt1000(m)} millions`
  if (r > 0) s += ` ${lt1M(r)}`
  return s
}
