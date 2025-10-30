<script setup lang="ts">
import PetriNetCanvas from './components/PetriNetCanvas.vue'
</script>

<template>
  <PetriNetCanvas />
</template>

<style>
/* This makes the root elements 100% tall */
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
