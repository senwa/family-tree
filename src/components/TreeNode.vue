<template>
  <div class="tree-node-wrapper" ref="wrapperRef">
    <!-- 生母/生父连线叠加层 -->
    <svg class="birth-lines" aria-hidden="true">
      <path v-for="(p, i) in accentPaths" :key="i" :class="p.cls" :d="p.d" />
    </svg>
    <!-- 当前节点 -->
    <div class="node-container" ref="nodeRowRef">
      <div
        class="node-card"
        ref="cardRef"
        :class="{
          'node-male': person.gender === 'male',
          'node-female': person.gender === 'female',
          'node-highlight': isHighlighted,
          'node-deceased': person.deathYear
        }"
        @click="$emit('select', person)"
      >
        <Avatar :person="person" :size="34" />
        <div class="node-info">
          <div class="node-name">{{ person.name }}</div>
          <div class="node-years">
            {{ person.birthYear }}{{ person.deathYear ? ' - ' + person.deathYear : ' -' }}
          </div>
        </div>
        <div class="node-gen">第{{ person.generation }}代</div>
        <div v-if="person.deathYear" class="deceased-badge">已故</div>
      </div>
      <!-- 配偶信息（支持多个） -->
      <div v-if="spouses.length" class="spouses-row">
        <div
          v-for="(spouse, idx) in spouses"
          :key="(person.id || '') + '-spouse-' + idx"
          class="spouse-card"
          :class="{
            'spouse-male': spouse.gender === 'male',
            'spouse-female': spouse.gender === 'female'
          }"
          :ref="el => setSpouseRef(idx, el)"
          @click="$emit('select', {
            ...spouse,
            id: (person.id || '') + '-spouse-' + idx,
            generation: person.generation,
            children: [],
            spouseOf: person.name,
            partnerId: person.id,
            spouseIndex: idx
          })"
        >
          <Avatar :person="spouse" :size="20" />
          <span class="spouse-label">{{ spouseLabel(idx) }}</span>
          <span class="spouse-name">{{ spouse.name }}</span>
        </div>
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="hasChildren" class="children-container" ref="childrenBoxRef">
      <!-- 父到子的垂直连接线 -->
      <div class="vline-parent"></div>
      <div class="children-row">
        <div
          v-for="(child, index) in person.children"
          :key="child.id"
          class="child-branch"
          :class="{
            'branch-first': index === 0,
            'branch-last': index === person.children.length - 1,
            'branch-only': person.children.length === 1
          }"
        >
          <!-- 水平连接线 -->
          <div v-if="person.children.length > 1" class="hline"></div>
          <!-- 子节点垂直连线 -->
          <div class="vline-child" :ref="el => setChildLineRef(index, el)"></div>
          <TreeNode
            :person="child"
            :highlight-ids="highlightIds"
            @select="$emit('select', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Avatar from './Avatar.vue'
import { getSpouses, spouseLabel } from '../utils/family.js'

const props = defineProps({
  person: { type: Object, required: true },
  highlightIds: { type: Set, default: () => new Set() }
})

defineEmits(['select'])

const isHighlighted = computed(() => props.highlightIds.has(props.person.id))
const hasChildren = computed(() => props.person.children && props.person.children.length > 0)
const spouses = computed(() => getSpouses(props.person))

// ===== 生母/生父连线（SVG 叠加层）=====
// 仅当某子女标注了 birthSpouseIndex 时，从对应配偶卡片连一条曲线到该子女上方。
const wrapperRef = ref(null)
const nodeRowRef = ref(null)        // .node-container（卡片+配偶一行）
const cardRef = ref(null)           // .node-card（本人卡片）
const childrenBoxRef = ref(null)    // .children-container（子树）
const spouseEls = ref(new Map())    // spouse idx -> DOM 元素
const childLineEls = ref(new Map()) // child index -> .vline-child DOM 元素
const accentPaths = ref([])         // 计算出的 SVG path

function setSpouseRef(idx, el) {
  if (el) spouseEls.value.set(idx, el)
  else spouseEls.value.delete(idx)
}
function setChildLineRef(idx, el) {
  if (el) childLineEls.value.set(idx, el)
  else childLineEls.value.delete(idx)
}

// 需要画线的子女列表
const birthLinks = computed(() => {
  const kids = props.person.children || []
  const out = []
  kids.forEach((child, index) => {
    const idx = child && child.birthSpouseIndex
    if (idx === undefined || idx === null || idx === '') return
    out.push({ childId: child.id, childIndex: index, spouseIdx: Number(idx) })
  })
  return out
})

