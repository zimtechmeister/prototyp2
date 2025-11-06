<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import cytoscape, { Core } from 'cytoscape'
import edgehandles from 'cytoscape-edgehandles'

cytoscape.use(edgehandles)

// mode defines behaviour when clicking on the canvas
const mode = ref('select')

// Create a ref for the container element
const cyContainer = ref<HTMLElement | null>(null)

// Declare 'cy' in the top-level scope
// We initialize it as null (or undefined) and then assign the instance in onMounted.
// This makes it accessible to our template click handlers.
let cy: Core | null = null
let eh: any = null // Use 'any' as the specific type for edgehandles is complex/not exported easily
let nodeId = 0
let edgeId = 0
let wasEdgeCompleted = false // tracking the edge state for handleEdgeStop function

// Add a new node with a unique ID
function addNode(classes: string[], position: { x: number; y: number }) {
  const newNode = cy?.add({
    group: 'nodes',
    classes: classes,
    data: {
      id: `node${nodeId++}`,
    },
    position: position,
  })
  return newNode
}

// Add a new edge with a unique ID
function addEdge(sourceNode: cytoscape.Collection, targetNode: cytoscape.Collection) {
  const newEdge = cy?.add({
    group: 'edges',
    data: {
      id: `edge${edgeId++}`,
      source: sourceNode.id(),
      target: targetNode.id(),
    },
  })
  return newEdge
}

// Function to handle node creation after an unsuccessful edge draw
function handleEdgeStop(
  sourceNode: cytoscape.Collection,
  position: {
    x: number
    y: number
  },
) {
  // check if no edge was created (ehcomplete did not fire) before ehstop triggers
  if (!wasEdgeCompleted) {
    // Determine the class of the new node based on the source node's class
    const newClass = sourceNode.hasClass('place') ? 'transition' : 'place'

    // Create the new node
    const newNode = addNode([newClass], position)
    // Create the connecting edge
    if (newNode) addEdge(sourceNode, newNode)
  }
  // Reset the flag for the next edge draw sequence
  wasEdgeCompleted = false
}

onMounted(() => {
  if (cyContainer.value) {
    cy = cytoscape({
      container: document.getElementById('cy'),
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
        // whether an edge can be created between source and target
        // Check for a self-loop. Loops are always allowed.
        if (sourceNode.same(targetNode)) {
          return true
        }
        // allow edges between places and transitions
        return (
          (sourceNode.hasClass('place') && targetNode.hasClass('transition')) ||
          (sourceNode.hasClass('transition') && targetNode.hasClass('place'))
        )
      },
      edgeParams: (sourceNode, targetNode) => {
        // return addEdge(sourceNode, targetNode) // NOTE: this somehow produces errors
        return {
          data: {
            id : `edge${edgeId++}`,
            source: sourceNode.id(),
            target: targetNode.id(),
          },
        }
      },
      hoverDelay: 0,
      snap: false,
      snapThreshold: 0,
      noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
      disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    })

    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
      console.log('ehcomplete', sourceNode, targetNode, addedEdge)
      wasEdgeCompleted = true // Set flag to true on successful edge creation
    })
    cy.on('ehstop', (event, sourceNode) => {
      handleEdgeStop(sourceNode, event.position)
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
