<template>
  <div class="p-4 font-sans" style="height:100%;display:flex;gap:12px;">
    <div style="width:220px;display:flex;flex-direction:column;gap:8px;">
      <div class="toolbar">
        <button @click="mode = 'select'" :class="{active: mode==='select'}">Select</button>
        <button @click="mode = 'add-place'" :class="{active: mode==='add-place'}">Add Place</button>
        <button @click="mode = 'add-transition'" :class="{active: mode==='add-transition'}">Add Transition</button>
        <button @click="startAddArc()" :class="{active: mode==='add-arc'}">Add Arc</button>
      </div>

      <div class="actions">
        <button @click="exportJson">Export JSON</button>
        <label style="display:block;margin-top:8px;">
          Import JSON
          <input type="file" accept="application/json" @change="importJson" />
        </label>
      </div>

      <div class="sim">
        <h4>Simulation</h4>
        <button @click="stepFire">Fire one enabled transition</button>
        <button @click="fireAll">Fire all enabled (greedy)</button>
      </div>

      <div class="props" v-if="selected">
        <h4>Selected</h4>
        <div><strong>id:</strong> {{ selected.data('id') }}</div>
        <div><strong>type:</strong> {{ selected.data('type') }}</div>

        <div style="margin-top:8px;" v-if="selected.data('type') === 'place'">
          <label>Label<br/>
            <input v-model="selectedLabel" @input="updateLabel" />
          </label>
          <label>Tokens<br/>
            <input type="number" v-model.number="selectedTokens" @input="updateTokens" />
          </label>
        </div>

        <div style="margin-top:8px;" v-if="selected.data('type') === 'transition'">
          <label>Label<br/>
            <input v-model="selectedLabel" @input="updateLabel" />
          </label>
        </div>

        <div style="margin-top:8px;" v-if="selected.isEdge && selected.data('type')==='arc'">
          <label>Weight<br/>
            <input type="number" v-model.number="edgeWeight" @input="updateEdgeWeight" min="1" />
          </label>
        </div>

        <button style="margin-top:8px;" @click="deleteSelected">Delete</button>
      </div>

      <div style="margin-top:auto;font-size:12px;color:#666">
        Mode: <strong>{{ mode }}</strong>
      </div>
    </div>

    <div id="cy" style="flex:1;border:1px solid #ddd;border-radius:6px;min-height:600px;position:relative;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import cytoscape from 'cytoscape'

// Simple Petri net editor using cytoscape
// Features: add place/transition, connect arcs (directed), edit tokens/labels/weights

const mode = ref('select')
let cy = null
const selected = ref(null)

const selectedLabel = ref('')
const selectedTokens = ref(0)
const edgeWeight = ref(1)

let pendingArcSource = null

function uuid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9)
}

onMounted(() => {
  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [],
    style: [
      {
        selector: 'node[type="place"]',
        style: {
          'shape': 'ellipse',
          'width': 40,
          'height': 40,
          'background-color': '#fff',
          'border-width': 2,
          'border-color': '#333',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'overlay-padding': 6,
          'font-size': 10
        }
      },
      {
        selector: 'node[type="transition"]',
        style: {
          'shape': 'rectangle',
          'width': 14,
          'height': 40,
          'background-color': '#333',
          'label': 'data(label)',
          'text-valign': 'top',
          'text-margin-y': -4,
          'font-size': 10,
          'color': '#111'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#555',
          'target-arrow-color': '#555',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(weight)'
        }
      },
      {
        selector: ':selected',
        style: {
          'border-color': '#007bff',
          'line-color': '#007bff',
          'target-arrow-color': '#007bff',
        }
      }
    ],
    layout: { name: 'grid', rows: 1 }
  })

  // Show tokens for places as a separate badge by updating label
  cy.on('add', 'node[type="place"]', (evt) => {
    updatePlaceLabel(evt.target)
  })

  cy.on('tap', (evt) => {
    const evtTarget = evt.target
    if (mode.value === 'add-place') {
      if (evtTarget === cy) {
        const id = uuid('p')
        cy.add({ group: 'nodes', data: { id, label: id, type: 'place', tokens: 0 }, position: evt.position })
      }
    } else if (mode.value === 'add-transition') {
      if (evtTarget === cy) {
        const id = uuid('t')
        cy.add({ group: 'nodes', data: { id, label: id, type: 'transition' }, position: evt.position })
      }
    } else if (mode.value === 'add-arc') {
      if (evtTarget.isNode && !pendingArcSource) {
        pendingArcSource = evtTarget
        pendingArcSource.select()
      } else if (evtTarget.isNode && pendingArcSource) {
        const source = pendingArcSource
        const target = evtTarget
        // Create arc from source to target
        const id = uuid('a')
        cy.add({ group: 'edges', data: { id, source: source.id(), target: target.id(), type: 'arc', weight: 1 } })
        pendingArcSource.unselect()
        pendingArcSource = null
      }
    }

    // selection handling for property panel
    if (evtTarget && evtTarget !== cy) {
      selected.value = evtTarget
      selectedLabel.value = evtTarget.data('label') ?? ''
      if (evtTarget.data('type') === 'place') selectedTokens.value = evtTarget.data('tokens') ?? 0
      if (evtTarget.isEdge && evtTarget.data('type') === 'arc') edgeWeight.value = evtTarget.data('weight') ?? 1
    } else {
      selected.value = null
    }
  })

  // drag nodes and zooming are enabled by default
})

