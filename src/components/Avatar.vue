<template>
  <div
    class="avatar"
    :class="[genderClass, { deceased: isDeceased }]"
    :style="boxStyle"
  >
    <img
      v-if="imageSrc && !imgFailed"
      :src="imageSrc"
      :alt="person?.name || ''"
      class="avatar-img"
      @error="imgFailed = true"
    />
    <span v-else class="avatar-text">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { avatarText } from '../utils/family.js'

const props = defineProps({
  person: { type: Object, default: null },
  size: { type: Number, default: 34 }
})

const imgFailed = ref(false)

// 切换人物时重置图片失败标记
watch(() => props.person?.avatar, () => { imgFailed.value = false })

const imageSrc = computed(() => {
  const a = props.person?.avatar
  return typeof a === 'string' && a.trim() ? a.trim() : ''
})

const isDeceased = computed(() => !!props.person?.deathYear)
const genderClass = computed(() => (props.person?.gender === 'female' ? 'female' : 'male'))

const maxLen = computed(() => (props.size < 26 ? 1 : 2))
const text = computed(() => avatarText(props.person?.name, maxLen.value))

const boxStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  fontSize: Math.round(props.size * 0.42) + 'px',
  borderWidth: (props.size < 24 ? 1.5 : 2) + 'px'
}))
</script>

<style scoped>
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-style: solid;
  border-color: transparent;
  font-weight: 600;
  line-height: 1;
  user-select: none;
}

.avatar.male {
  background: var(--color-male-bg, #eaf1f8);
  color: var(--color-male, #3b6ea5);
  border-color: var(--color-male, #3b6ea5);
}

.avatar.female {
  background: var(--color-female-bg, #f9eded);
  color: var(--color-female, #c4716e);
  border-color: var(--color-female, #c4716e);
}

/* 已故：统一灰色 + 轻度去色 */
.avatar.deceased {
  background: var(--color-deceased-bg, #efebe5) !important;
  color: var(--color-deceased, #9c958a) !important;
  border-color: var(--color-deceased, #9c958a) !important;
  filter: grayscale(0.55);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  letter-spacing: -1px;
}
</style>
