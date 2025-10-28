<script setup lang="ts">
import { onMounted, ref } from 'vue';
import cytoscape from 'cytoscape';
onMounted(() => {
  const cy = cytoscape({
    container: document.getElementById('cy'), // or use the ref
    elements: [], // Your initial client-side data goes here
    // ... styling and layout options ...
  });
  // Attach logic and event handlers to 'cy' instance
});
</script>

<template>
  <div id="cy" ref="cyContainer" style="height: 500px; width: 100%;"></div>
</template>