function startAddArc() {
  mode.value = 'add-arc'
  pendingArcSource = null
}

function updatePlaceLabel(node) {
  // node.data('label') will show combined label + tokens for places
  const tokens = node.data('tokens') ?? 0
  const base = node.data('label') ?? node.id()
  node.data('label', `${base} (${tokens})`)
}

watch(selected, (n) => {
  // keep reactive inputs in sync
})

function updateLabel() {
  if (!selected.value) return
  selected.value.data('label', selectedLabel.value)
  if (selected.value.data('type') === 'place') updatePlaceLabel(selected.value)
}

function updateTokens() {
  if (!selected.value) return
  if (selected.value.data('type') !== 'place') return
  selected.value.data('tokens', selectedTokens.value)
  updatePlaceLabel(selected.value)
}

function updateEdgeWeight() {
  if (!selected.value) return
  if (!selected.value.isEdge) return
  selected.value.data('weight', Math.max(1, edgeWeight.value))
}

function deleteSelected() {
  if (!selected.value) return
  const toRemove = selected.value
  selected.value = null
  toRemove.remove()
}

function exportJson() {
  const json = {
    nodes: cy.nodes().map(n => ({ id: n.id(), data: n.data(), position: n.position() })),
    edges: cy.edges().map(e => ({ id: e.id(), data: e.data() }))
  }
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'petri-net.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importJson(ev) {
  const f = ev.target.files[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result)
      cy.elements().remove()
      // Add nodes
      parsed.nodes.forEach(n => {
        // restore tokens property for places (also label is restored)
        cy.add({ group: 'nodes', data: n.data, position: n.position })
      })
      // Add edges
      parsed.edges.forEach(e => cy.add({ group: 'edges', data: e.data }))
      cy.fit()
    } catch (err) {
      alert('Failed to import: ' + err.message)
    }
  }
  reader.readAsText(f)
}

function enabledTransitions() {
  // return cytoscape nodes that are transitions and currently enabled
  return cy.nodes().filter(n => n.data('type') === 'transition').filter(t => {
    const incomers = t.incomers('edge')
    for (let i = 0; i < incomers.length; i++) {
      const e = incomers[i]
      if (e.data('type') !== 'arc') continue
      const place = e.source() // if arc from place -> transition, source is place
      if (place.data('type') !== 'place') continue
      const required = e.data('weight') || 1
      if ((place.data('tokens') || 0) < required) return false
    }
    return true
  })
}

function stepFire() {
  const enabled = enabledTransitions()
  if (enabled.length === 0) { alert('No enabled transitions') ; return }
  const t = enabled[0]
  performFire(t)
}

function fireAll() {
  // greedy firing until no enabled
  let any = false
  while (true) {
    const en = enabledTransitions()
    if (en.length === 0) break
    performFire(en[0])
    any = true
  }
  if (!any) alert('No enabled transitions')
}

function performFire(transition) {
  // subtract tokens from input places and add to output places according to weights
  const inputs = transition.incomers('edge').filter(e => e.source().data('type') === 'place')
  const outputs = transition.outgoers('edge').filter(e => e.target().data('type') === 'place')

  cy.batch(() => {
    inputs.forEach(e => {
      const p = e.source()
      const w = e.data('weight') || 1
      const cur = p.data('tokens') || 0
      p.data('tokens', Math.max(0, cur - w))
      updatePlaceLabel(p)
    })

    outputs.forEach(e => {
      const p = e.target()
      const w = e.data('weight') || 1
      const cur = p.data('tokens') || 0
      p.data('tokens', cur + w)
      updatePlaceLabel(p)
    })
  })
}
</script>

<style scoped>
.toolbar button { display:block; width:100%; margin-bottom:6px }
.toolbar button.active { background:#007bff; color:white }
.actions button { display:block; width:100%; margin-top:6px }
.props { margin-top:12px; padding:8px; border:1px solid #eee; border-radius:6px }
</style>
