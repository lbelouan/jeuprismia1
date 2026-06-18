import { Instance } from 'cooljs'
import { blockAction, blockPainter } from './block'
import {
  checkMoveDown,
  getMoveDownValue,
  getAngleBase
} from './utils'
import { addFlight } from './flight'
import { paintCharacter } from './character'
import * as constant from './constant'

const roundRect = (ctx, x, y, w, h, r) => {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.lineTo(x + w - rad, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
  ctx.lineTo(x + w, y + h - rad)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
  ctx.lineTo(x + rad, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
  ctx.lineTo(x, y + rad)
  ctx.quadraticCurveTo(x, y, x + rad, y)
  ctx.closePath()
}

const drawGlassPill = (ctx, x, y, w, h, accent) => {
  ctx.save()
  roundRect(ctx, x, y, w, h, h / 2)
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, 'rgba(168, 85, 247, 0.22)')
  grad.addColorStop(1, 'rgba(45, 18, 80, 0.65)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = accent || 'rgba(216, 180, 254, 0.45)'
  ctx.stroke()
  ctx.restore()
}

const drawHeart = (ctx, cx, cy, size, alive) => {
  ctx.save()
  ctx.translate(cx, cy)
  const s = size
  ctx.beginPath()
  ctx.moveTo(0, s * 0.35)
  ctx.bezierCurveTo(0, s * 0.1, -s * 0.55, -s * 0.05, -s * 0.55, -s * 0.3)
  ctx.bezierCurveTo(-s * 0.55, -s * 0.55, -s * 0.2, -s * 0.6, 0, -s * 0.3)
  ctx.bezierCurveTo(s * 0.2, -s * 0.6, s * 0.55, -s * 0.55, s * 0.55, -s * 0.3)
  ctx.bezierCurveTo(s * 0.55, -s * 0.05, 0, s * 0.1, 0, s * 0.35)
  ctx.closePath()
  if (alive) {
    const g = ctx.createLinearGradient(0, -s * 0.6, 0, s * 0.4)
    g.addColorStop(0, '#f0abfc')
    g.addColorStop(1, '#a855f7')
    ctx.fillStyle = g
    ctx.shadowColor = 'rgba(217, 70, 239, 0.8)'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.stroke()
  } else {
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.3)'
    ctx.stroke()
  }
  ctx.restore()
}

const drawLabelValue = (engine, opts) => {
  const { ctx } = engine
  const {
    x, y, label, value, align, valueSize, labelSize
  } = opts
  ctx.save()
  ctx.textAlign = align || 'left'
  ctx.textBaseline = 'alphabetic'

  // Label
  ctx.font = `700 ${labelSize}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  ctx.fillStyle = 'rgba(216, 180, 254, 0.75)'
  ctx.fillText(label, x, y)

  // Value (gradient)
  ctx.font = `900 ${valueSize}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  const grad = ctx.createLinearGradient(0, y + 4, 0, y + 4 + valueSize)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(1, '#d8b4fe')
  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(168, 85, 247, 0.55)'
  ctx.shadowBlur = 14
  ctx.fillText(value, x, y + valueSize + 2)
  ctx.restore()
}

export const endAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return

  // Paint the character on top of blocks but under the HUD
  paintCharacter(engine)

  const successCount = engine.getVariable(constant.successCount, 0)
  const failedCount = engine.getVariable(constant.failedCount)
  const gameScore = engine.getVariable(constant.gameScore, 0)
  const { ctx, width } = engine

  const padX = width * 0.06
  const topY = width * 0.06
  const labelSize = Math.max(10, width * 0.028)
  const valueSize = Math.max(22, width * 0.1)

  // LEVEL pill (top left)
  drawLabelValue(engine, {
    x: padX,
    y: topY + labelSize,
    label: 'LEVEL',
    value: String(successCount),
    align: 'left',
    labelSize,
    valueSize
  })

  // SCORE pill (top right)
  drawLabelValue(engine, {
    x: width - padX,
    y: topY + labelSize,
    label: 'SCORE',
    value: String(gameScore),
    align: 'right',
    labelSize,
    valueSize
  })

  // Hearts row under the score
  const heartSize = width * 0.04
  const heartGap = heartSize * 1.6
  const heartsY = topY + labelSize + valueSize + heartSize * 1.3
  for (let i = 0; i < 3; i += 1) {
    const cx = width - padX - (heartSize / 2) - ((2 - i) * heartGap)
    const alive = i >= failedCount
    drawHeart(ctx, cx, heartsY, heartSize, alive)
  }

  // Subtle vignette stroke on top to separate HUD from playfield
  ctx.save()
  const v = ctx.createLinearGradient(0, 0, 0, width * 0.2)
  v.addColorStop(0, 'rgba(0,0,0,0.25)')
  v.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, width, width * 0.2)
  ctx.restore()
}

export const startAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return
  const lastBlock = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (!lastBlock || [constant.land, constant.out].indexOf(lastBlock.status) > -1) {
    if (checkMoveDown(engine) && getMoveDownValue(engine)) return
    if (engine.checkTimeMovement(constant.hookUpMovement)) return
    const angleBase = getAngleBase(engine)
    const initialAngle = (Math.PI
        * engine.utils.random(angleBase, angleBase + 5)
        * engine.utils.randomPositiveNegative()
    ) / 180
    engine.setVariable(constant.blockCount, engine.getVariable(constant.blockCount) + 1)
    engine.setVariable(constant.initialAngle, initialAngle)
    engine.setTimeMovement(constant.hookDownMovement, 500)
    const block = new Instance({
      name: `block_${engine.getVariable(constant.blockCount)}`,
      action: blockAction,
      painter: blockPainter
    })
    engine.addInstance(block)
  }
  const successCount = Number(engine.getVariable(constant.successCount, 0))
  switch (successCount) {
    case 2:
      addFlight(engine, 1, 'leftToRight')
      break
    case 6:
      addFlight(engine, 2, 'rightToLeft')
      break
    case 8:
      addFlight(engine, 3, 'leftToRight')
      break
    case 14:
      addFlight(engine, 4, 'bottomToTop')
      break
    case 18:
      addFlight(engine, 5, 'bottomToTop')
      break
    case 22:
      addFlight(engine, 6, 'bottomToTop')
      break
    case 25:
      addFlight(engine, 7, 'rightTopToLeft')
      break
    default:
      break
  }
}
