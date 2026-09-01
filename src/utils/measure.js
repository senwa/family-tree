/**
 * 量测元素内容的真实视觉边界（换算回未缩放坐标）。
 *
 * 家谱子树经 translateX 左移对齐到本人卡片时会溢出画布左缘，
 * scrollWidth/offsetWidth 都覆盖不到负向溢出，需遍历所有元素
 * 用 getBoundingClientRect 求包络。画布与子孙元素共享同一变换，
 * 相对坐标除以画布当前实际缩放（从 computed transform 矩阵实时
 * 读取，transition 进行中也与子孙 rect 保持一致）即得未缩放值。
 *
 * @param {HTMLElement} el 画布元素（变换参照系）
 * @returns {{ left: number, top: number, width: number, height: number }}
 *   left/top 为内容相对画布边框盒原点的偏移，可能为负（溢出）
 */
export function measureContentExtent(el) {
  const base = el.getBoundingClientRect()
  const transform = getComputedStyle(el).transform
  const scale = transform && transform !== 'none'
    ? Math.abs(new DOMMatrixReadOnly(transform).a) || 1
    : 1

  let left = 0
  let top = 0
  let right = base.width / scale
  let bottom = base.height / scale

  el.querySelectorAll('*').forEach(node => {
    const r = node.getBoundingClientRect()
    if (!r.width && !r.height) return
    left = Math.min(left, (r.left - base.left) / scale)
    top = Math.min(top, (r.top - base.top) / scale)
    right = Math.max(right, (r.right - base.left) / scale)
    bottom = Math.max(bottom, (r.bottom - base.top) / scale)
  })

  return { left, top, width: right - left, height: bottom - top }
}
