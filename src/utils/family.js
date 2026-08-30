// 家谱数据模型工具函数

const SPOUSE_LABELS = ['元配', '继配', '三配', '四配', '五配']

/**
 * 获取成员的配偶列表。
 * 兼容两种数据形态：新的 spouses 数组，以及旧的单数 spouse 对象。
 * 优先使用 spouses 数组；若不存在则回退到 spouse 单数。
 * @param {object} person 成员节点
 * @returns {Array} 配偶数组（每项含 name 等字段）
 */
export function getSpouses(person) {
  if (!person) return []
  if (Array.isArray(person.spouses)) {
    return person.spouses.filter(s => s && s.name)
  }
  if (person.spouse && person.spouse.name) return [person.spouse]
  return []
}

/**
 * 是否有配偶
 */
export function hasSpouse(person) {
  return getSpouses(person).length > 0
}

/**
 * 配偶序号对应的称谓：元配 / 继配 / 三配 ...
 */
export function spouseLabel(idx) {
  return SPOUSE_LABELS[idx] || `第${idx + 1}配`
}

/**
 * 由姓名生成头像文字：取末尾 maxLen 个字符（中文通常为"名"）。
 */
export function avatarText(name, maxLen = 2) {
  if (!name) return ''
  const t = String(name).trim().replace(/\s+/g, '')
  if (!t) return ''
  if (t.length <= maxLen) return t
  return t.slice(-maxLen)
}
