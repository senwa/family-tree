<template>
  <div class="app">
    <Toolbar
      :scale="treeScale"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-view="handleResetView"
      @import-data="showImport = true"
      @export-data="handleExport"
      @export-image="handleExportImage"
      @print="handlePrint"
      @load-sample="handleLoadSample"
      @show-stats="showStats = true"
    />
    <SearchBar
      ref="searchBarRef"
      :max-gen="maxGeneration"
      :result-count="searchResults.length"
      @search="handleSearch"
      @clear="handleClearSearch"
    />
    <FamilyTree
      ref="treeRef"
      :family-data="familyData"
      :highlight-ids="highlightIds"
      @select="handleSelect"
    />
    <PersonDetail
      :person="selectedPerson"
      @close="closeDetail"
      @select="handleSelect"
      @edit="handleEdit"
      @add-child="handleAddChild"
      @delete="handleDeletePerson"
      @edit-partner="handleEditPartner"
    />
    <ImportDialog
      :visible="showImport"
      @close="showImport = false"
      @imported="handleImported"
    />
    <EditPersonDialog
      :visible="editDialog.visible"
      :mode="editDialog.mode"
      :person="editDialog.person"
      :parent-spouses="editDialog.parentSpouses"
      @close="editDialog.visible = false"
      @save="handleSavePerson"
    />
    <StatsPanel
      :visible="showStats"
      :family-data="familyData"
      @close="showStats = false"
    />

    <!-- 操作提示 -->
    <div class="help-hint">
      💡 滚轮缩放 · 拖拽平移 · 点击查看详情
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import Toolbar from './components/Toolbar.vue'
import SearchBar from './components/SearchBar.vue'
import FamilyTree from './components/FamilyTree.vue'
import PersonDetail from './components/PersonDetail.vue'
import ImportDialog from './components/ImportDialog.vue'
import EditPersonDialog from './components/EditPersonDialog.vue'
import StatsPanel from './components/StatsPanel.vue'
import { useFamilyData } from './composables/useFamilyData.js'
import { exportTreeImage } from './utils/exportImage.js'
import { getSpouses } from './utils/family.js'

const {
  familyData,
  selectedPerson,
  highlightIds,
  maxGeneration,
  searchResults,
  searchTerm,
  filterGeneration,
  filterGender,
  filterStatus,
  performSearch,
  clearSearch,
  selectPerson,
  closeDetail,
  loadSampleData,
  importJSON,
  exportJSON,
  addChild,
  updatePerson,
  deletePerson,
  isRoot,
  findNodeById,
  findParent
} = useFamilyData()

const treeRef = ref(null)
const searchBarRef = ref(null)
const showImport = ref(false)
const showStats = ref(false)

const treeScale = computed(() => treeRef.value?.scale ?? 1)

function handleSelect(person) {
  selectPerson(person)
}

function handleZoomIn() {
  treeRef.value?.zoomIn()
}

function handleZoomOut() {
  treeRef.value?.zoomOut()
}

function handleResetView() {
  treeRef.value?.resetView()
}

function handleSearch({ term, generation, gender, status }) {
  searchTerm.value = term
  filterGeneration.value = generation
  filterGender.value = gender
  filterStatus.value = status
  performSearch()
}

function handleClearSearch() {
  clearSearch()
}

function handleExport() {
  exportJSON()
}

function handleLoadSample() {
  loadSampleData()
  clearSearch()
  handleResetView()
}

function handleImported(data) {
  familyData.value = data
  clearSearch()
  handleResetView()
}

// ===== 成员增删改 =====
const editDialog = ref({ visible: false, mode: 'edit', person: null, parentSpouses: [] })

// 计算某人的"生父/生母候选"= 其父/母节点的配偶列表
function spousesOfParentOf(nodeId) {
  if (!familyData.value || nodeId === familyData.value.id) return [] // 根节点无父
  const parent = findParent(familyData.value, nodeId)
  return parent ? getSpouses(parent) : []
}

function handleEdit(person) {
  editDialog.value = {
    visible: true,
    mode: 'edit',
    person,
    parentSpouses: spousesOfParentOf(person.id)
  }
}

function handleAddChild(person) {
  editDialog.value = {
    visible: true,
    mode: 'add',
    person,
    parentSpouses: getSpouses(person)
  }
}

function handleEditPartner(partnerId) {
  const partner = findNodeById(familyData.value, partnerId)
  if (partner) {
    closeDetail()
    editDialog.value = {
      visible: true,
      mode: 'edit',
      person: partner,
      parentSpouses: spousesOfParentOf(partnerId)
    }
  }
}

function handleDeletePerson(person) {
  if (!person) return
  if (isRoot(person.id)) {
    alert('根节点（家族始祖）不可删除。')
    return
  }
  const hasDescendants = person.children && person.children.length > 0
  const msg = hasDescendants
    ? `确定删除「${person.name}」及其所有后代吗？此操作不可撤销。`
    : `确定删除「${person.name}」吗？此操作不可撤销。`
  if (!confirm(msg)) return
  deletePerson(person.id)
  closeDetail()
  clearSearch()
}

function handleSavePerson({ mode, id, data }) {
  if (mode === 'add') {
    const newChild = addChild(id, data)
    editDialog.value.visible = false
    clearSearch()
    if (newChild) selectPerson(newChild)
  } else {
    updatePerson(id, data)
    editDialog.value.visible = false
    // 选中节点是同一引用，原地更新后详情自动刷新
  }
}

// ===== 导出图片 / 打印 =====
async function handleExportImage() {
  if (!familyData.value) return
  // 先自适应全览，确保全部成员完整落在可视区内
  handleResetView()
  await nextTick()
  // 等待画布 transform 过渡（0.05s）结束再捕获，避免取到中间态位移
  await new Promise(resolve => setTimeout(resolve, 80))
  // 所见即所得：捕获可视区域而非画布本身
  const el = treeRef.value?.getViewportElement?.()
  if (!el) return
  try {
    await exportTreeImage(el)
  } catch (e) {
    alert('导出图片失败: ' + (e?.message || e))
  }
}

function handlePrint() {
  if (!familyData.value) return
  handleResetView()
  nextTick(() => window.print())
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.help-hint {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  pointer-events: none;
  z-index: 100;
  opacity: 0.7;
  transition: opacity 0.3s;
  white-space: nowrap;
}
</style>
