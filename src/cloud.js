import { checkMoveDown, getMoveDownValue } from './utils'
import * as constant from './constant'

const setupCloud = (instance, engine) => {
  // Two visual tiers: "orb" (low altitude, big soft blob) and "spark" (higher altitude, small bright)
  const tier = instance.count > 6 ? 'spark' : 'orb'
  instance.tier = tier
  if (tier === 'orb') {
    const palette = [
      ['rgba(168, 85, 247, 0.32)', 'rgba(168, 85, 247, 0)'],
      ['rgba(217, 70, 239, 0.28)', 'rgba(217, 70, 239, 0)'],
      ['rgba(124, 58, 237, 0.32)', 'rgba(124, 58, 237, 0)']
    ]
    instance.colors = palette[Math.floor(Math.random() * palette.length)]
    instance.radius = engine.getVariable(constant.cloudSize) * engine.utils.random(0.5, 0.9)
  } else {
    const palette = [
      ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0)'],
      ['rgba(240, 171, 252, 0.9)', 'rgba(240, 171, 252, 0)'],
      ['rgba(192, 132, 252, 0.85)', 'rgba(192, 132, 252, 0)']
    ]
    instance.colors = palette[Math.floor(Math.random() * palette.length)]
    instance.radius = engine.getVariable(constant.cloudSize) * engine.utils.random(0.06, 0.12)
  }
}

export const cloudAction = (instance, engine) => {
  if (!instance.ready) {
    instance.ready = true
    setupCloud(instance, engine)
    instance.width = engine.getVariable(constant.cloudSize)
    instance.height = engine.getVariable(constant.cloudSize)
    const engineW = engine.width
    const engineH = engine.height
    const positionArr = [
      { x: engineW * 0.1, y: -engineH * 0.66 },
      { x: engineW * 0.65, y: -engineH * 0.33 },
      { x: engineW * 0.1, y: 0 },
      { x: engineW * 0.65, y: engineH * 0.33 }
    ]
    const position = positionArr[instance.index - 1]
    instance.x = engine.utils.random(position.x, (position.x * 1.2))
    instance.originX = instance.x
    instance.ax = engine.pixelsPerFrame(instance.width * engine.utils.random(0.05, 0.08)
      * engine.utils.randomPositiveNegative())
    instance.y = engine.utils.random(position.y, (position.y * 1.2))
  }
  instance.x += instance.ax
  if (instance.x >= instance.originX + instance.width
    || instance.x <= instance.originX - instance.width) {
    instance.ax *= -1
  }
  if (checkMoveDown(engine)) {
    instance.y += getMoveDownValue(engine) * 1.2
  }
  if (instance.y >= engine.height) {
    instance.y = -engine.height * 0.66
    instance.count += 4
    setupCloud(instance, engine)
  }
}

export const cloudPainter = (instance, engine) => {
  const { ctx } = engine
  const cx = instance.x + instance.width / 2
  const cy = instance.y + instance.height / 2
  const r = instance.radius
  if (!r) return
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  grad.addColorStop(0, instance.colors[0])
  grad.addColorStop(1, instance.colors[1])
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  if (instance.tier === 'spark') {
    // crisp core
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(1, r * 0.35), 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fill()
  }
  ctx.restore()
}
