/* ========= CONFIG ========= */

const KEY_STEPS = [
  { id: -7, label: 'Dó♭ Maior', accidental: '7 ♭', file: null },
  { id: -6, label: 'Sol♭ Maior', accidental: '6 ♭', file: null },
  { id: -5, label: 'Ré♭ Maior', accidental: '5 ♭', file: 'reb-maior.json' },
  { id: -4, label: 'Lá♭ Maior', accidental: '4 ♭', file: 'lab-maior.json' },
  { id: -3, label: 'Mi♭ Maior', accidental: '3 ♭', file: 'mib-maior.json' },
  { id: -2, label: 'Si♭ Maior', accidental: '2 ♭', file: 'sib-maior.json' },
  { id: -1, label: 'Fá Maior', accidental: '1 ♭', file: 'fa-maior.json' },
  { id: 0, label: 'Dó Maior', accidental: 'Sem acidentes', file: 'do-maior.json' },
  { id: 1, label: 'Sol Maior', accidental: '1 #', file: 'sol-maior.json' },
  { id: 2, label: 'Ré Maior', accidental: '2 #', file: 're-maior.json' },
  { id: 3, label: 'Lá Maior', accidental: '3 #', file: 'la-maior.json' },
  { id: 4, label: 'Mi Maior', accidental: '4 #', file: 'mi-maior.json' },
  { id: 5, label: 'Si Maior', accidental: '5 #', file: null },
  { id: 6, label: 'Fá♯ Maior', accidental: '6 #', file: null },
  { id: 7, label: 'Dó♯ Maior', accidental: '7 #', file: null },
]

const BASE_TIME_SIGNATURES = [
  '4/4',
  '3/4',
  '2/4',
  '4/2',
  '3/2',
  '2/2',
  '12/8',
  '9/8',
  '6/8',
  '12/4',
  '9/4',
  '6/4',
]

/* ========= PATHS ========= */
/**
 * Serve para funcionar tanto em / quanto em subpasta.
 * Se você usar caminhos absolutos (/json/...), pode quebrar em subpasta.
 */
const appBaseUrl = new URL('.', window.location.href)
function assetPath(relativePath) {
  return new URL(relativePath, appBaseUrl).toString()
}

/* ========= STATE ========= */

const state = {
  keyIndex: Math.max(
    0,
    KEY_STEPS.findIndex((item) => item.id === 0)
  ),
  filters: { numberQuery: '', titleQuery: '', timeSignature: '' },
  hymns: [],
  filtered: [],
  zoom: 1,
  selectedHymn: null,
}

/* ========= ELEMENTS ========= */

const el = {
  status: document.getElementById('status'),
  resultsSection: document.getElementById('resultsSection'),
  resultsBody: document.getElementById('resultsBody'),
  cards: document.getElementById('cards'),
  numberQuery: document.getElementById('numberQuery'),
  titleQuery: document.getElementById('titleQuery'),
  timeSignature: document.getElementById('timeSignature'),
  keyUp: document.getElementById('keyUp'),
  keyDown: document.getElementById('keyDown'),
  keyAccidental: document.getElementById('keyAccidental'),
  keyLabel: document.getElementById('keyLabel'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalTitle: document.getElementById('modalTitle'),
  scoreImage: document.getElementById('scoreImage'),
  zoomOut: document.getElementById('zoomOut'),
  zoomIn: document.getElementById('zoomIn'),
  zoomValue: document.getElementById('zoomValue'),
  closeModal: document.getElementById('closeModal'),
  scorePages: document.getElementById('scorePages'),
}

function assertElements() {
  const required = [
    'status',
    'resultsSection',
    'resultsBody',
    'cards',
    'numberQuery',
    'titleQuery',
    'timeSignature',
    'keyUp',
    'keyDown',
    'keyAccidental',
    'keyLabel',
    'modalBackdrop',
    'modalTitle',
    'scoreImage',
    'zoomOut',
    'zoomIn',
    'zoomValue',
    'closeModal',
  ]

  const missing = required.filter((k) => !el[k])
  if (missing.length) {
    console.error('IDs faltando no HTML:', missing)
    renderStatus(`IDs faltando no HTML: ${missing.join(', ')}`, true)
    return false
  }
  return true
}

/* ========= IMAGES ========== */

function buildSecondPageFilename(filename) {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return `${filename}-2`
  return `${filename.slice(0, dot)}-2${filename.slice(dot)}`
}

async function urlExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    return res.ok
  } catch {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' })
      return res.ok
    } catch {
      return false
    }
  }
}

function clearScorePages() {
  if (el.scorePages) el.scorePages.innerHTML = ''
}

