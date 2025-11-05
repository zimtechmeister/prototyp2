<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import cytoscape, { Core } from 'cytoscape'
import edgehandles from 'cytoscape-edgehandles'

cytoscape.use(edgehandles)

// mode defines behaviour when clicking on the canvas
const mode = ref('select')

// Create a ref for the container element
// This is the "Vue way" to get a reference to a DOM element.
const cyContainer = ref<HTMLElement | null>(null)

// Declare 'cy' in the top-level scope
// We initialize it as null (or undefined) and then assign the instance in onMounted.
// This makes it accessible to our template click handlers.
let cy: Core | null = null

let eh: any = null // Use 'any' as the specific type for edgehandles is complex/not exported easily

// button functions
function runLayout() {
  cy?.layout({ name: 'circle' }).run()
}
// Add a new node with a unique ID
// TODO: check if there is already a node with that ID?
let nodeId = 0
function addNode(classes: string[], position: { x: number; y: number }) {
  cy?.add({
    group: 'nodes',
    classes: classes,
    data: {
      id: `node${nodeId++}`,
    },
    position: position,
  })
}

onMounted(() => {
  if (cyContainer.value) {
    cy = cytoscape({
      container: document.getElementById('cy'),
      elements: {
        nodes: [
          {
            classes: ['place'], // an array (or a space separated string) of class names that the element has
            data: {
              id: 'sdf',
              // dont need the following as they are default values
              selected: false, // whether the element is selected (default false)
              selectable: true, // whether the selection state is mutable (default true)
              locked: false, // when locked a node's position is immutable (default false)
              grabbable: true, // whether the node can be grabbed and moved by the user
              pannable: false, // whether dragging the node causes panning instead of grabbing
            },
          },
          {
            classes: ['transition'],
            data: {
              id: 'rst',
            },
          },
        ],
        edges: [
          {
            data: {
              id: 'edge1',
              source: 'sdf',
              target: 'rst',
            },
          },
        ],
      },
      layout: {
        name: 'grid',
        rows: 1,
      },
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

    let edgeId = 0
    eh = cy.edgehandles({
      canConnect: (sourceNode, targetNode) => {
        // whether an edge can be created between source and target
        // Check for a self-loop. Loops are always allowed.
        if (sourceNode.same(targetNode)) {
          return true
        }
        // allow edges between places and transitions
        return sourceNode.hasClass('place') && targetNode.hasClass('transition') || sourceNode.hasClass('transition') && targetNode.hasClass('place')
      },
      edgeParams: (sourceNode, targetNode) => {
        // for edges between the specified source and target
        // return element object to be passed to cy.add() for edge
        return {
          data: {
            id: `edge${edgeId++}`,
            source: sourceNode.id(),
            target: targetNode.id(),
          },
        }
      },
      hoverDelay: 0,
      snap: false,
      snapThreshold: 0,
      noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds  NOTE: what does this do?
      disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    })

    // Handle tap events on the cytoscape instance
    cy.on('tap', (event) => {
      // Check if the tap was on the background
      if (event.target === cy) {
        const position = event.position
        if (mode.value === 'place' || mode.value === 'transition') {
          addNode([mode.value], position)
        }
      }
    })
  } else {
    console.error('Cytoscape container element not found.')
  }
})

watch(mode, (newMode) => {
  if (!cy || !eh) return

  if (newMode === 'edge') {
    eh.enableDrawMode()
  } else {
    // any other mode but edge
    eh.disableDrawMode()
  }
})
</script>

<template>
  <div id="cy" ref="cyContainer"></div>
  <div class="toolbar">
    <button @click="mode = 'select'" :class="{ active: mode === 'select' }">Select</button>
    <button @click="mode = 'place'" :class="{ active: mode === 'place' }">Place</button>
    <button @click="mode = 'transition'" :class="{ active: mode === 'transition' }">
      Transition
    </button>
    <button @click="mode = 'edge'" :class="{ active: mode === 'edge' }">Edge</button>
    <button @click="runLayout">Run Layout</button>
  </div>
</template>

<style scoped>
#cy {
  height: 100%;
  width: 100%;
}
.toolbar {
  /* This pulls the div out of the normal flow and puts it "in front" */
  position: absolute;

  /* Position it 10px from the top and 10px from the left */
  top: 10px;
  left: 10px;

  /* This ensures it's on top of the #cy div (which has a default z-index of 0) */
  z-index: 10;

  /* Optional: styles for the buttons */
  display: flex;
  gap: 10px;
}
.toolbar button.active {
  background-color: #aaaaaa;
}
</style>
