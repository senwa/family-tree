<template>
  <Teleport to="body">
    <div v-if="visible" class="edit-overlay" @click.self="$emit('close')">
      <div class="edit-modal">
        <button class="edit-close" @click="$emit('close')">×</button>
        <h2 class="edit-title">
          {{ mode === 'add' ? '➕ 添加子女' : '✏️ 编辑成员' }}
        </h2>
        <p v-if="mode === 'add' && person" class="edit-subtitle">
          将为 <strong>{{ person.name }}</strong> 添加一名子女（第 {{ (Number(person.generation) || 1) + 1 }} 代）
        </p>

        <div v-if="error" class="edit-error">
          <span>⚠️</span><span>{{ error }}</span>
        </div>

        <div class="form-body">
          <div class="form-row">
            <label class="form-label">姓名 <span class="req">*</span></label>
            <input v-model="form.name" type="text" class="form-input" placeholder="请输入姓名" />
          </div>

          <div class="form-row form-row-2">
            <div>
              <label class="form-label">性别</label>
              <select v-model="form.gender" class="form-input">
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div>
              <label class="form-label">世代</label>
              <input
                :value="mode === 'add' ? (Number(person?.generation) || 1) + 1 : form.generation"
                type="text" class="form-input form-readonly" readonly
              />
            </div>
          </div>

          <div class="form-row form-row-2">
            <div>
              <label class="form-label">出生年份</label>
              <input v-model="form.birthYear" type="text" class="form-input" placeholder="如 1980" />
            </div>
            <div>
              <label class="form-label">逝世年份</label>
              <input v-model="form.deathYear" type="text" class="form-input" placeholder="在世可留空" />
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">简介</label>
            <textarea v-model="form.bio" class="form-input form-textarea" rows="2" placeholder="生平、职业、事迹..."></textarea>
          </div>

          <div class="form-row">
            <label class="form-label">头像</label>
            <div class="avatar-field">
              <Avatar :person="avatarPreview" :size="44" class="avatar-preview" />
              <input
                v-model="form.avatar"
                type="text"
                class="form-input avatar-url-input"
                placeholder="图片 URL，或点右侧上传本地图片"
              />
              <button type="button" class="btn-mini" @click="avatarFileInput?.click()" title="上传本地图片">📷 上传</button>
              <button v-if="form.avatar" type="button" class="btn-mini btn-mini-danger" @click="form.avatar = ''" title="清除头像">清除</button>
              <input
                ref="avatarFileInput"
                type="file"
                accept="image/*"
                class="file-input-hidden"
                @change="handleAvatarFile"
              />
            </div>
          </div>

          <div v-if="parentSpouses.length" class="form-row">
            <label class="form-label">生父 / 生母（其父/母的配偶）</label>
            <select v-model="form.birthSpouseIndex" class="form-input">
              <option value="">未指定</option>
              <option v-for="(sp, idx) in parentSpouses" :key="idx" :value="idx">
                {{ spouseLabel(idx) }} · {{ sp.name }}（{{ sp.gender === 'female' ? '母' : '父' }}）
              </option>
            </select>
          </div>

          <!-- 配偶区（支持多个） -->
          <div class="spouse-section">
            <div class="spouse-section-head">
              <span class="spouse-section-title">配偶（{{ form.spouses.length }}）</span>
              <button type="button" class="btn-add-spouse" @click="addSpouse">➕ 添加配偶</button>
            </div>

            <div v-for="(sp, idx) in form.spouses" :key="idx" class="spouse-fields">
              <div class="spouse-fields-head">
                <span class="spouse-fields-label">{{ spouseLabel(idx) }}</span>
                <button type="button" class="btn-remove-spouse" @click="removeSpouse(idx)">✕ 移除</button>
              </div>
              <div class="form-row">
                <label class="form-label">配偶姓名</label>
                <input v-model="sp.name" type="text" class="form-input" placeholder="配偶姓名" />
              </div>
              <div class="form-row form-row-2">
                <div>
                  <label class="form-label">配偶性别</label>
                  <select v-model="sp.gender" class="form-input">
                    <option value="female">女</option>
                    <option value="male">男</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">出生年份</label>
                  <input v-model="sp.birthYear" type="text" class="form-input" placeholder="如 1982" />
                </div>
              </div>
              <div class="form-row">
                <label class="form-label">逝世年份</label>
                <input v-model="sp.deathYear" type="text" class="form-input" placeholder="在世可留空" />
              </div>
              <div class="form-row">
                <label class="form-label">配偶简介</label>
                <textarea v-model="sp.bio" class="form-input form-textarea" rows="2"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-cancel" @click="$emit('close')">取消</button>
          <button class="btn btn-save" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import Avatar from './Avatar.vue'
import { getSpouses, spouseLabel } from '../utils/family.js'
import { fileToResizedDataURL } from '../utils/image.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'edit' }, // 'add' | 'edit'
  person: { type: Object, default: null }, // edit: 被编辑者；add: 父节点
  parentSpouses: { type: Array, default: () => [] } // 其父/母的配偶列表，用于选择生父/生母
})

const emit = defineEmits(['close', 'save'])

const error = ref('')

const form = reactive({
  name: '',
  gender: 'male',
  generation: 1,
  birthYear: '',
  deathYear: '',
  bio: '',
  avatar: '',
  birthSpouseIndex: '',
  spouses: []
})

function blankSpouse() {
  return { name: '', gender: 'female', birthYear: '', deathYear: '', bio: '' }
}

