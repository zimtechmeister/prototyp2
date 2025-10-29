<script setup lang="ts">
import { onMounted, ref } from 'vue'
import cytoscape from 'cytoscape'
onMounted(() => {
  const cy = cytoscape({
    container: document.getElementById('cy'), // or use the ref
    elements: [], // Your initial client-side data goes here
    // ... styling and layout options ...
  })
  // Attach logic and event handlers to 'cy' instance
})
</script>

<template>
  <div style="height: 100%">
    <div id="cy" ref="cyContainer" style="height: 100%; width: 100%"></div>
    <div class="button-overlay">
      <button>Button 1</button>
      <button>Button 2</button>
    </div>
  </div>
</template>

<style scoped>
.cy-container {
  /* This establishes the "positioning context" for the buttons */
  position: relative;

  /* Give the whole container the size you want */
  height: 100%; /* Using vh from our last conversation */
  width: 100%;

  /* Optional: just so you can see it */
  border: 1px solid blue;
}

.button-overlay {
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
</style>
