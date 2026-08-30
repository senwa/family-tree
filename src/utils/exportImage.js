import { toPng } from 'html-to-image'

/**
 * 将家谱画布导出为 PNG 图片并触发下载。
 * @param {HTMLElement} el 要捕获的 DOM 节点
 * @param {string} filename 文件名
 */
export async function exportTreeImage(el, filename = 'family-tree.png') {
  if (!el) throw new Error('未找到可导出的画布元素')

  // 获取内容自然尺寸，按完整尺寸渲染
  const width = el.scrollWidth || el.offsetWidth
  const height = el.scrollHeight || el.offsetHeight

  const dataUrl = await toPng(el, {
    backgroundColor: '#faf8f3',
    pixelRatio: 2,
    width: width || undefined,
    height: height || undefined,
    style: {
      // 临时抹掉缩放/平移与绝对定位，确保完整捕获
      transform: 'none',
      left: '0',
      top: '0',
      margin: '0'
    }
  })

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