// 量算：所有元素共享画布 transform，用 getBoundingClientRect 相减可抵消缩放/平移
function measure() {
  if (!wrapperRef.value) { accentPaths.value = []; return }

  // 子树水平对齐到本人卡片中心（忽略配偶卡片占位），
  // 使 vline-parent 正好落在卡片底边中点，而不是卡片与配偶卡片之间的空隙。
  // 卡片在行的左侧、配偶在右侧，卡片中心位于行中心左方 (row-card)/2，
  // 因此需向左平移（负值），方向不能反
  const card = cardRef.value
  const row = nodeRowRef.value
  const box = childrenBoxRef.value
  if (card && row && box) {
    // offsetWidth 不受画布缩放影响
    const shift = (card.offsetWidth - row.offsetWidth) / 2
    box.style.transform = shift < -0.5 ? `translateX(${shift.toFixed(1)}px)` : ''
  } else if (box) {
    box.style.transform = ''
  }

  const wRect = wrapperRef.value.getBoundingClientRect()
  const wLeft = wRect.left
  const wTop = wRect.top
  const paths = []
  for (const link of birthLinks.value) {
    const spouseEl = spouseEls.value.get(link.spouseIdx)
    const childEl = childLineEls.value.get(link.childIndex)
    if (!spouseEl || !childEl) continue
    const sRect = spouseEl.getBoundingClientRect()
    const cRect = childEl.getBoundingClientRect()
    const sx = (sRect.left + sRect.right) / 2 - wLeft
    const sy = sRect.bottom - wTop
    const ex = (cRect.left + cRect.right) / 2 - wLeft
    const ey = cRect.top - wTop
    if (!isFinite(sx) || !isFinite(ex) || Math.abs(sy - ey) < 2) continue
    // 直角折线：先竖直向下，再水平横移，最后落到子线上。
    // 子树对齐本人卡片中心后，配偶卡片与子线可能相距很远，
    // 平缓贝塞尔会变成一条近乎水平的长弧线，看起来像悬空的横线
    const midY = (sy + ey) / 2
    const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${sx.toFixed(1)} ${midY.toFixed(1)} L ${ex.toFixed(1)} ${midY.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`
    const sp = spouses.value[link.spouseIdx]
    const cls = sp && sp.gender === 'male' ? 'birth-line-male' : 'birth-line-female'
    paths.push({ d, cls })
  }
  accentPaths.value = paths
}

let raf = 0
function scheduleMeasure() {
  if (raf) cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => { raf = 0; measure() })
}

let ro = null
onMounted(() => {
  nextTick(scheduleMeasure)
  if (typeof ResizeObserver !== 'undefined' && wrapperRef.value) {
    ro = new ResizeObserver(() => scheduleMeasure())
    ro.observe(wrapperRef.value)
  }
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (ro) { ro.disconnect(); ro = null }
})

// 子女或配偶变化时重新量算
watch(
  () => birthLinks.value.map(l => (l.childId || '') + ':' + l.spouseIdx).join('|'),
  () => nextTick(scheduleMeasure)
)
</script>

<style scoped>
.tree-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* ===== 生母/生父连线叠加层 ===== */
.birth-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 0;
}

.birth-line-female,
.birth-line-male {
  fill: none;
  stroke-width: 2;
  stroke-dasharray: 5 4;
  opacity: 0.75;
}

.birth-line-female {
  stroke: var(--color-female, #c4716e);
}

.birth-line-male {
  stroke: var(--color-male, #3b6ea5);
}

.node-container {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.node-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff;
  border: 2px solid var(--color-gold, #d4a853);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 1;
}

.node-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
}

/* 性别配色 */
.node-male {
  border-color: var(--color-male, #3b6ea5);
  background: var(--color-male-bg, #eaf1f8);
}

.node-female {
  border-color: var(--color-female, #c4716e);
  background: var(--color-female-bg, #f9eded);
}

/* 已故：灰色 somber 处理，置于性别之后以覆盖 */
.node-deceased {
  border-color: var(--color-deceased, #9c958a) !important;
  background: var(--color-deceased-bg, #efebe5) !important;
  opacity: 0.9;
}

/* 搜索高亮优先级最高 */
.node-highlight {
  background: #fff8e1 !important;
  border-color: #ff6f00 !important;
  box-shadow: 0 0 12px rgba(255,111,0,0.45) !important;
  opacity: 1 !important;
}

/* 已故角标 */
.deceased-badge {
  position: absolute;
  top: -8px;
  left: -6px;
  font-size: 10px;
  background: var(--color-deceased, #9c958a);
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  letter-spacing: 1px;
}

.node-info {
  display: flex;
  flex-direction: column;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.node-years {
  font-size: 11px;
  color: #999;
}

.node-gen {
  position: absolute;
  top: -8px;
  right: -4px;
  font-size: 10px;
  background: var(--color-primary, #8b0000);
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.spouses-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  max-width: 220px;
}

.spouse-card {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-bg-warm, #fef5e7);
  border: 1px dashed var(--color-gold, #d4a853);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.spouse-card:hover {
  background: #fde9b7;
  border-color: var(--color-gold-dark, #b8860b);
}

.spouse-male {
  background: var(--color-male-bg, #eaf1f8);
  border-color: var(--color-male, #3b6ea5);
}

.spouse-female {
  background: var(--color-female-bg, #f9eded);
  border-color: var(--color-female, #c4716e);
}

.spouse-label {
  color: var(--color-primary, #8b0000);
  font-weight: 600;
  font-size: 10px;
}

.spouse-name {
  color: #666;
}

/* ===== 连线系统 ===== */

.children-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* 父节点下方的竖线 */
.vline-parent {
  width: 2px;
  height: 24px;
  background: var(--color-gold, #d4a853);
}

.children-row {
  display: flex;
  position: relative;
}

/* 水平连接线由各子分支内的 .hline 拼接：
   首子画右半、末子画左半、中间画整条，正好从第一个子节点中心连到最后一个子节点中心 */

.child-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 16px;
}

/* 子节点上方的竖线 */
.vline-child {
  width: 2px;
  height: 24px;
  background: var(--color-gold, #d4a853);
}

/* 水平连接线（多子节点时） */
.hline {
  position: absolute;
  top: 0;
  height: 2px;
  background: var(--color-gold, #d4a853);
  width: 100%;
  left: 0;
}

/* 第一个子节点：横线只覆盖右半部分。
   注意必须用直接子代选择器 > ：TreeNode 递归渲染时所有层级共用同一个 scope，
   后代选择器会让"长子分支"内的所有后代 hline 误命中本规则（曾导致末子横线镜像） */
.branch-first > .hline {
  left: 50%;
  width: 50%;
}

/* 最后一个子节点：横线只覆盖左半部分 */
.branch-last > .hline {
  width: 50%;
}

/* 唯一子节点：不需要横线 */
.branch-only > .hline {
  display: none;
}
</style>
