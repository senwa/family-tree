import { ref, onMounted, onUnmounted } from 'vue'
import { measureContentExtent } from '../utils/measure.js'

export function useZoomDrag(containerRef) {
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)
  const isDragging = ref(false)

  const MIN_SCALE = 0.2
  const MAX_SCALE = 3.0
  const ZOOM_STEP = 0.1

  let startX = 0
  let startY = 0
  let startTranslateX = 0
  let startTranslateY = 0

  // 缩放
  function zoom(delta) {
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta))
    scale.value = Math.round(newScale * 100) / 100
  }

  function zoomIn() {
    zoom(ZOOM_STEP)
  }

  function zoomOut() {
    zoom(-ZOOM_STEP)
  }

  function resetView() {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
  }

  // 自适应视图：缩放到完整容纳全部成员并居中显示。
  // 画布 CSS 定位于 left:50% / top:40px、变换原点 0 0，
  // 令内容边界（未缩放坐标 extent.left/top）映射后居中于容器即得平移量
  function fitView(contentEl) {
    const container = containerRef.value
    if (!container || !contentEl) { resetView(); return }
    const extent = measureContentExtent(contentEl)
    const cw = container.clientWidth
    const ch = container.clientHeight
    if (extent.width <= 0 || extent.height <= 0 || cw <= 0 || ch <= 0) {
      resetView()
      return
    }
    const margin = 40 // 四周留白
    const fit = Math.min((cw - margin) / extent.width, (ch - margin) / extent.height, 1)
    scale.value = Math.max(MIN_SCALE, Math.round(fit * 100) / 100)
    const s = scale.value
    translateX.value = Math.round((cw - extent.width * s) / 2 - cw / 2 - extent.left * s)
    translateY.value = Math.round((ch - extent.height * s) / 2 - 40 - extent.top * s)
  }

  // 计算变换样式
  function getTransformStyle() {
    return {
      transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
      transformOrigin: '0 0'
    }
  }

  // 鼠标滚轮缩放
  function handleWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta))
    scale.value = Math.round(newScale * 100) / 100
  }

  // 鼠标拖拽
  function handleMouseDown(e) {
    // 仅左键拖拽
    if (e.button !== 0) return
    // 忽略在按钮/输入上的点击
    if (e.target.closest('button, input, select, a')) return
    isDragging.value = true
    startX = e.clientX
    startY = e.clientY
    startTranslateX = translateX.value
    startTranslateY = translateY.value
    e.preventDefault()
  }

  function handleMouseMove(e) {
    if (!isDragging.value) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    translateX.value = startTranslateX + dx
    translateY.value = startTranslateY + dy
  }

  function handleMouseUp() {
    isDragging.value = false
  }

  // 触摸支持
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTranslateX = 0
  let touchStartTranslateY = 0
  let lastTouchDist = 0

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging.value = true
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      touchStartTranslateX = translateX.value
      touchStartTranslateY = translateY.value
    } else if (e.touches.length === 2) {
      isDragging.value = false
      lastTouchDist = getTouchDistance(e.touches)
    }
  }

  function handleTouchMove(e) {
    e.preventDefault()
    if (e.touches.length === 1 && isDragging.value) {
      const dx = e.touches[0].clientX - touchStartX
      const dy = e.touches[0].clientY - touchStartY
      translateX.value = touchStartTranslateX + dx
      translateY.value = touchStartTranslateY + dy
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches)
      const delta = (dist - lastTouchDist) * 0.005
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta))
      scale.value = Math.round(newScale * 100) / 100
      lastTouchDist = dist
    }
  }

  function handleTouchEnd() {
    isDragging.value = false
  }

  function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 绑定/解绑事件
  function bindEvents() {
    const el = containerRef.value
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
  }

  function unbindEvents() {
    const el = containerRef.value
    if (!el) return
    el.removeEventListener('wheel', handleWheel)
    el.removeEventListener('mousedown', handleMouseDown)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
    el.removeEventListener('touchend', handleTouchEnd)
  }

  onMounted(() => {
    bindEvents()
  })

  onUnmounted(() => {
    unbindEvents()
  })

  return {
    scale,
    translateX,
    translateY,
    isDragging,
    zoomIn,
    zoomOut,
    resetView,
    fitView,
    getTransformStyle,
    bindEvents,
    unbindEvents
  }
}
