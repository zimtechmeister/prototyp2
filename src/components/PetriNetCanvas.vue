
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { usePetriNetStore } from '@/stores/petri-net'
import { initCytoscape, getEh } from '@/services/cytoscape-service'
import { Mode } from '@/types/mode'

const store = usePetriNetStore()
const cyContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  if (cyContainer.value) {
    initCytoscape(cyContainer.value)
  } else {
    console.error('Cytoscape container element not found.')
  }
})

watch(
  () => store.mode,
  (newMode) => {
    const eh = getEh()
    if (!eh) return

    if (newMode === Mode.Edge) {
      eh.enableDrawMode()
    } else {
      eh.disableDrawMode()
    }
  },
)
</script>

<template>
  <div id="cy" ref="cyContainer"></div>
  <div class="toolbar">
    <button @click="store.setMode(Mode.Select)" :class="{ active: store.mode === Mode.Select }">
      Select
    </button>
    <button @click="store.setMode(Mode.Place)" :class="{ active: store.mode === Mode.Place }">
      Place
    </button>
    <button
      @click="store.setMode(Mode.Transition)"
      :class="{ active: store.mode === Mode.Transition }"
    >
      Transition
    </button>
    <button @click="store.setMode(Mode.Edge)" :class="{ active: store.mode === Mode.Edge }">Edge</button>
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
