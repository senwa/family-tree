<template>
  <Teleport to="body">
    <div v-if="person" class="detail-overlay" @click.self="$emit('close')">
      <div class="detail-modal">
        <button class="detail-close" @click="$emit('close')">×</button>

        <div class="detail-header">
          <Avatar :person="person" :size="52" />
          <h2 class="detail-name">{{ person.name }}</h2>
          <span class="detail-gen-badge">第{{ person.generation }}代</span>
          <span v-if="person.deathYear" class="detail-deceased-badge">已故</span>
        </div>

        <div class="detail-body">
          <div class="detail-section">
            <h3>基本信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">性别</span>
                <span class="detail-value">{{ person.gender === 'male' ? '男' : '女' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">出生</span>
                <span class="detail-value">{{ person.birthYear || '不详' }}年</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">逝世</span>
                <span class="detail-value">{{ person.deathYear ? person.deathYear + '年' : '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">享年</span>
                <span class="detail-value">{{ ageText }}</span>
              </div>
            </div>
          </div>

          <div v-if="spouses.length" class="detail-section">
            <h3>配偶 <span class="section-count">{{ spouses.length }}</span></h3>
            <div v-for="(sp, idx) in spouses" :key="idx" class="spouse-block">
              <div class="spouse-info">
                <span class="spouse-icon" :class="{ 'icon-female': sp.gender === 'female' }">{{ sp.gender === 'male' ? '♂' : '♀' }}</span>
                <span class="spouse-name">{{ sp.name }}</span>
                <span class="spouse-years">
                  {{ sp.birthYear || '?' }} - {{ sp.deathYear || '?' }}
                </span>
              </div>
              <p v-if="sp.bio" class="detail-bio spouse-bio">{{ sp.bio }}</p>
            </div>
          </div>

          <div v-if="person.spouseOf" class="detail-section">
            <h3>配偶于</h3>
            <p>{{ person.spouseOf }}</p>
          </div>

          <div v-if="person.bio" class="detail-section">
            <h3>简介</h3>
            <p class="detail-bio">{{ person.bio }}</p>
          </div>

          <div v-if="person.children && person.children.length > 0" class="detail-section">
            <h3>子女</h3>
            <div class="children-list">
              <div
                v-for="child in person.children"
                :key="child.id"
                class="child-item"
                @click="$emit('select', child)"
              >
                <span class="child-icon" :class="{ 'icon-female': child.gender === 'female' }">{{ child.gender === 'male' ? '♂' : '♀' }}</span>
                <span class="child-name">{{ child.name }}</span>
                <span v-if="birthParent(child)" class="child-parent">{{ birthParent(child).role }}：{{ birthParent(child).name }}</span>
                <span class="child-years">{{ child.birthYear || '?' }}年</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div v-if="isRealNode" class="detail-actions">
          <button class="action-pill edit" @click="$emit('edit', person)">✏️ 编辑</button>
          <button class="action-pill add" @click="$emit('addChild', person)">➕ 添加子女</button>
          <button class="action-pill del" @click="$emit('delete', person)">🗑️ 删除</button>
        </div>
        <div v-else class="detail-actions">
          <button v-if="person.partnerId" class="action-pill edit" @click="$emit('editPartner', person.partnerId)">
            ✏️ 编辑家庭信息
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import Avatar from './Avatar.vue'
import { getSpouses } from '../utils/family.js'

const props = defineProps({
  person: { type: Object, default: null }
})

defineEmits(['close', 'select', 'edit', 'addChild', 'delete', 'editPartner'])

const spouses = computed(() => getSpouses(props.person))

// 解析某子女的生父/生母（基于其 birthSpouseIndex 指向当前人物的某位配偶）
function birthParent(child) {
  const idx = child?.birthSpouseIndex
  if (idx === undefined || idx === null || idx === '') return null
  const list = spouses.value
  if (idx < 0 || idx >= list.length) return null
  const sp = list[idx]
  return { name: sp.name, role: sp.gender === 'female' ? '母' : '父' }
}

// 是否为真实节点（非配偶合成对象）
const isRealNode = computed(() => !!props.person && !props.person.spouseOf)

const ageText = computed(() => {
  if (!props.person?.birthYear) return '不详'
  const end = props.person.deathYear || new Date().getFullYear()
  const age = parseInt(end) - parseInt(props.person.birthYear)
  return age > 0 ? age + '岁' : '不详'
})
</script>

<style scoped>
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  border-top: 4px solid #8b0000;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.detail-close:hover {
  background: #f5f5f5;
  color: #333;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-deceased-badge {
  background: var(--color-deceased, #9c958a);
  color: #fff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  letter-spacing: 1px;
}

.detail-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.detail-gen-badge {
  background: #8b0000;
  color: #fff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h3 {
  font-size: 14px;
  color: #8b0000;
  border-bottom: 1px solid #f0e0c0;
  padding-bottom: 4px;
  margin-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 11px;
  color: #999;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.detail-bio {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.spouse-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef5e7;
  border-radius: 8px;
}

.spouse-icon {
  font-size: 16px;
  color: var(--color-male, #3b6ea5);
}

.spouse-icon.icon-female {
  color: var(--color-female, #c4716e);
}

.spouse-name {
  font-weight: 600;
  color: #333;
}

.spouse-years {
  font-size: 12px;
  color: #999;
}

.section-count {
  display: inline-block;
  font-size: 11px;
  background: #f0e0c0;
  color: #8b0000;
  padding: 0 6px;
  border-radius: 10px;
  margin-left: 2px;
}

.spouse-block {
  margin-bottom: 8px;
}

.spouse-block:last-child {
  margin-bottom: 0;
}

.spouse-bio {
  margin-top: 4px;
  font-size: 13px;
  color: #777;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #faf8f3;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.child-item:hover {
  background: #f5e6c8;
}

.child-icon {
  font-size: 14px;
  color: var(--color-male, #3b6ea5);
}

.child-icon.icon-female {
  color: var(--color-female, #c4716e);
}

.child-name {
  font-weight: 500;
  color: #333;
}

.child-parent {
  font-size: 11px;
  color: #9c8a6a;
  background: #f5ecd6;
  padding: 1px 6px;
  border-radius: 8px;
  white-space: nowrap;
}

.child-years {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0e0c0;
  flex-wrap: wrap;
}

.action-pill {
  flex: 1;
  min-width: 88px;
  padding: 8px 10px;
  border: 1px solid #d4c5a0;
  border-radius: 20px;
  background: #faf8f3;
  color: #555;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}

.action-pill:hover {
  background: #fef5e7;
  border-color: #8b0000;
}

.action-pill.edit { color: #8b0000; }
.action-pill.add { color: #2e7d32; }
.action-pill.del { color: #c62828; }

.action-pill.del:hover {
  background: #fde8e8;
  border-color: #c62828;
}
</style>
