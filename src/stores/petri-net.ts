
import { defineStore } from 'pinia'

export const usePetriNetStore = defineStore('petriNet', {
  state: () => ({
    mode: 'select',
    nodeId: 0,
    edgeId: 0,
  }),
  actions: {
    setMode(newMode: string) {
      this.mode = newMode
    },
    incrementNodeId() {
      this.nodeId++
    },
    incrementEdgeId() {
      this.edgeId++
    },
  },
})
