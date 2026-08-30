<template>
  <Teleport to="body">
    <div v-if="visible" class="import-overlay" @click.self="$emit('close')">
      <div class="import-modal">
        <button class="import-close" @click="$emit('close')">×</button>
        <h2 class="import-title">📂 导入家谱数据</h2>

        <!-- 拖拽上传区域 -->
        <div
          class="drop-zone"
          :class="{ 'drop-active': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <div class="drop-icon">📄</div>
          <p class="drop-text">拖拽 JSON 文件到此处</p>
          <p class="drop-hint">或点击选择文件</p>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="file-input"
            @change="handleFileSelect"
          />
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="import-error">
          <span class="error-icon">⚠️</span>
          <span>{{ error }}</span>
        </div>

        <!-- 成功信息 -->
        <div v-if="success" class="import-success">
          <span class="success-icon">✅</span>
          <span>数据导入成功！共 {{ memberCount }} 位成员。</span>
        </div>

        <!-- 数据格式说明 -->
        <div class="format-hint">
          <h4>数据格式要求</h4>
          <pre class="format-code">{
  "id": "1",
  "name": "姓名",
  "gender": "male/female",
  "birthYear": "1920",
  "generation": 1,
  "spouse": { "name": "配偶" },
  "children": [...]
}</pre>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { getSpouses } from '../utils/family.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'imported'])

const fileInput = ref(null)
const isDragOver = ref(false)
const error = ref('')
const success = ref(false)
const memberCount = ref(0)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function processFile(file) {
  error.value = ''
  success.value = false

  if (!file.name.endsWith('.json')) {
    error.value = '请选择 .json 格式的文件'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      // 基本校验
      if (!data.id || !data.name) {
        error.value = '数据格式错误：缺少 id 或 name 字段'
        return
      }
      // 计算成员数
      memberCount.value = countMembers(data)
      success.value = true
      emit('imported', data)
      // 2秒后自动关闭
      setTimeout(() => {
        emit('close')
        success.value = false
      }, 2000)
    } catch (err) {
      error.value = 'JSON 解析失败: ' + err.message
    }
  }
  reader.onerror = () => {
    error.value = '文件读取失败'
  }
  reader.readAsText(file)
}

function countMembers(node) {
  let count = 1 + getSpouses(node).length
  if (node.children) {
    for (const child of node.children) {
      count += countMembers(child)
    }
  }
  return count
}
</script>

<style scoped>
.import-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.import-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 440px;
  width: 90%;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  border-top: 4px solid #d4a853;
}

.import-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.import-close:hover {
  color: #333;
}

.import-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px;
}

.drop-zone {
  border: 2px dashed #d4c5a0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #faf8f3;
  margin-bottom: 16px;
}

.drop-zone:hover,
.drop-active {
  border-color: #8b0000;
  background: #fef5e7;
}

.drop-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.drop-text {
  font-size: 14px;
  color: #555;
  margin: 0;
}

.drop-hint {
  font-size: 12px;
  color: #aaa;
  margin: 4px 0 0;
}

.file-input {
  display: none;
}

.import-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 12px;
  background: #fde8e8;
  border-radius: 8px;
  color: #8b0000;
  font-size: 13px;
  margin-bottom: 16px;
}

.import-success {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #e8f5e9;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 13px;
  margin-bottom: 16px;
}

.format-hint {
  margin-top: 8px;
}

.format-hint h4 {
  font-size: 13px;
  color: #888;
  margin: 0 0 6px;
}

.format-code {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 11px;
  color: #555;
  overflow-x: auto;
  margin: 0;
  line-height: 1.5;
}
</style>