function renderScorePages(imageUrls) {
  clearScorePages()

  if (!el.scorePages) {
    // fallback antigo
    el.scoreImage.hidden = false
    el.scoreImage.src = imageUrls[0]
    el.scoreImage.style.transform = `scale(${state.zoom})`
    return
  }

  for (const url of imageUrls) {
    const img = document.createElement('img')
    img.src = url
    img.alt = 'Partitura'
    img.style.transform = `scale(${state.zoom})`
    el.scorePages.appendChild(img)
  }

  if (el.scoreImage) el.scoreImage.hidden = true
}

/* ========= HELPERS ========= */

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function renderKey() {
  const key = KEY_STEPS[state.keyIndex]
  el.keyAccidental.textContent = key.accidental
  el.keyLabel.textContent = key.label
}

function renderStatus(message, isError = false) {
  el.status.hidden = false
  el.status.textContent = message
  el.status.classList.toggle('error', Boolean(isError))
}

function hideStatus() {
  el.status.hidden = true
}

function formatAndamento(andamento) {
  if (!andamento || (andamento.minimo == null && andamento.maximo == null)) return '-'
  if (andamento.minimo != null && andamento.maximo != null) return `${andamento.minimo} - ${andamento.maximo}`
  return `${andamento.minimo ?? andamento.maximo}`
}

