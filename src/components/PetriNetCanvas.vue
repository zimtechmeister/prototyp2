<script setup lang="ts">
import { onMounted, ref } from 'vue'
import cytoscape from 'cytoscape'

const mode = ref('select')

// Create a ref for the container element
// This is the "Vue way" to get a reference to a DOM element.
const cyContainer = ref<HTMLElement | null>(null)

// Declare 'cy' in the top-level scope
// We initialize it as null (or undefined) and then assign the instance in onMounted.
// This makes it accessible to our template click handlers.
let cy: Core | null = null

// button functions
function runLayout() {
  cy?.layout({ name: 'circle' }).run()
}
function addNode() {
  // Simple unique ID generator for new nodes
  // just count up for every new node
  const id = `node${Math.floor(Math.random() * 1000)}`
  cy?.add({
    group: 'nodes',
    data: {
      id: id,
      classes: ['place'],
    }
  })

  // After adding, run a layout so it doesn't just stack on top
  cy?.layout({ name: 'grid', rows: 1 }).run()
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
              id: 'node1',
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
              id: 'node2',
            },
          },
        ],
        edges: [
          {
            data: {
              id: 'edge1',
              source: 'node1',
              target: 'node2',
            },
          },
        ],
      },
      layout: {
        name: 'grid',
        rows: 1,
      },
      style: [
        // {
        //   selector: 'node',
        //   style: {
        //     shape: 'round-rectangle',
        //   },
        // },
        {
          selector: '.place',
          style: {
            shape: 'ellipse', // Changed to ellipse for a more standard look
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
        // Style for selected nodes
        {
          selector: 'node:selected',
          style: {
            'background-color': '#ff6666',
            'border-color': '#ff4d4d',
          },
        },
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
    })
  } else {
    console.error('Cytoscape container element not found.')
  }
})
</script>

<template>
  <div id="cy" ref="cyContainer"></div>
  <div class="toolbar">
    <button @click="mode = 'select'" :class="{ active: mode === 'select' }">Select</button>
    <button @click="mode = 'place'" :class="{ active: mode === 'place' }">Place</button>
    <button @click="runLayout">Run Layout</button>
    <button @click="addNode">Add Node</button>
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
