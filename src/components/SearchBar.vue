<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        v-model="searchTerm"
        placeholder="搜索家族成员..."
        class="search-input"
        @input="onSearch"
        @keydown.enter="onSearch"
      />
      <button v-if="hasFilter" class="search-clear" @click="onClear">✕</button>
    </div>
    <select v-model="filterGeneration" class="filter-select" @change="onSearch">
      <option :value="0">全部世代</option>
      <option v-for="g in maxGen" :key="g" :value="g">第{{ g }}代</option>
    </select>
    <select v-model="filterGender" class="filter-select" @change="onSearch">
      <option value="">全部性别</option>
      <option value="male">男</option>
      <option value="female">女</option>
    </select>
    <select v-model="filterStatus" class="filter-select" @change="onSearch">
      <option value="">全部状态</option>
      <option value="living">在世</option>
      <option value="deceased">已故</option>
      <option value="unmarried">未婚</option>
      <option value="married">已婚</option>
    </select>
    <div v-if="resultCount > 0" class="search-count">
      找到 <strong>{{ resultCount }}</strong> 人
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  maxGen: { type: Number, default: 4 },
  resultCount: { type: Number, default: 0 }
})

const emit = defineEmits(['search', 'clear'])

const searchTerm = ref('')
const filterGeneration = ref(0)
const filterGender = ref('')
const filterStatus = ref('')

const hasFilter = computed(() =>
  !!(searchTerm.value || filterGeneration.value || filterGender.value || filterStatus.value)
)

function onSearch() {
  emit('search', {
    term: searchTerm.value,
    generation: filterGeneration.value,
    gender: filterGender.value,
    status: filterStatus.value
  })
}

function onClear() {
  searchTerm.value = ''
  filterGeneration.value = 0
  filterGender.value = ''
  filterStatus.value = ''
  emit('clear')
}

// 暴露给父组件
defineExpose({ searchTerm, filterGeneration, filterGender, filterStatus })
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e8dcc8;
  flex-wrap: wrap;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #faf8f3;
  border: 1px solid #d4c5a0;
  border-radius: 20px;
  padding: 4px 12px;
  flex: 1;
  min-width: 180px;
  max-width: 320px;
  transition: border-color 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: #8b0000;
}

.search-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  width: 100%;
  padding: 2px 0;
}

.search-input::placeholder {
  color: #bbb;
}

.search-clear {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.search-clear:hover {
  color: #8b0000;
  background: #fde8e8;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #d4c5a0;
  border-radius: 8px;
  background: #faf8f3;
  font-size: 13px;
  color: #555;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #8b0000;
}

.search-count {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

.search-count strong {
  color: #8b0000;
}
</style>
