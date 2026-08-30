<template>
  <Teleport to="body">
    <div v-if="visible" class="stats-overlay" @click.self="$emit('close')">
      <div class="stats-modal">
        <button class="stats-close" @click="$emit('close')">×</button>
        <h2 class="stats-title">📊 家族概览</h2>

        <div v-if="!familyData" class="stats-empty">暂无数据</div>

        <template v-else>
          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">家族成员</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.maxGen }}</div>
              <div class="stat-label">世代数</div>
            </div>
            <div class="stat-card stat-male">
              <div class="stat-value">{{ stats.male }}</div>
              <div class="stat-label">男性 · {{ pct(stats.male, stats.total) }}%</div>
            </div>
            <div class="stat-card stat-female">
              <div class="stat-value">{{ stats.female }}</div>
              <div class="stat-label">女性 · {{ pct(stats.female, stats.total) }}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.living }}</div>
              <div class="stat-label">在世</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.deceased }}</div>
              <div class="stat-label">已故</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.couples }}</div>
              <div class="stat-label">有配偶</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.avgAge }}</div>
              <div class="stat-label">平均年龄</div>
            </div>
          </div>

          <!-- 男女比例条 -->
          <div class="ratio-bar">
            <div class="ratio-male" :style="{ width: pct(stats.male, stats.total) + '%' }"></div>
            <div class="ratio-female" :style="{ width: pct(stats.female, stats.total) + '%' }"></div>
          </div>
          <div class="ratio-legend">
            <span><i class="dot dot-male"></i>男 {{ stats.male }}</span>
            <span><i class="dot dot-female"></i>女 {{ stats.female }}</span>
          </div>

          <!-- 世代分布 -->
          <div class="dist-section">
            <h3 class="dist-title">世代分布</h3>
            <div class="dist-list">
              <div v-for="g in stats.genDist" :key="g.gen" class="dist-row">
                <span class="dist-gen">第{{ g.gen }}代</span>
                <div class="dist-track">
                  <div class="dist-fill" :style="{ width: g.width + '%' }"></div>
                </div>
                <span class="dist-count">{{ g.count }}人</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { hasSpouse } from '../utils/family.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  familyData: { type: Object, default: null }
})

defineEmits(['close'])

function flatten(node, acc = []) {
  if (!node) return acc
  acc.push(node)
  if (Array.isArray(node.children)) {
    for (const c of node.children) flatten(c, acc)
  }
  return acc
}

function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

const stats = computed(() => {
  const members = flatten(props.familyData)
  const total = members.length
  const male = members.filter(m => m.gender === 'male').length
  const female = members.filter(m => m.gender === 'female').length
  const deceased = members.filter(m => m.deathYear).length
  const couples = members.filter(m => hasSpouse(m)).length
  const maxGen = members.reduce((mx, m) => Math.max(mx, Number(m.generation) || 1), 0)

  // 平均年龄
  const yearNow = new Date().getFullYear()
  const ages = members
    .map(m => {
      const b = parseInt(m.birthYear)
      if (!b) return null
      const end = m.deathYear ? parseInt(m.deathYear) : yearNow
      return end - b
    })
    .filter(a => a && a > 0)
  const avgAge = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : '—'

  // 世代分布
  const genCounts = {}
  for (let g = 1; g <= maxGen; g++) genCounts[g] = 0
  for (const m of members) {
    const g = Number(m.generation) || 1
    genCounts[g] = (genCounts[g] || 0) + 1
  }
  const maxCount = Math.max(1, ...Object.values(genCounts))
  const genDist = Object.keys(genCounts).map(g => ({
    gen: Number(g),
    count: genCounts[g],
    width: Math.round((genCounts[g] / maxCount) * 100)
  }))

  return { total, male, female, deceased, living: total - deceased, couples, maxGen, avgAge, genDist }
})
</script>

<style scoped>
.stats-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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

.stats-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 520px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-top: 4px solid #d4a853;
}

.stats-close {
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

.stats-close:hover { color: #333; }

.stats-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px;
}

.stats-empty {
  text-align: center;
  color: #999;
  padding: 32px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card {
  background: #faf8f3;
  border: 1px solid #ecdcb8;
  border-radius: 10px;
  padding: 10px 6px;
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #8b0000;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

.stat-male .stat-value { color: var(--color-male, #3b6ea5); }
.stat-female .stat-value { color: #c4716e; }

.ratio-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 6px;
}

.ratio-male { background: var(--color-male, #3b6ea5); }
.ratio-female { background: #c4716e; }

.ratio-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
  margin-bottom: 18px;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.dot-male { background: var(--color-male, #3b6ea5); }
.dot-female { background: #c4716e; }

.dist-section { border-top: 1px solid #f0e0c0; padding-top: 14px; }

.dist-title {
  font-size: 14px;
  color: #8b0000;
  margin: 0 0 10px;
}

.dist-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dist-gen {
  font-size: 12px;
  color: #666;
  width: 52px;
  flex-shrink: 0;
}

.dist-track {
  flex: 1;
  height: 16px;
  background: #f5efe1;
  border-radius: 8px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4a853, #b8860b);
  border-radius: 8px;
  transition: width 0.4s ease;
}

.dist-count {
  font-size: 12px;
  color: #555;
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
