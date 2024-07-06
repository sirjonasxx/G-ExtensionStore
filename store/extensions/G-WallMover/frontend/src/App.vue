<template>
  <div class="container">
    <h1>G-WallMover</h1>
    <div class="input-group">
      <label for="l1">L1:</label>
      <input type="number" id="l1" v-model="l1" @wheel="handleWheel($event, 'l1')">
    </div>
    <div class="input-group">
      <label for="l2">L2:</label>
      <input type="number" id="l2" v-model="l2" @wheel="handleWheel($event, 'l2')">
    </div>
    <div class="input-group">
      <label for="stepSize">Step Size:</label>
      <select id="stepSize" v-model="stepSize">
        <option v-for="size in stepSizes" :key="size" :value="size">+{{ size }}</option>
      </select>
    </div>
    <button @click="moveItem">Move Wall-Furni</button>
    <button @click="toggleAdvanced">{{ showAdvanced ? 'Hide' : 'Show' }} W1/W2 Settings</button>
    <div v-if="showAdvanced">
      <div class="input-group">
        <label for="w1">W1:</label>
        <input type="number" id="w1" v-model="w1" readonly>
      </div>
      <div class="input-group">
        <label for="w2">W2:</label>
        <input type="number" id="w2" v-model="w2" readonly>
      </div>
    </div>
    <div id="log" v-html="logHtml"></div>
  </div>
</template>

<script>
import { MoveItem, UpdatePosition, GetPosition, AddLogMessage } from '../wailsjs/go/main/App'

export default {
  data() {
    return {
      l1: 0,
      l2: 0,
      w1: 0,
      w2: 0,
      stepSize: 5,
      stepSizes: [1, 5, 10, 15, 20, 30, 40, 50],
      showAdvanced: false,
      log: [],
      lastUpdate: 0,
      debounceTime: 100
    }
  },
  computed: {
    logHtml() {
      return this.log.map(msg => `<div>${msg}</div>`).join('')
    }
  },
  methods: {
    async moveItem() {
      await MoveItem(parseInt(this.l1), parseInt(this.l2), parseInt(this.w1), parseInt(this.w2))
    },
    async updatePosition() {
      await UpdatePosition(parseInt(this.l1), parseInt(this.l2), parseInt(this.w1), parseInt(this.w2))
    },
    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced
    },
    handleWheel(e, id) {
      e.preventDefault()
      const now = Date.now()
      if (now - this.lastUpdate < this.debounceTime) return
      this.lastUpdate = now
      const delta = e.deltaY > 0 ? -this.stepSize : this.stepSize
      this[id] = parseInt(this[id] || 0) + delta
      this.updatePosition()
    },
    async getPosition() {
      const position = await GetPosition()
      this.w1 = position.W1
      this.w2 = position.W2
      this.l1 = position.L1
      this.l2 = position.L2
      AddLogMessage(`Current position: w=${position.W1},${position.W2} l=${position.L1},${position.L2} ${position.Direction}`)
    }
  },
  mounted() {
    this.getPosition()
    window.runtime.EventsOn("logUpdate", (message) => {
      this.log.push(message)
      if (this.log.length > 5) this.log.shift()
    })
    window.runtime.EventsOn("positionUpdate", (pos) => {
      this.w1 = pos.W1
      this.w2 = pos.W2
      this.l1 = pos.L1
      this.l2 = pos.L2
    })
  }
}
</script>

<style>
body {
    font-family: Arial, sans-serif;
    background-color: #1e1e1e;
    color: #e0e0e0;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    min-height: 100vh;
    margin: 0;
    padding: 20px;
    box-sizing: border-box;
    overflow: hidden;
}
.container {
    background-color: #2d2d2d;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    width: 300px;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
}
h1 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
    color: #4CAF50;
}
.input-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}
label {
    margin-right: 10px;
    font-weight: bold;
}
input, select {
    width: 100px;
    background-color: #3d3d3d;
    color: #e0e0e0;
    border: 1px solid #555;
    padding: 8px;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s, box-shadow 0.3s;
}
input:focus, select:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 5px rgba(76,175,80,0.5);
}
input[type="number"] {
    -moz-appearance: textfield;
}
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
select {
    width: auto;
    cursor: pointer;
}
button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    text-align: center;
    display: block;
    font-size: 16px;
    margin: 20px auto;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s, transform 0.1s;
}
button:hover {
    background-color: #45a049;
}
button:active {
    transform: scale(0.98);
}
#log {
    margin-top: 20px;
    height: 150px;
    background-color: #3d3d3d;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.4;
    border: 1px solid #555;
    overflow-y: auto;
}
#log:empty::before {
    content: "No log entries yet.";
    color: #888;
    font-style: italic;
}
#log div {
    margin-bottom: 5px;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
}
#log div:last-child {
    border-bottom: none;
}
</style>