<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <h1 class="toolbar-title">📜 家谱</h1>
    </div>
    <div class="toolbar-right">
      <div class="zoom-controls">
        <button class="tool-btn" @click="$emit('zoomOut')" title="缩小">−</button>
        <span class="zoom-label">{{ zoomPercent }}%</span>
        <button class="tool-btn" @click="$emit('zoomIn')" title="放大">+</button>
        <button class="tool-btn" @click="$emit('resetView')" title="重置视图">⟲</button>
      </div>
      <div class="action-controls">
        <button class="tool-btn action-btn" @click="$emit('importData')" title="导入 JSON">
          📂 导入
        </button>
        <button class="tool-btn action-btn" @click="$emit('exportData')" title="导出 JSON">
          💾 导出
        </button>
        <button class="tool-btn action-btn" @click="$emit('exportImage')" title="导出为图片">
          🖼️ 图片
        </button>
        <button class="tool-btn action-btn" @click="$emit('print')" title="打印 / 保存为 PDF">
          🖨️ 打印
        </button>
        <button class="tool-btn action-btn" @click="$emit('showStats')" title="家族统计">
          📊 统计
        </button>
        <button class="tool-btn action-btn" @click="$emit('loadSample')" title="加载示例">
          🏠 示例
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scale: { type: Number, default: 1 }
})

defineEmits(['zoomIn', 'zoomOut', 'resetView', 'importData', 'exportData', 'exportImage', 'print', 'showStats', 'loadSample'])

const zoomPercent = computed(() => Math.round(props.scale * 100))
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: linear-gradient(135deg, #8b0000 0%, #a02020 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 2px 4px;
}

.zoom-label {
  font-size: 12px;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.tool-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tool-btn:hover {
  background: rgba(255,255,255,0.25);
  border-color: rgba(255,255,255,0.4);
}

.action-btn {
  font-size: 12px;
  padding: 4px 10px;
}

.action-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
