import { Instance } from 'cooljs'
import * as constant from './constant'

const getActionConfig = (engine, type) => {
  const { width, height, utils } = engine
  const { random } = utils
  const actionTypes = {
    bottomToTop: {
      x: width * random(0.3, 0.7),
      y: height,
      vx: 0,
      vy: engine.pixelsPerFrame(height) * 0.7 * -1
    },
    leftToRight: {
      x: -width * 0.2,
      y: height * random(0.3, 0.6),
      vx: engine.pixelsPerFrame(width) * 0.45,
      vy: engine.pixelsPerFrame(height) * 0.1 * -1
    },
    rightToLeft: {
      x: width,
      y: height * random(0.2, 0.5),
      vx: engine.pixelsPerFrame(width) * 0.45 * -1,
      vy: engine.pixelsPerFrame(height) * 0.1
    },
    rightTopToLeft: {
      x: width,
      y: 0,
      vx: engine.pixelsPerFrame(width) * 0.6 * -1,
      vy: engine.pixelsPerFrame(height) * 0.5
    }
  }
  return actionTypes[type]
}

const palettes = [
  { core: '#ffffff', tail: 'rgba(216, 180, 254, 0.0)', glow: 'rgba(216, 180, 254, 0.8)' },
  { core: '#f0abfc', tail: 'rgba(217, 70, 239, 0.0)', glow: 'rgba(217, 70, 239, 0.85)' },
  { core: '#c4b5fd', tail: 'rgba(168, 85, 247, 0.0)', glow: 'rgba(168, 85, 247, 0.85)' }
]

export const flightAction = (instance, engine) => {
  const { visible, ready, type } = instance
  if (!visible) return
  const size = engine.getVariable(constant.cloudSize)
  if (!ready) {
    const action = getActionConfig(engine, type)
    instance.ready = true
    instance.width = size
    instance.height = size
    instance.x = action.x
    instance.y = action.y
    instance.vx = action.vx
    instance.vy = action.vy
    instance.palette = palettes[Math.floor(Math.random() * palettes.length)]
    instance.trail = []
  }
  instance.x += instance.vx
  instance.y += instance.vy
  instance.trail.push({ x: instance.x, y: instance.y })
  if (instance.trail.length > 18) instance.trail.shift()
  if (instance.y + size < 0
    || instance.y > engine.height + size
    || instance.x + size < 0
    || instance.x > engine.width + size) {
    instance.visible = false
  }
}

export const flightPainter = (instance, engine) => {
  const { ctx } = engine
  const { palette, trail } = instance
  if (!palette || !trail) return
  const headSize = Math.max(3, engine.width * 0.018)

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  // trail
  for (let i = 0; i < trail.length; i += 1) {
    const p = trail[i]
    const t = i / trail.length
    const r = headSize * (0.4 + 0.6 * t)
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4)
    grad.addColorStop(0, palette.glow.replace(/[\d.]+\)$/, `${0.25 * t})`))
    grad.addColorStop(1, palette.tail)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // head
  ctx.shadowColor = palette.glow
  ctx.shadowBlur = 18
  ctx.fillStyle = palette.core
  ctx.beginPath()
  ctx.arc(instance.x, instance.y, headSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export const addFlight = (engine, number, type) => {
  const flightCount = engine.getVariable(constant.flightCount)
  if (flightCount === number) return
  const flight = new Instance({
    name: `flight_${number}`,
    action: flightAction,
    painter: flightPainter
  })
  flight.type = type
  engine.addInstance(flight, constant.flightLayer)
  engine.setVariable(constant.flightCount, number)
}
