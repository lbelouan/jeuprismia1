import {
  getMoveDownValue,
  getLandBlockVelocity,
  getSwingBlockVelocity,
  touchEventHandler,
  addSuccessCount,
  addFailedCount,
  addScore
} from './utils'
import { playDrop, playPerfect, playRotate } from './sounds'
import { triggerCharacterJump } from './character'
import * as constant from './constant'

const checkCollision = (block, line) => {
  // 0 goon 1 drop 2 rotate left 3 rotate right 4 ok 5 perfect
  if (block.y + block.height >= line.y) {
    if (block.x < line.x - block.calWidth || block.x > line.collisionX + block.calWidth) {
      return 1
    }
    if (block.x < line.x) {
      return 2
    }
    if (block.x > line.collisionX) {
      return 3
    }
    if (block.x > line.x + (block.calWidth * 0.8) && block.x < line.x + (block.calWidth * 1.2)) {
      // -10% +10%
      return 5
    }
    return 4
  }
  return 0
}
const swing = (instance, engine, time) => {
  const ropeHeight = engine.getVariable(constant.ropeHeight)
  if (instance.status !== constant.swing) return
  const i = instance
  const initialAngle = engine.getVariable(constant.initialAngle)
  i.angle = initialAngle *
    getSwingBlockVelocity(engine, time)
  i.weightX = i.x +
    (Math.sin(i.angle) * ropeHeight)
  i.weightY = i.y +
    (Math.cos(i.angle) * ropeHeight)
}

const checkBlockOut = (instance, engine) => {
  if (instance.status === constant.rotateLeft) {
    if (instance.y - instance.width >= engine.height) {
      instance.visible = false
      instance.status = constant.out
      addFailedCount(engine)
    }
  } else if (instance.y >= engine.height) {
    instance.visible = false
    instance.status = constant.out
    addFailedCount(engine)
  }
}

export const blockAction = (instance, engine, time) => {
  const i = instance
  const ropeHeight = engine.getVariable(constant.ropeHeight)
  if (!i.visible) {
    return
  }
  if (!i.ready) {
    i.ready = true
    i.status = constant.swing
    instance.updateWidth(engine.getVariable(constant.blockWidth))
    instance.updateHeight(engine.getVariable(constant.blockHeight))
    instance.x = engine.width / 2
    instance.y = ropeHeight * -1.5
  }
  const line = engine.getInstance('line')
  switch (i.status) {
    case constant.swing:
      engine.getTimeMovement(
        constant.hookDownMovement,
        [[instance.y, instance.y + ropeHeight]],
        (value) => {
          instance.y = value
        },
        {
          name: 'block'
        }
      )
      swing(instance, engine, time)
      break
    case constant.beforeDrop:
      i.x = instance.weightX - instance.calWidth
      i.y = instance.weightY + (0.3 * instance.height)
      i.rotate = 0
      i.ay = engine.pixelsPerFrame(0.0003 * engine.height)
      i.startDropTime = time
      i.status = constant.drop
      break
    case constant.drop:
      const deltaTime = time - i.startDropTime
      i.startDropTime = time
      i.vy += i.ay * deltaTime
      i.y += (i.vy * deltaTime) + (0.5 * i.ay * (deltaTime ** 2))
      const collision = checkCollision(instance, line)
      const blockY = line.y - instance.height
      const calRotate = (ins) => {
        ins.originOutwardAngle = Math.atan(ins.height / ins.outwardOffset)
        ins.originHypotenuse = Math.sqrt((ins.height ** 2)
          + (ins.outwardOffset ** 2))
        playRotate()
      }
      switch (collision) {
        case 1:
          checkBlockOut(instance, engine)
          break
        case 2:
          i.status = constant.rotateLeft
          instance.y = blockY
          instance.outwardOffset = (line.x + instance.calWidth) - instance.x
          calRotate(instance)
          break
        case 3:
          i.status = constant.rotateRight
          instance.y = blockY
          instance.outwardOffset = (line.collisionX + instance.calWidth) - instance.x
          calRotate(instance)
          break
        case 4:
        case 5:
          i.status = constant.land
          const lastSuccessCount = engine.getVariable(constant.successCount)
          addSuccessCount(engine)
          engine.setTimeMovement(constant.moveDownMovement, 500)
          if (lastSuccessCount === 10 || lastSuccessCount === 15) {
            engine.setTimeMovement(constant.lightningMovement, 150)
          }
          instance.y = blockY
          line.y = blockY
          line.x = i.x - i.calWidth
          line.collisionX = line.x + i.width
          const cheatWidth = i.width * 0.3
          if (i.x > engine.width - (cheatWidth * 2)
            || i.x < -cheatWidth) {
            engine.setVariable(constant.hardMode, true)
          }
          if (collision === 5) {
            instance.perfect = true
            addScore(engine, true)
            playPerfect()
          } else {
            addScore(engine)
            playDrop()
          }
          triggerCharacterJump(engine)
          break
        default:
          break
      }
      break
    case constant.land:
      engine.getTimeMovement(
        constant.moveDownMovement,
        [[instance.y, instance.y + (getMoveDownValue(engine, { pixelsPerFrame: s => s / 2 }))]],
        (value) => {
          if (!instance.visible) return
          instance.y = value
          if (instance.y > engine.height) {
            instance.visible = false
          }
        },
        {
          name: instance.name
        }
      )
      instance.x += getLandBlockVelocity(engine, time)
      break
    case constant.rotateLeft:
    case constant.rotateRight:
      const isRight = i.status === constant.rotateRight
      const rotateSpeed = engine.pixelsPerFrame(Math.PI * 4)
      const isShouldFall = isRight ? instance.rotate > 1.3 : instance.rotate < -1.3
      const leftFix = isRight ? 1 : -1
      if (isShouldFall) {
        instance.rotate += (rotateSpeed / 8) * leftFix
        instance.y += engine.pixelsPerFrame(engine.height * 0.7)
        instance.x += engine.pixelsPerFrame(engine.width * 0.3) * leftFix
      } else {
        let rotateRatio = (instance.calWidth - instance.outwardOffset)
          / instance.calWidth
        rotateRatio = rotateRatio > 0.5 ? rotateRatio : 0.5
        instance.rotate += rotateSpeed * rotateRatio * leftFix
        const angle = instance.originOutwardAngle + instance.rotate
        const rotateAxisX = isRight ? line.collisionX + instance.calWidth
          : line.x + instance.calWidth
        const rotateAxisY = line.y
        instance.x = rotateAxisX -
          (Math.cos(angle) * instance.originHypotenuse)
        instance.y = rotateAxisY -
          (Math.sin(angle) * instance.originHypotenuse)
      }
      checkBlockOut(instance, engine)
      break
    default:
      break
  }
}

