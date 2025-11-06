
import cytoscape, { Core } from 'cytoscape'
import edgehandles, { EdgeHandlesInstance } from 'cytoscape-edgehandles'
import { usePetriNetStore } from '@/stores/petri-net'

cytoscape.use(edgehandles)

let cy: Core | null = null
let eh: EdgeHandlesInstance | null = null

export function initCytoscape(container: HTMLElement) {
  const store = usePetriNetStore()

  cy = cytoscape({
    container: container,
    style: [
        {
          selector: '.place',
          style: {
            shape: 'ellipse',
            'background-color': '#66a3ff',
            label: 'data(id)',
            color: '#000000',
            'text-valign': 'center',
            'text-halign': 'center',
            'border-width': 2,
            'border-color': '#4d88ff',
          },
        },
        {
          selector: '.transition',
          style: {
            shape: 'rectangle',
            'background-color': '#ffcc66',
            label: 'data(id)',
            color: '#000000',
            'text-valign': 'center',
            'text-halign': 'center',
            'border-width': 2,
            'border-color': '#ffb84d',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': '#000000',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#ff6666',
            'border-color': '#ff4d4d',
          },
        },

        {
          selector: '.eh-handle',
          style: {
            'background-color': 'red',
            width: 12,
            height: 12,
            shape: 'ellipse',
            'overlay-opacity': 0,
            'border-width': 12, // makes the handle easier to hit
            'border-opacity': 0,
          },
        },

        // edge handle styles:
        {
          selector: '.eh-hover',
          style: {
            'background-color': 'red',
          },
        },
        {
          selector: '.eh-source',
          style: {
            'border-width': 2,
            'border-color': 'red',
          },
        },
        {
          selector: '.eh-target',
          style: {
            'border-width': 2,
            'border-color': 'red',
          },
        },
        {
          selector: '.eh-preview, .eh-ghost-edge',
          style: {
            'background-color': 'red',
            'line-color': 'red',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red',
          },
        },
        {
          selector: '.eh-ghost-edge.eh-preview-active',
          style: {
            opacity: 0,
          },
        },
      ],
    userZoomingEnabled: true,
    userPanningEnabled: true,
  })

  eh = cy.edgehandles({
      canConnect: (sourceNode, targetNode) => {
        if (sourceNode.same(targetNode)) {
          return true
        }
        return (
          (sourceNode.hasClass('place') && targetNode.hasClass('transition')) ||
          (sourceNode.hasClass('transition') && targetNode.hasClass('place'))
        )
      },
      edgeParams: (sourceNode, targetNode) => {
        return {
          data: {
            id : `edge${store.edgeId}`,
            source: sourceNode.id(),
            target: targetNode.id(),
          },
        }
      },
      hoverDelay: 0,
      snap: false,
      snapThreshold: 0,
      noEdgeEventsInDraw: true,
      disableBrowserGestures: true,
    })

  cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
    if (addedEdge) {
        store.incrementEdgeId()
    }
  })

  cy.on('ehstop', (event, sourceNode) => {
    const position = event.position
    const newClass = sourceNode.hasClass('place') ? 'transition' : 'place'
    const newNode = addNode([newClass], position)
    if (newNode) {
        addEdge(sourceNode, newNode)
    }
  })

  cy.on('tap', (event) => {
    if (event.target === cy) {
      const position = event.position
      if (store.mode === 'place' || store.mode === 'transition') {
        addNode([store.mode], position)
      }
    }
  })

  return cy
}

export function addNode(classes: string[], position: { x: number; y: number }) {
  const store = usePetriNetStore()
  let id = `node${store.nodeId}`
  while (cy.getElementById(id).length > 0) {
    store.incrementNodeId()
    id = `node${store.nodeId}`
  }

  const newNode = cy?.add({
    group: 'nodes',
    classes: classes,
    data: {
      id: id,
    },
    position: position,
  })
  store.incrementNodeId()
  return newNode
}

export function addEdge(sourceNode: cytoscape.Collection, targetNode: cytoscape.Collection) {
  const store = usePetriNetStore()
  let id = `edge${store.edgeId}`
  while (cy.getElementById(id).length > 0) {
    store.incrementEdgeId()
    id = `edge${store.edgeId}`
  }

  const newEdge = cy?.add({
    group: 'edges',
    data: {
      id: id,
      source: sourceNode.id(),
      target: targetNode.id(),
    },
  })
  store.incrementEdgeId()
  return newEdge
}

export function getCy() {
  return cy
}

export function getEh() {
  return eh
}
