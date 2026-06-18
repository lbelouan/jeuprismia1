import { getSwingBlockVelocity } from './utils'
import * as constant from './constant'

export const hookAction = (instance, engine, time) => {
  const ropeHeight = engine.getVariable(constant.ropeHeight)
  if (!instance.ready) {
    instance.x = engine.width / 2
    instance.y = ropeHeight * -1.5
    instance.ready = true
  }
  engine.getTimeMovement(
    constant.hookUpMovement,
    [[instance.y, instance.y - ropeHeight]],
    (value) => {
      instance.y = value
    },
    {
      after: () => {
        instance.y = ropeHeight * -1.5
      }
    }
  )
  engine.getTimeMovement(
    constant.hookDownMovement,
    [[instance.y, instance.y + ropeHeight]],
    (value) => {
      instance.y = value
    },
    {
      name: 'hook'
    }
  )
  const initialAngle = engine.getVariable(constant.initialAngle)
  instance.angle = initialAngle *
    getSwingBlockVelocity(engine, time)
  instance.weightX = instance.x +
    (Math.sin(instance.angle) * ropeHeight)
  instance.weightY = instance.y +
    (Math.cos(instance.angle) * ropeHeight)
}

export const hookPainter = (instance, engine) => {
  const { ctx } = engine
  const ropeHeight = engine.getVariable(constant.ropeHeight)
  const cx = instance.x
  const topY = instance.y

  ctx.save()
  // Rotate around the anchor so the rope swings with the pendulum
  ctx.translate(cx, topY)
  ctx.rotate((Math.PI * 2) - instance.angle)
  ctx.translate(-cx, -topY)

  // Rope: thin gradient line
  const ropeGrad = ctx.createLinearGradient(cx, topY, cx, topY + ropeHeight)
  ropeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
  ropeGrad.addColorStop(1, 'rgba(216, 180, 254, 0.85)')
  ctx.strokeStyle = ropeGrad
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(cx, topY)
  ctx.lineTo(cx, topY + ropeHeight)
  ctx.stroke()

  // Hook head (top anchor): glowing diamond on the ceiling crane attachment
  const headSize = Math.max(6, ropeHeight * 0.04)
  ctx.save()
  ctx.shadowColor = 'rgba(217, 70, 239, 0.7)'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(cx, topY - headSize)
  ctx.lineTo(cx + headSize, topY)
  ctx.lineTo(cx, topY + headSize)
  ctx.lineTo(cx - headSize, topY)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Hook hook (bottom): small curved C in violet
  const hookSize = Math.max(8, ropeHeight * 0.05)
  const hookCy = topY + ropeHeight
  ctx.save()
  ctx.shadowColor = 'rgba(217, 70, 239, 0.8)'
  ctx.shadowBlur = 14
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  // small straight bit at the rope end
  ctx.moveTo(cx, hookCy - hookSize * 0.4)
  ctx.lineTo(cx, hookCy)
  // open-bottom curve (hook)
  ctx.arc(cx, hookCy, hookSize * 0.6, -Math.PI / 2, Math.PI, true)
  ctx.stroke()
  // tip glow
  ctx.beginPath()
  ctx.arc(cx - hookSize * 0.6, hookCy, 1.8, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.restore()

  ctx.restore()
}
