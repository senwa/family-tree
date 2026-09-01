<template>
  <div class="family-tree-container" ref="containerRef">
    <div
      class="tree-viewport"
      :class="{ 'is-dragging': isDragging }"
      ref="viewportRef"
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
import { ref, onMounted, nextTick, watch } from 'vue'
import TreeNode from './TreeNode.vue'
import { useZoomDrag } from '../composables/useZoomDrag.js'

const props = defineProps({
  familyData: { type: Object, default: null },
  highlightIds: { type: Set, default: () => new Set() }
})

defineEmits(['select'])

const containerRef = ref(null)
const canvasRef = ref(null)
const viewportRef = ref(null)
const { isDragging, scale, getTransformStyle, fitView, zoomIn, zoomOut, bindEvents, unbindEvents } = useZoomDrag(containerRef)

// 自适应全览：等递归节点挂载、子树对齐 transform 应用完成后再量测
function autoFit() {
  fitView(canvasRef.value)
}

// "重置视图" = 回到完整显示全部成员并居中（工具栏按钮、导入后、导出前调用）
function resetView() {
  autoFit()
}

onMounted(async () => {
  await nextTick()
  // 延迟绑定事件并自适应，确保 DOM 布局已就绪
  setTimeout(() => {
    bindEvents()
    autoFit()
  }, 100)
})

// 数据整体替换（导入/加载示例）后重新自适应；原地增删改不替换引用、不触发
watch(() => props.familyData, () => {
  nextTick(() => setTimeout(autoFit, 100))
})

defineExpose({
  resetView,
  fitView,
  zoomIn,
  zoomOut,
  scale,
  getCanvasElement: () => canvasRef.value,
  getViewportElement: () => viewportRef.value
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