function getAverageAndamento(andamento) {
  if (!andamento) return '-'
  const min = andamento.minimo
  const max = andamento.maximo
  if (min == null && max == null) return '-'

  const nMin = Number(min)
  const nMax = Number(max)

  if (Number.isFinite(nMin) && Number.isFinite(nMax)) return ((nMin + nMax) / 2).toFixed(1)
  const one = min ?? max
  const nOne = Number(one)
  return Number.isFinite(nOne) ? String(nOne) : '-'
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/* ========= TIME SIGNATURE SELECT ========= */

function renderTimeSignatures() {
  const available = new Set(
    state.hymns
      .map((item) => (item?.compasso || '').trim())
      .filter(Boolean)
  )
  const options = BASE_TIME_SIGNATURES.filter((item) => available.has(item))

  const current = state.filters.timeSignature
  el.timeSignature.innerHTML = '<option value="">Todos</option>'

  for (const item of options) {
    const option = document.createElement('option')
    option.value = item
    option.textContent = item
    el.timeSignature.appendChild(option)
  }

  if (options.includes(current)) {
    el.timeSignature.value = current
  } else {
    state.filters.timeSignature = ''
    el.timeSignature.value = ''
  }
}

/* ========= FILTERING & RENDER ========= */

function applyFilters() {
  const numberQuery = state.filters.numberQuery.trim()
  const titleQuery = normalizeText(state.filters.titleQuery)
  const sig = state.filters.timeSignature

  state.filtered = state.hymns
    .filter((item) => {
      const numeroStr = String(item?.numero ?? '')
      const tituloNorm = normalizeText(item?.titulo ?? '')
      const compasso = (item?.compasso || '').trim()

      if (numberQuery && !numeroStr.includes(numberQuery)) return false
      if (sig && compasso !== sig) return false
      if (titleQuery && !tituloNorm.includes(titleQuery)) return false
      return true
    })
    .sort((a, b) => (a?.numero ?? 0) - (b?.numero ?? 0))

  renderResults()
}

function clearResults() {
  el.resultsBody.innerHTML = ''
  el.cards.innerHTML = ''
}

function renderResults() {
  const activeFilter = Boolean(
    state.filters.numberQuery.trim() ||
      state.filters.timeSignature ||
      state.filters.titleQuery.trim()
  )

  clearResults()

  if (!state.filtered.length) {
    el.resultsSection.hidden = true
    renderStatus(
      activeFilter
        ? 'Nenhum hino encontrado com os filtros informados.'
        : 'Preencha ao menos um filtro para listar hinos desta tonalidade.'
    )
    return
  }

  hideStatus()
  el.resultsSection.hidden = false

  for (const hino of state.filtered) {
    // ===== TABLE ROW =====
    const row = document.createElement('tr')

    const tdNumero = document.createElement('td')
    tdNumero.textContent = hino?.numero ?? '-'

    const tdTitulo = document.createElement('td')
    tdTitulo.textContent = hino?.titulo ?? '-'

    const tdCompasso = document.createElement('td')
    tdCompasso.textContent = hino?.compasso ?? '-'

    const tdAndamento = document.createElement('td')
    tdAndamento.textContent = formatAndamento(hino?.andamento)

    const tdMedia = document.createElement('td')
    tdMedia.textContent = getAverageAndamento(hino?.andamento)

    // Se sua tabela NÃO tem a coluna "Média", comente a linha abaixo:
    row.append(tdNumero, tdTitulo, tdCompasso, tdAndamento, tdMedia)

    row.addEventListener('click', () => openScoreModal(hino))
    el.resultsBody.appendChild(row)

    // ===== CARD =====
    const card = document.createElement('article')
    card.className = 'card'

    const h3 = document.createElement('h3')
    h3.textContent = `${hino?.numero ?? '-'} - ${hino?.titulo ?? '-'}`

    const p1 = document.createElement('p')
    const s1 = document.createElement('strong')
    s1.textContent = 'Compasso:'
    p1.append(s1, ` ${hino?.compasso ?? '-'}`)

    const p2 = document.createElement('p')
    const s2 = document.createElement('strong')
    s2.textContent = 'Andamento:'
    p2.append(s2, ` ${formatAndamento(hino?.andamento)}`)

    const p3 = document.createElement('p')
    const s3 = document.createElement('strong')
    s3.textContent = 'Média:'
    p3.append(s3, ` ${getAverageAndamento(hino?.andamento)}`)

    card.append(h3, p1, p2, p3)
    card.addEventListener('click', () => openScoreModal(hino))
    el.cards.appendChild(card)
  }
}

/* ========= DATA LOADING ========= */

async function loadKeyData() {
  const key = KEY_STEPS[state.keyIndex]

  state.hymns = []
  state.filtered = []
  el.resultsSection.hidden = true
  clearResults()

  if (!key?.file) {
    renderStatus('Tonalidade ainda não cadastrada.', true)
    renderTimeSignatures()
    return
  }

  renderStatus('Carregando hinos...')

  try {
    const response = await fetch(assetPath(`json/${key.file}`), { cache: 'no-store' })
    if (!response.ok) {
      if (response.status === 404) throw new Error('Tonalidade ainda não cadastrada.')
      throw new Error(`Falha ao carregar ${key.file} (HTTP ${response.status}).`)
    }

    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('JSON inválido: era esperado um array de hinos.')

    state.hymns = data.map((h) => ({
      ...h,
      compasso: (h?.compasso || '').trim() || null,
    }))

    renderTimeSignatures()
    applyFilters()
  } catch (error) {
    renderStatus(error?.message || 'Erro ao carregar dados da tonalidade.', true)
    renderTimeSignatures()
  }
}

/* ========= MODAL ========= */

async function openScoreModal(hino) {
  const file = hino?.partitura?.arquivo
  const type = hino?.partitura?.tipo?.toLowerCase()

  if (!file || !type) {
    alert('Partitura indisponível para este hino.')
    return
  }

  if (type === 'pdf') {
    window.open(assetPath(`images/${file}`), '_blank', 'noopener,noreferrer')
    return
  }

  if (!['png', 'jpg', 'jpeg'].includes(type)) {
    alert(`Formato não suportado: ${type}`)
    return
  }

  state.selectedHymn = hino
  state.zoom = 1

  el.modalTitle.textContent = `${hino?.numero ?? '-'} - ${hino?.titulo ?? '-'}`
  el.zoomValue.textContent = '100%'
  el.modalBackdrop.hidden = false

  const page1Url = assetPath(`images/${file}`)
  const secondFile = buildSecondPageFilename(file)
  const page2Url = assetPath(`images/${secondFile}`)

  const hasSecond = await urlExists(page2Url)
  renderScorePages(hasSecond ? [page1Url, page2Url] : [page1Url])
}


function closeModal() {
  state.selectedHymn = null
  clearScorePages()
  el.modalBackdrop.hidden = true
}


function setZoom(delta) {
  state.zoom = clamp(state.zoom + delta, 0.5, 3)
  el.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`

  if (el.scorePages && el.scorePages.children.length) {
    Array.from(el.scorePages.children).forEach((node) => {
      if (node && node.tagName === 'IMG') node.style.transform = `scale(${state.zoom})`
    })
    return
  }

  if (el.scoreImage) el.scoreImage.style.transform = `scale(${state.zoom})`
}


/* ========= EVENTS ========= */

function bindEvents() {
  el.numberQuery.addEventListener('input', (event) => {
    state.filters.numberQuery = event.target.value
    applyFilters()
  })

  el.titleQuery.addEventListener('input', (event) => {
    state.filters.titleQuery = event.target.value
    applyFilters()
  })

  el.timeSignature.addEventListener('change', (event) => {
    state.filters.timeSignature = event.target.value
    applyFilters()
  })

  el.keyUp.addEventListener('click', () => {
    state.keyIndex = clamp(state.keyIndex + 1, 0, KEY_STEPS.length - 1)
    renderKey()
    loadKeyData()
  })

  el.keyDown.addEventListener('click', () => {
    state.keyIndex = clamp(state.keyIndex - 1, 0, KEY_STEPS.length - 1)
    renderKey()
    loadKeyData()
  })

  el.closeModal.addEventListener('click', closeModal)

  el.modalBackdrop.addEventListener('click', (event) => {
    if (event.target === el.modalBackdrop) closeModal()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal()
  })

  el.zoomIn.addEventListener('click', () => setZoom(0.1))
  el.zoomOut.addEventListener('click', () => setZoom(-0.1))
}

/* ========= INIT ========= */

function init() {
  if (!assertElements()) return
  renderKey()
  bindEvents()
  loadKeyData()
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
