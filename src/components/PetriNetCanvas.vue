<script setup lang="ts">
import { onMounted, ref } from 'vue'
import cytoscape from 'cytoscape'

const mode = ref('select')

onMounted(() => {
  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: {
      nodes: [
        {
          data: {
            id: 'desktop',
            name: 'Cytoscape',
            href: 'http://cytoscape.org',
            position: { // the model position of the node (optional on init, mandatory after)
              x: 100,
              y: 100
            },
            selected: false, // whether the element is selected (default false)
            selectable: true, // whether the selection state is mutable (default true)
            locked: false, // when locked a node's position is immutable (default false)
            grabbable: true, // whether the node can be grabbed and moved by the user
            pannable: false, // whether dragging the node causes panning instead of grabbing
            classes: ['foo', 'bar'], // an array (or a space separated string) of class names that the element has
            // DO NOT USE THE `style` FIELD UNLESS ABSOLUTELY NECESSARY
            // USE THE STYLESHEET INSTEAD
            style: { // style property overrides
              'background-color': 'red'
            }
          },
        },
        {
          data: {
            id: 'js',
            name: 'Cytoscape.js',
            href: 'http://js.cytoscape.org',
          },
        },
      ],
      edges: [
        {
          data: {
            source: 'desktop',
            target: 'js',
          },
        },
      ],
    },
    layout: {
      name: 'grid',
      rows: 1
    },
    style: [
      {
        selector: 'node',
        style: {
          shape: 'square',
          // 'background-color': 'red',
            label: 'data(id)'
        }
      }]
  })
  // Attach logic and event handlers to 'cy' instance
})
</script>

<template>
  <div id="cy" ref="cyContainer" ></div>
  <div class="toolbar">
    <button @click="mode = 'select'" :class="{ active: mode === 'select' }">Select</button>
    <button @click="mode = 'place'" :class="{ active: mode === 'place' }">Place</button>
    <button @click="cy.layout({ name: 'circle' }).run();">layout</button>
    <button @click="cy.add({ data: { id:  'asd'} });">add</button>
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
