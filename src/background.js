import { checkMoveDown, getMoveDownValue } from './utils'
import * as constant from './constant'

const getLinearGradientColorRgb = (colorArr, colorIndex, proportion) => {
  const currentIndex = colorIndex + 1 >= colorArr.length ? colorArr.length - 1 : colorIndex
  const colorCurrent = colorArr[currentIndex]
  const nextIndex = currentIndex + 1 >= colorArr.length - 1 ? currentIndex : currentIndex + 1
  const colorNext = colorArr[nextIndex]
  const calRgbValue = (index) => {
    const current = colorCurrent[index]
    const next = colorNext[index]
    return Math.round(current + ((next - current) * proportion))
  }
  return `rgb(${calRgbValue(0)}, ${calRgbValue(1)}, ${calRgbValue(2)})`
}

const drawGrid = (engine, offsetY) => {
  const { ctx, width, height } = engine
  const step = Math.max(28, width * 0.08)
  ctx.save()
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.07)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= width; x += step) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  const yOffset = offsetY % step
  for (let y = -step + yOffset; y <= height; y += step) {
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()
  ctx.restore()
}

const drawOrbs = (engine, offsetY) => {
  const { ctx, width, height } = engine
  const orbs = [
    { x: width * 0.18, y: height * 0.22, r: width * 0.55, color: 'rgba(168, 85, 247, 0.32)' },
    { x: width * 0.82, y: height * 0.78, r: width * 0.5, color: 'rgba(217, 70, 239, 0.22)' },
    { x: width * 0.5, y: height * 0.5, r: width * 0.6, color: 'rgba(126, 34, 206, 0.18)' }
  ]
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  orbs.forEach((orb, i) => {
    const drift = Math.sin((offsetY + i * 200) * 0.003) * height * 0.04
    const grad = ctx.createRadialGradient(orb.x, orb.y + drift, 0, orb.x, orb.y + drift, orb.r)
    grad.addColorStop(0, orb.color)
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(orb.x, orb.y + drift, orb.r, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

const drawGroundGlow = (engine) => {
  const { ctx, width, height } = engine
  const grad = ctx.createLinearGradient(0, height * 0.7, 0, height)
  grad.addColorStop(0, 'rgba(217, 70, 239, 0)')
  grad.addColorStop(1, 'rgba(217, 70, 239, 0.18)')
  ctx.save()
  ctx.fillStyle = grad
  ctx.fillRect(0, height * 0.7, width, height * 0.3)
  ctx.restore()
}

export const backgroundLinearGradient = (engine) => {
  const grad = engine.ctx.createLinearGradient(0, 0, 0, engine.height)
  // Palette: top → bottom evolves from deep night purple to fuchsia-tinted base
  const colorArr = [
    [40, 18, 70],   // deep violet (ground / start)
    [25, 10, 50],   // dark indigo-purple
    [14, 6, 32],    // near-black purple
    [8, 4, 22],     // void
    [18, 8, 40],    // back to purple after climbing high
    [35, 12, 60],   // richer purple (sky aurora)
    [70, 22, 110]   // fuchsia tint at the very top of progression
  ]
  const offsetHeight = engine.getVariable(constant.bgLinearGradientOffset, 0)
  if (checkMoveDown(engine)) {
    engine.setVariable(
      constant.bgLinearGradientOffset,
      offsetHeight + (getMoveDownValue(engine) * 1.5)
    )
  }
  const colorIndex = parseInt(offsetHeight / engine.height, 10)
  const calOffsetHeight = offsetHeight % engine.height
  const proportion = calOffsetHeight / engine.height
  const colorBase = getLinearGradientColorRgb(colorArr, colorIndex, proportion)
  const colorTop = getLinearGradientColorRgb(colorArr, colorIndex + 1, proportion)
  grad.addColorStop(0, colorTop)
  grad.addColorStop(1, colorBase)
  engine.ctx.fillStyle = grad
  engine.ctx.beginPath()
  engine.ctx.rect(0, 0, engine.width, engine.height)
  engine.ctx.fill()

  drawOrbs(engine, offsetHeight)
  drawGrid(engine, offsetHeight)

  // Set lineInitialOffset so the ground "line" stays near the bottom (previously tied to bg image)
  engine.setVariable(constant.lineInitialOffset, engine.height * 0.82)
  drawGroundGlow(engine)

  // soft violet "lightning" flash on milestones (replaces the harsh white flash)
  const lightning = () => {
    engine.ctx.save()
    const lg = engine.ctx.createLinearGradient(0, 0, 0, engine.height)
    lg.addColorStop(0, 'rgba(217, 70, 239, 0.55)')
    lg.addColorStop(1, 'rgba(168, 85, 247, 0.15)')
    engine.ctx.fillStyle = lg
    engine.ctx.fillRect(0, 0, engine.width, engine.height)
    engine.ctx.restore()
  }
  engine.getTimeMovement(
    constant.lightningMovement, [], () => {},
    {
      before: lightning,
      after: lightning
    }
  )
}

export const background = (engine) => {
  backgroundLinearGradient(engine)
}
