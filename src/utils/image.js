// 头像图片处理工具

/**
 * 读取本地图片文件，等比缩放到 maxSize 以内，输出为 JPEG dataURL。
 * 用于头像上传——压缩后体积小，适合存入 localStorage。
 * @param {File} file 图片文件
 * @param {number} maxSize 最长边像素上限
 * @param {number} quality JPEG 质量 0~1
 * @returns {Promise<string>} dataURL
 */
export function fileToResizedDataURL(file, maxSize = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('图片解析失败'))
      img.onload = () => {
        let { width, height } = img
        // 缩放：保证最长边 <= maxSize
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        // 白底，避免透明 PNG 转 JPEG 后变黑
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch (err) {
          reject(new Error('图片处理失败'))
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
