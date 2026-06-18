import { getHookStatus } from './utils'
import * as constant from './constant'

export const tutorialAction = (instance, engine, time) => {
  const { width, height } = engine
  const { name } = instance
  if (!instance.ready) {
    instance.ready = true
    instance.width = width * 0.5
    instance.height = width * 0.16
    instance.x = (width - instance.width) / 2
    instance.y = height * 0.46
    if (name !== 'tutorial') {
      instance.y += instance.height * 1.4
    }
  }
  if (name !== 'tutorial') {
    instance.y += Math.cos(time / 220) * instance.height * 0.06
  }
}

const drawTapHint = (ctx, x, y, w, h) => {
  // Glass pill
  const r = h / 2
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, 'rgba(168, 85, 247, 0.28)')
  grad.addColorStop(1, 'rgba(45, 18, 80, 0.7)')
  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'
  ctx.shadowBlur = 18
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(216, 180, 254, 0.5)'
  ctx.stroke()

  // Small circle (tap finger)
  const dotR = h * 0.22
  const dotX = x + h * 0.55
  const dotY = y + h / 2
  ctx.beginPath()
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(255,255,255,0.8)'
  ctx.shadowBlur = 12
  ctx.fill()
  // ring
  ctx.beginPath()
  ctx.arc(dotX, dotY, dotR * 1.7, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Text
  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${Math.floor(h * 0.42)}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Tap to drop', x + h * 1.1, y + h / 2)
  ctx.restore()
}

const drawArrow = (ctx, x, y, w, h) => {
  const cx = x + w / 2
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(217, 70, 239, 0.7)'
  ctx.shadowBlur = 12
  // Vertical line
  ctx.beginPath()
  ctx.moveTo(cx, y)
  ctx.lineTo(cx, y + h * 0.6)
  ctx.stroke()
  // Arrowhead
  ctx.beginPath()
  ctx.moveTo(cx, y + h)
  ctx.lineTo(cx - h * 0.28, y + h * 0.55)
  ctx.lineTo(cx + h * 0.28, y + h * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export const tutorialPainter = (instance, engine) => {
  if (engine.checkTimeMovement(constant.tutorialMovement)) {
    return
  }
  if (getHookStatus(engine) !== constant.hookNormal) {
    return
  }
  const { ctx } = engine
  if (instance.name === 'tutorial') {
    drawTapHint(ctx, instance.x, instance.y, instance.width, instance.height)
  } else {
    drawArrow(ctx, instance.x, instance.y, instance.width, instance.height)
  }
}
