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

const BASE_TIME_SIGNATURES = ['4/4', '3/4', '2/4', '4/2', '3/2', '2/2', '12/8', '9/8', '6/8', '12/4', '9/4', '6/4']

const state = {
  keyIndex: KEY_STEPS.findIndex((item) => item.id === 0),
  filters: { numberQuery: '', titleQuery: '', timeSignature: '' },
  hymns: [],
  filtered: [],
  zoom: 1,
  selectedHymn: null,
}

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
}

function normalizeText(value) {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function renderKey() {
  const key = KEY_STEPS[state.keyIndex]
  el.keyAccidental.textContent = key.accidental
  el.keyLabel.textContent = key.label
}

function renderStatus(message, isError = false) {
  el.status.hidden = false
  el.status.textContent = message
  el.status.classList.toggle('error', isError)
}

function hideStatus() {
  el.status.hidden = true
}

function formatAndamento(andamento) {
  if (!andamento || (andamento.minimo == null && andamento.maximo == null)) return '-'
  if (andamento.minimo != null && andamento.maximo != null) return `${andamento.minimo} - ${andamento.maximo}`
  return `${andamento.minimo ?? andamento.maximo}`
}

function renderTimeSignatures() {
  const available = new Set(state.hymns.map((item) => item.compasso).filter(Boolean))
  const options = BASE_TIME_SIGNATURES.filter((item) => available.has(item))

  const current = state.filters.timeSignature
  el.timeSignature.innerHTML = '<option value="">Todos</option>'
  options.forEach((item) => {
    const option = document.createElement('option')
    option.value = item
    option.textContent = item
    el.timeSignature.appendChild(option)
  })

  if (options.includes(current)) {
    el.timeSignature.value = current
  } else {
    state.filters.timeSignature = ''
    el.timeSignature.value = ''
  }
}

function applyFilters() {
  const numberQuery = state.filters.numberQuery.trim()
  const titleQuery = normalizeText(state.filters.titleQuery)

  state.filtered = state.hymns
    .filter((item) => {
      if (numberQuery && !String(item.numero ?? '').includes(numberQuery)) return false
      if (state.filters.timeSignature && item.compasso !== state.filters.timeSignature) return false
      if (titleQuery && !normalizeText(item.titulo).includes(titleQuery)) return false
      return true
    })
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))

  renderResults()
}

function renderResults() {
  const activeFilter = Boolean(state.filters.numberQuery.trim() || state.filters.timeSignature || state.filters.titleQuery.trim())

  el.resultsBody.innerHTML = ''
  el.cards.innerHTML = ''

  if (!state.filtered.length) {
    el.resultsSection.hidden = true
    renderStatus('Nenhum hino encontrado com os filtros informados.')
    renderStatus(activeFilter ? 'Nenhum hino encontrado com os filtros informados.' : 'Preencha ao menos um filtro para listar hinos desta tonalidade.')
    return
  }

  hideStatus()
  el.resultsSection.hidden = false

  state.filtered.forEach((hino) => {
    const row = document.createElement('tr')
    row.innerHTML = `<td>${hino.numero ?? '-'}</td><td>${hino.titulo ?? '-'}</td><td>${hino.compasso ?? '-'}</td><td>${formatAndamento(hino.andamento)}</td>`
    row.addEventListener('click', () => openScoreModal(hino))
    el.resultsBody.appendChild(row)

    const card = document.createElement('article')
    card.className = 'card'
    card.innerHTML = `<h3>${hino.numero ?? '-'} - ${hino.titulo ?? '-'}</h3><p><strong>Compasso:</strong> ${hino.compasso ?? '-'}</p><p><strong>Andamento:</strong> ${formatAndamento(hino.andamento)}</p>`
    card.addEventListener('click', () => openScoreModal(hino))
    el.cards.appendChild(card)
  })
}

async function loadKeyData() {
  const key = KEY_STEPS[state.keyIndex]
  state.hymns = []
  state.filtered = []
  renderStatus('Carregando hinos...')
  el.resultsSection.hidden = true

  if (!key.file) {
    renderStatus('Tonalidade ainda não cadastrada.', true)
    renderTimeSignatures()
    return
  }

  try {
    const response = await fetch(`/json/${key.file}`)
    if (!response.ok) {
      if (response.status === 404) throw new Error('Tonalidade ainda não cadastrada.')
      throw new Error(`Falha ao carregar ${key.file} (HTTP ${response.status}).`)
    }
    if (!response.ok) throw new Error(`Falha ao carregar ${key.file} (HTTP ${response.status}).`)
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('JSON inválido: era esperado um array de hinos.')

    state.hymns = data
    renderTimeSignatures()
    applyFilters()
  } catch (error) {
    renderStatus(error.message || 'Erro ao carregar dados da tonalidade.', true)
    renderTimeSignatures()
  }
}

function openScoreModal(hino) {
  const file = hino?.partitura?.arquivo
  const type = hino?.partitura?.tipo?.toLowerCase()
  if (!file || !type) {
    alert('Partitura indisponível para este hino.')
    return
  }

  if (type === 'pdf') {
    window.open(`/images/${file}`, '_blank', 'noopener,noreferrer')
    return
  }

  if (!['png', 'jpg', 'jpeg'].includes(type)) {
    alert(`Formato não suportado: ${type}`)
    return
  }

  state.selectedHymn = hino
  state.zoom = 1
  el.modalTitle.textContent = `${hino.numero} - ${hino.titulo}`
  el.scoreImage.src = `/images/${file}`
  el.scoreImage.style.transform = 'scale(1)'
  el.zoomValue.textContent = '100%'
  el.modalBackdrop.hidden = false
}

function closeModal() {
  state.selectedHymn = null
  el.modalBackdrop.hidden = true
}

function setZoom(delta) {
  state.zoom = Math.min(3, Math.max(0.5, state.zoom + delta))
  el.scoreImage.style.transform = `scale(${state.zoom})`
  el.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`
}

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
  state.keyIndex = Math.min(KEY_STEPS.length - 1, state.keyIndex + 1)
  renderKey()
  loadKeyData()
})
el.keyDown.addEventListener('click', () => {
  state.keyIndex = Math.max(0, state.keyIndex - 1)
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

renderKey()
loadKeyData()