function addSpouse() {
  form.spouses.push(blankSpouse())
}

function removeSpouse(idx) {
  form.spouses.splice(idx, 1)
}

// ===== 头像上传 =====
const avatarFileInput = ref(null)

const avatarPreview = computed(() => ({
  name: form.name || '新成员',
  gender: form.gender,
  deathYear: form.deathYear,
  avatar: form.avatar
}))

async function handleAvatarFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    form.avatar = await fileToResizedDataURL(file, 256, 0.85)
  } catch (err) {
    error.value = err?.message || '图片处理失败'
  }
  // 重置以便重复选择同一文件
  if (e.target) e.target.value = ''
}

function initForm() {
  error.value = ''
  if (props.mode === 'edit' && props.person) {
    const p = props.person
    form.name = p.name || ''
    form.gender = p.gender || 'male'
    form.generation = Number(p.generation) || 1
    form.birthYear = p.birthYear || ''
    form.deathYear = p.deathYear || ''
    form.bio = p.bio || ''
    form.avatar = p.avatar || ''
    form.birthSpouseIndex = (p.birthSpouseIndex !== undefined && p.birthSpouseIndex !== null) ? p.birthSpouseIndex : ''
    form.spouses = getSpouses(p).map(s => ({
      name: s.name || '',
      gender: s.gender || 'female',
      birthYear: s.birthYear || '',
      deathYear: s.deathYear || '',
      bio: s.bio || ''
    }))
  } else {
    // 添加模式：空白表单
    form.name = ''
    form.gender = 'male'
    form.generation = (Number(props.person?.generation) || 1) + 1
    form.birthYear = ''
    form.deathYear = ''
    form.bio = ''
    form.avatar = ''
    form.birthSpouseIndex = ''
    form.spouses = []
  }
}

watch(
  () => [props.visible, props.person, props.mode],
  () => {
    if (props.visible) initForm()
  },
  { immediate: true }
)

function handleSave() {
  if (!form.name.trim()) {
    error.value = '请填写姓名'
    return
  }
  const data = {
    name: form.name.trim(),
    gender: form.gender,
    birthYear: form.birthYear.trim(),
    deathYear: form.deathYear.trim(),
    bio: form.bio.trim(),
    avatar: form.avatar.trim(),
    birthSpouseIndex: form.birthSpouseIndex === '' ? null : Number(form.birthSpouseIndex),
    spouses: form.spouses
      .filter(s => s.name.trim())
      .map(s => ({
        name: s.name.trim(),
        gender: s.gender,
        birthYear: s.birthYear.trim(),
        deathYear: s.deathYear.trim(),
        bio: s.bio.trim()
      }))
  }
  emit('save', { mode: props.mode, id: props.person?.id, data })
}
</script>

<style scoped>
.edit-overlay {
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

.edit-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 460px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-top: 4px solid #d4a853;
}

.edit-close {
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

.edit-close:hover { color: #333; }

.edit-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 4px;
}

.edit-subtitle {
  font-size: 13px;
  color: #888;
  margin: 0 0 16px;
}

.edit-subtitle strong { color: #8b0000; }

.edit-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fde8e8;
  border-radius: 8px;
  color: #8b0000;
  font-size: 13px;
  margin-bottom: 12px;
}

.form-body { display: flex; flex-direction: column; gap: 12px; }

.form-row { display: flex; flex-direction: column; gap: 4px; }

.form-row-2 {
  flex-direction: row;
  gap: 12px;
}
.form-row-2 > div { flex: 1; display: flex; flex-direction: column; gap: 4px; }

.form-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.req { color: #c4716e; }

.form-input {
  border: 1px solid #d4c5a0;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  color: #333;
  background: #faf8f3;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  width: 100%;
}

.form-input:focus { border-color: #8b0000; }

.form-readonly {
  background: #f0ece2;
  color: #999;
  cursor: not-allowed;
}

.form-textarea { resize: vertical; min-height: 44px; }

.avatar-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.avatar-preview {
  flex-shrink: 0;
}

.avatar-url-input {
  flex: 1;
  min-width: 140px;
}

.file-input-hidden {
  display: none;
}

.btn-mini {
  background: #faf8f3;
  border: 1px solid #d4c5a0;
  color: #8b0000;
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-mini:hover {
  background: #fef5e7;
  border-color: #8b0000;
}

.btn-mini-danger {
  color: #c62828;
}

.btn-mini-danger:hover {
  background: #fde8e8;
  border-color: #c62828;
}

.spouse-section {
  border-top: 1px dashed #e8dcc8;
  padding-top: 12px;
  margin-top: 4px;
}

.spouse-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.spouse-section-title {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.btn-add-spouse {
  background: #faf8f3;
  border: 1px dashed #d4a853;
  color: #8b0000;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-add-spouse:hover {
  background: #fef5e7;
  border-color: #8b0000;
}

.spouse-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #fef9ef;
  border-radius: 10px;
}

.spouse-fields-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.spouse-fields-label {
  font-size: 12px;
  font-weight: 600;
  color: #8b0000;
}

.btn-remove-spouse {
  background: none;
  border: none;
  color: #c62828;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: inherit;
}

.btn-remove-spouse:hover {
  background: #fde8e8;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-cancel {
  background: #f0ece2;
  color: #666;
}

.btn-cancel:hover { background: #e6dfcd; }

.btn-save {
  background: linear-gradient(135deg, #8b0000 0%, #a02020 100%);
  color: #fff;
}

.btn-save:hover { filter: brightness(1.08); }
</style>
