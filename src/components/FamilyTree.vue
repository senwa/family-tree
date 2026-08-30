<template>
  <div class="family-tree-container" ref="containerRef">
    <div
      class="tree-viewport"
      :class="{ 'is-dragging': isDragging }"
    >
      <div class="tree-canvas" ref="canvasRef" :style="getTransformStyle()">
        <TreeNode
          v-if="familyData"
          :person="familyData"
          :highlight-ids="highlightIds"
          @select="$emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import TreeNode from './TreeNode.vue'
import { useZoomDrag } from '../composables/useZoomDrag.js'

const props = defineProps({
  familyData: { type: Object, default: null },
  highlightIds: { type: Set, default: () => new Set() }
})

defineEmits(['select'])

const containerRef = ref(null)
const canvasRef = ref(null)
const { isDragging, scale, getTransformStyle, resetView, zoomIn, zoomOut, bindEvents, unbindEvents } = useZoomDrag(containerRef)

// 初始居中
onMounted(async () => {
  await nextTick()
  // 延迟绑定事件，确保 DOM 已就绪
  setTimeout(() => {
    bindEvents()
  }, 100)
})

defineExpose({
  resetView,
  zoomIn,
  zoomOut,
  scale,
  getCanvasElement: () => canvasRef.value
})
</script>

<style scoped>
.family-tree-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(circle at 20% 30%, rgba(212,168,83,0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(139,0,0,0.03) 0%, transparent 50%),
    #faf8f3;
  cursor: grab;
}

.family-tree-container.is-dragging {
  cursor: grabbing;
}

.tree-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tree-canvas {
  position: absolute;
  top: 40px;
  left: 50%;
  transform-origin: 0 0;
  transition: transform 0.05s ease-out;
  padding: 20px;
}
</style>