// ----- Painters (refonte UI) -----

const roundRectPath = (ctx, x, y, w, h, r) => {
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

const paintBlockBody = (ctx, x, y, w, h, perfect) => {
  const radius = Math.min(w, h) * 0.16

  // Outer glow
  ctx.save()
  ctx.shadowColor = perfect ? 'rgba(217, 70, 239, 0.75)' : 'rgba(168, 85, 247, 0.55)'
  ctx.shadowBlur = perfect ? 22 : 14
  ctx.shadowOffsetY = 0
  roundRectPath(ctx, x, y, w, h, radius)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.0)'
  ctx.fill()
  ctx.restore()

  // Main fill — vertical gradient
  ctx.save()
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  if (perfect) {
    grad.addColorStop(0, '#f0abfc')
    grad.addColorStop(0.45, '#d946ef')
    grad.addColorStop(1, '#7e22ce')
  } else {
    grad.addColorStop(0, '#c084fc')
    grad.addColorStop(0.5, '#a855f7')
    grad.addColorStop(1, '#581c87')
  }
  roundRectPath(ctx, x, y, w, h, radius)
  ctx.fillStyle = grad
  ctx.fill()

  // Glassy highlight at the top
  const hl = ctx.createLinearGradient(x, y, x, y + h * 0.5)
  hl.addColorStop(0, 'rgba(255, 255, 255, 0.28)')
  hl.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = hl
  ctx.fill()

  // Inner border
  ctx.lineWidth = Math.max(1, w * 0.012)
  ctx.strokeStyle = perfect ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.32)'
  ctx.stroke()
  ctx.restore()

  // "Skill row" accents — three thin lines suggesting modular floors
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
  ctx.lineWidth = 1
  for (let i = 1; i <= 3; i += 1) {
    const ly = y + (h * i) / 4
    ctx.beginPath()
    ctx.moveTo(x + w * 0.18, ly)
    ctx.lineTo(x + w * 0.82, ly)
    ctx.stroke()
  }
  ctx.restore()

  // Perfect tag — a small luminous dot
  if (perfect) {
    ctx.save()
    const cx = x + w / 2
    const cy = y + h * 0.18
    const r = Math.max(2, w * 0.04)
    const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3)
    dotGrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    dotGrad.addColorStop(0.5, 'rgba(240, 171, 252, 0.7)')
    dotGrad.addColorStop(1, 'rgba(240, 171, 252, 0)')
    ctx.fillStyle = dotGrad
    ctx.beginPath()
    ctx.arc(cx, cy, r * 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

const paintRopeStub = (ctx, cx, topY, blockTopY) => {
  if (topY >= blockTopY) return
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx, topY)
  ctx.lineTo(cx, blockTopY)
  ctx.stroke()
  ctx.restore()
}

const drawSwingBlock = (instance, engine) => {
  const { ctx } = engine
  const x = instance.weightX - instance.calWidth
  const blockTopY = instance.weightY + instance.height * 0.3
  // small rope stub above the block to the hook position
  paintRopeStub(ctx, instance.weightX, instance.weightY, blockTopY)
  paintBlockBody(ctx, x, blockTopY, instance.width, instance.height, instance.perfect)
}

const drawBlock = (instance, engine) => {
  const { ctx } = engine
  paintBlockBody(ctx, instance.x, instance.y, instance.width, instance.height, instance.perfect)
}

const drawRotatedBlock = (instance, engine) => {
  const { ctx } = engine
  ctx.save()
  ctx.translate(instance.x, instance.y)
  ctx.rotate(instance.rotate)
  ctx.translate(-instance.x, -instance.y)
  drawBlock(instance, engine)
  ctx.restore()
}

export const blockPainter = (instance, engine) => {
  const { status } = instance
  switch (status) {
    case constant.swing:
      drawSwingBlock(instance, engine)
      break
    case constant.drop:
    case constant.land:
      drawBlock(instance, engine)
      break
    case constant.rotateLeft:
    case constant.rotateRight:
      drawRotatedBlock(instance, engine)
      break
    default:
      break
  }
}
