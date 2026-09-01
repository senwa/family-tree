import { toPng } from 'html-to-image'

/**
 * 将家谱可视区域导出为 PNG 图片并触发下载。
 *
 * 捕获的是 .tree-viewport（所见即所得）：调用前 App 会先自适应全览，
 * 全部成员已完整落在可视区内，直接按当前呈现捕获即可。
 * 不传 width/height/style 覆盖 —— html-to-image 会把 width/height 强行
 * 写到克隆节点 style 上改变布局（曾导致画布拉伸、内容偏移被裁），
 * 而 .tree-viewport 本身就是目标尺寸，无需任何覆盖。
 * @param {HTMLElement} el 要捕获的 DOM 节点（.tree-viewport）
 * @param {string} filename 文件名
 */
export async function exportTreeImage(el, filename = 'family-tree.png') {
  if (!el) throw new Error('未找到可导出的画布元素')

  const dataUrl = await toPng(el, {
    backgroundColor: '#faf8f3',
    pixelRatio: 2
  })

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
