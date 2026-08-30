import { ref, computed, watch } from 'vue'
import { sampleFamilyData } from '../data/sample.js'
import { getSpouses, hasSpouse } from '../utils/family.js'

const STORAGE_KEY = 'family-tree-data-v1'

export function useFamilyData() {
  const familyData = ref(null)
  const searchTerm = ref('')
  const filterGeneration = ref(0) // 0 = all
  const filterGender = ref('') // '' | 'male' | 'female'
  const filterStatus = ref('') // '' | 'living' | 'deceased' | 'unmarried' | 'married'
  const selectedPerson = ref(null)
  const highlightIds = ref(new Set())

  // 初始化加载示例数据
  function loadSampleData() {
    familyData.value = JSON.parse(JSON.stringify(sampleFamilyData))
  }

  // 扁平化家族树，返回所有成员数组
  function flattenTree(node, parent = null) {
    if (!node) return []
    const result = [{ ...node, parentName: parent?.name || '', parentId: parent?.id || '' }]
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        result.push(...flattenTree(child, node))
      }
    }
    return result
  }

  // 所有成员列表
  const allMembers = computed(() => {
    if (!familyData.value) return []
    return flattenTree(familyData.value)
  })

  // 最大世代数
  const maxGeneration = computed(() => {
    if (allMembers.value.length === 0) return 0
    return Math.max(...allMembers.value.map(m => m.generation))
  })

  // 搜索匹配的成员
  const searchResults = computed(() => {
    let results = allMembers.value
    if (searchTerm.value.trim()) {
      const term = searchTerm.value.trim().toLowerCase()
      results = results.filter(m => m.name.toLowerCase().includes(term))
    }
    if (filterGeneration.value > 0) {
      results = results.filter(m => m.generation === filterGeneration.value)
    }
    if (filterGender.value) {
      results = results.filter(m => m.gender === filterGender.value)
    }
    switch (filterStatus.value) {
      case 'living':
        results = results.filter(m => !m.deathYear)
        break
      case 'deceased':
        results = results.filter(m => !!m.deathYear)
        break
      case 'unmarried':
        results = results.filter(m => !hasSpouse(m))
        break
      case 'married':
        results = results.filter(m => hasSpouse(m))
        break
    }
    return results
  })

  // 执行搜索，更新高亮 ID
  function performSearch() {
    const ids = new Set(searchResults.value.map(m => m.id))
    highlightIds.value = ids
  }

  // 清除搜索
  function clearSearch() {
    searchTerm.value = ''
    filterGeneration.value = 0
    filterGender.value = ''
    filterStatus.value = ''
    highlightIds.value = new Set()
  }

  // 选择人物
  function selectPerson(person) {
    selectedPerson.value = person
  }

  // 关闭详情
  function closeDetail() {
    selectedPerson.value = null
  }

  // 根据ID在树中查找节点
  function findNodeById(node, id) {
    if (!node) return null
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id)
        if (found) return found
      }
    }
    return null
  }

  // 查找某节点的父节点
  function findParent(root, targetId) {
    if (!root || !root.children) return null
    for (const child of root.children) {
      if (child.id === targetId) return root
      const found = findParent(child, targetId)
      if (found) return found
    }
    return null
  }

  // 生成唯一 ID
  function generateId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  }

  // 判断是否为根节点
  function isRoot(id) {
    return !!familyData.value && familyData.value.id === id
  }

  // 添加子女
  function addChild(parentId, childData) {
    const parent = findNodeById(familyData.value, parentId)
    if (!parent) return null
    const newChild = {
      id: generateId(),
      name: (childData.name || '').trim() || '未命名',
      gender: childData.gender || 'male',
      birthYear: childData.birthYear || '',
      deathYear: childData.deathYear || '',
      avatar: childData.avatar || '',
      generation: (Number(parent.generation) || 1) + 1,
      birthSpouseIndex: childData.birthSpouseIndex ?? null,
      bio: childData.bio || '',
      spouses: Array.isArray(childData.spouses)
        ? childData.spouses.filter(s => s && s.name)
        : (childData.spouse && childData.spouse.name ? [childData.spouse] : []),
      children: []
    }
    if (!Array.isArray(parent.children)) parent.children = []
    parent.children.push(newChild)
    return newChild
  }

  // 更新成员信息（仅更新白名单字段，保护 id/children 结构）
  function updatePerson(id, updates) {
    const node = findNodeById(familyData.value, id)
    if (!node) return false
    const allowed = ['name', 'gender', 'birthYear', 'deathYear', 'avatar', 'bio', 'birthSpouseIndex']
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        node[key] = updates[key]
      }
    }
    // 写入 spouses 数组；同时清除旧的单数 spouse 字段，避免重复展示
    if (Array.isArray(updates.spouses)) {
      node.spouses = updates.spouses.filter(s => s && s.name)
      node.spouse = null
    }
    return true
  }

  // 删除成员（含其后代），根节点禁止删除
  function deletePerson(id) {
    if (!familyData.value) return false
    if (isRoot(id)) return false
    const parent = findParent(familyData.value, id)
    if (parent && Array.isArray(parent.children)) {
      const idx = parent.children.findIndex(c => c.id === id)
      if (idx >= 0) {
        parent.children.splice(idx, 1)
        return true
      }
    }
    return false
  }

  // 校验 JSON 数据格式
  function validateData(data) {
    const errors = []
    if (!data || typeof data !== 'object') {
      errors.push('数据必须是一个对象')
      return errors
    }
    if (!data.id) errors.push('缺少必填字段: id')
    if (!data.name) errors.push('缺少必填字段: name')
    if (!data.generation) errors.push('缺少必填字段: generation')
    if (data.children && !Array.isArray(data.children)) {
      errors.push('children 必须是数组')
    }
    if (data.spouses !== undefined && !Array.isArray(data.spouses)) {
      errors.push('spouses 必须是数组')
    }
    // 递归校验子节点
    if (data.children) {
      for (let i = 0; i < data.children.length; i++) {
        const childErrors = validateData(data.children[i])
        for (const err of childErrors) {
          errors.push(`children[${i}]: ${err}`)
        }
      }
    }
    return errors
  }

  // 导入 JSON 文件
  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          const errors = validateData(data)
          if (errors.length > 0) {
            reject(new Error('数据格式错误:\n' + errors.join('\n')))
            return
          }
          familyData.value = data
          clearSearch()
          resolve(data)
        } catch (err) {
          reject(new Error('JSON 解析失败: ' + err.message))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  // 导出 JSON 文件
  function exportJSON() {
    if (!familyData.value) return
    const json = JSON.stringify(familyData.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'family-tree.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ===== 本地持久化 =====
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.warn('读取本地家谱数据失败:', e)
    }
    return null
  }

  function saveToStorage() {
    try {
      if (familyData.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(familyData.value))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (e) {
      console.warn('保存家谱数据到本地失败:', e)
    }
  }

  // 清除本地存储（用于彻底重置）
  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) { /* ignore */ }
  }

  // 初始化：优先从本地恢复，否则加载示例数据
  const stored = loadFromStorage()
  if (stored) {
    familyData.value = stored
  } else {
    loadSampleData()
  }

  // 数据变化时自动持久化（深度监听）
  watch(familyData, saveToStorage, { deep: true })

  return {
    familyData,
    searchTerm,
    filterGeneration,
    filterGender,
    filterStatus,
    selectedPerson,
    highlightIds,
    allMembers,
    maxGeneration,
    searchResults,
    loadSampleData,
    performSearch,
    clearSearch,
    selectPerson,
    closeDetail,
    findNodeById,
    findParent,
    generateId,
    isRoot,
    addChild,
    updatePerson,
    deletePerson,
    importJSON,
    exportJSON,
    validateData,
    clearStorage,
    saveToStorage
  }
}
