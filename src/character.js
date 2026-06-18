import * as constant from './constant'

const JUMP_DURATION = 540
const SPEECH_DURATION = 3200
const SPEECH_FADE = 320

const messages = [
  "T'as prévu quoi pour ce soir ?",
  'Tu fais quoi cette aprem ?',
  'Qu’est-ce tu fais de beau ce soir ?',
  'Ça dit quoi ?',
  'Quoi de neuf ?',
  'Tu deviens quoi toi ?',
  'On se capte ce week-end ?',
  'T’as des plans samedi ?',
  'Café ?',
  'T’as bien dormi ?'
]

const state = {
  jumpStart: null,
  speech: null,
  speechStart: null,
  lastSpeechFloor: 0
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export const resetCharacter = () => {
  state.jumpStart = null
  state.speech = null
  state.speechStart = null
  state.lastSpeechFloor = 0
}

export const triggerCharacterJump = (engine) => {
  state.jumpStart = now()
  const successCount = engine.getVariable(constant.successCount, 0)
  if (successCount > 0 && successCount % 5 === 0 && successCount !== state.lastSpeechFloor) {
    state.lastSpeechFloor = successCount
    const idx = Math.floor(Math.random() * messages.length)
    state.speech = messages[idx]
    state.speechStart = now()
  }
}

const roundedRectPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

const drawSpeechBubble = (ctx, anchorX, baseY, text, scale, alpha, canvasWidth) => {
  ctx.save()
  ctx.globalAlpha = alpha
  const fontSize = Math.max(11, Math.floor(13 * scale))
  ctx.font = `700 ${fontSize}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const padX = 14 * scale
  const padY = 8 * scale
  const margin = 10 * scale

  const maxBubbleWidth = canvasWidth - margin * 2
  const m = ctx.measureText(text)
  const w = Math.min(maxBubbleWidth, m.width + padX * 2)
  const h = fontSize + padY * 2
  const r = 10 * scale

  // Center on anchorX, clamped to keep the bubble fully inside the canvas
  const minX = margin
  const maxX = canvasWidth - margin - w
  const x = Math.max(minX, Math.min(maxX, anchorX - w / 2))
  const y = baseY - h - 8 * scale

  // Bubble body
  ctx.shadowColor = 'rgba(168, 85, 247, 0.7)'
  ctx.shadowBlur = 16
  const grad = ctx.createLinearGradient(0, y, 0, y + h)
  grad.addColorStop(0, '#d946ef')
  grad.addColorStop(1, '#a855f7')
  ctx.fillStyle = grad
  roundedRectPath(ctx, x, y, w, h, r)
  ctx.fill()

  // Tail — anchored under anchorX but clamped within the bubble
  ctx.shadowBlur = 0
  const tailMid = Math.max(x + r + 6 * scale, Math.min(x + w - r - 6 * scale, anchorX))
  ctx.beginPath()
  ctx.moveTo(tailMid - 6 * scale, y + h)
  ctx.lineTo(tailMid, y + h + 8 * scale)
  ctx.lineTo(tailMid + 6 * scale, y + h)
  ctx.closePath()
  ctx.fillStyle = '#a855f7'
  ctx.fill()

  // Text (truncate with ellipsis if it still overflows)
  let display = text
  if (m.width > w - padX * 2) {
    let truncated = text
    while (truncated.length > 1 && ctx.measureText(truncated + '…').width > w - padX * 2) {
      truncated = truncated.slice(0, -1)
    }
    display = truncated + '…'
  }
  ctx.fillStyle = '#fff'
  ctx.fillText(display, x + w / 2, y + h / 2)
  ctx.restore()
}

const drawCharacter = (ctx, cx, footY, scale) => {
  const skin = '#e8c8a0'
  const hair = '#3a2418'
  const shirt = '#b074ff'
  const shirtDark = '#7e3ddb'
  const pants = '#1f1330'
  const shoe = '#0f0820'
  const u = scale

  const legH = 7 * u
  const torsoH = 13 * u
  const headR = 8 * u
  const headCy = footY - legH - torsoH - headR

  ctx.save()
  ctx.lineJoin = 'round'

  // Drop shadow under feet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(cx, footY + 1.5 * u, 10 * u, 2.5 * u, 0, 0, Math.PI * 2)
  ctx.fill()

  // Shoes
  ctx.fillStyle = shoe
  ctx.fillRect(cx - 6 * u, footY - 1.2 * u, 5 * u, 2.2 * u)
  ctx.fillRect(cx + 1 * u, footY - 1.2 * u, 5 * u, 2.2 * u)

  // Legs
  ctx.fillStyle = pants
  ctx.fillRect(cx - 5 * u, footY - legH, 4 * u, legH)
  ctx.fillRect(cx + 1 * u, footY - legH, 4 * u, legH)

  // Torso
  const torsoX = cx - 7 * u
  const torsoY = footY - legH - torsoH
  const torsoGrad = ctx.createLinearGradient(torsoX, torsoY, torsoX, torsoY + torsoH)
  torsoGrad.addColorStop(0, shirt)
  torsoGrad.addColorStop(1, shirtDark)
  ctx.fillStyle = torsoGrad
  roundedRectPath(ctx, torsoX, torsoY, 14 * u, torsoH, 3 * u)
  ctx.fill()
  // Highlight on shirt
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  roundedRectPath(ctx, torsoX + 1.2 * u, torsoY + 1.2 * u, 12 * u, torsoH * 0.45, 2 * u)
  ctx.fill()

  // Arms
  ctx.fillStyle = skin
  ctx.fillRect(torsoX - 3 * u, torsoY + 2 * u, 3 * u, 8 * u)
  ctx.fillRect(torsoX + 14 * u, torsoY + 2 * u, 3 * u, 8 * u)
  // Sleeves
  ctx.fillStyle = shirtDark
  ctx.fillRect(torsoX - 3 * u, torsoY + 2 * u, 3 * u, 2.5 * u)
  ctx.fillRect(torsoX + 14 * u, torsoY + 2 * u, 3 * u, 2.5 * u)

  // Head (skin)
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(cx, headCy, headR, 0, Math.PI * 2)
  ctx.fill()

  // Hair — top half + spiky bangs falling on the forehead
  ctx.fillStyle = hair
  ctx.beginPath()
  ctx.arc(cx, headCy, headR, Math.PI, 0)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - headR + 1 * u, headCy + 1.2 * u)
  ctx.lineTo(cx - headR + 3.5 * u, headCy - 2 * u)
  ctx.lineTo(cx - 2 * u, headCy + 1.5 * u)
  ctx.lineTo(cx + 1 * u, headCy - 2 * u)
  ctx.lineTo(cx + headR - 1.5 * u, headCy + 1.2 * u)
  ctx.lineTo(cx + headR - 1 * u, headCy - 0.4 * u)
  ctx.lineTo(cx - headR + 1 * u, headCy - 0.4 * u)
  ctx.closePath()
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#1a1014'
  ctx.beginPath()
  ctx.arc(cx - 2.8 * u, headCy + 1.6 * u, 1.1 * u, 0, Math.PI * 2)
  ctx.arc(cx + 2.8 * u, headCy + 1.6 * u, 1.1 * u, 0, Math.PI * 2)
  ctx.fill()
  // Eye glints
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.beginPath()
  ctx.arc(cx - 2.5 * u, headCy + 1.25 * u, 0.4 * u, 0, Math.PI * 2)
  ctx.arc(cx + 3.1 * u, headCy + 1.25 * u, 0.4 * u, 0, Math.PI * 2)
  ctx.fill()

  // Moustache — central curve + small curls at the tips
  ctx.fillStyle = hair
  ctx.beginPath()
  ctx.ellipse(cx, headCy + 4.2 * u, 4.4 * u, 1.5 * u, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx - 4.2 * u, headCy + 3.8 * u, 1.1 * u, 0, Math.PI * 2)
  ctx.arc(cx + 4.2 * u, headCy + 3.8 * u, 1.1 * u, 0, Math.PI * 2)
  ctx.fill()

  // Goatee on the chin
  ctx.beginPath()
  ctx.moveTo(cx - 2.6 * u, headCy + 5.7 * u)
  ctx.lineTo(cx + 2.6 * u, headCy + 5.7 * u)
  ctx.lineTo(cx + 0.8 * u, headCy + 8.8 * u)
  ctx.lineTo(cx - 0.8 * u, headCy + 8.8 * u)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

export const paintCharacter = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return
  const line = engine.getInstance('line')
  if (!line || !line.ready) return

  const ctx = engine.ctx
  const lineLeft = (line.x !== undefined && line.x !== null) ? line.x : 0
  const lineRight = (line.collisionX !== undefined && line.collisionX !== null) ? line.collisionX : engine.width
  const cx = (lineLeft + lineRight) / 2
  const groundY = line.y
  const scale = Math.max(1, engine.width / 380)

  // Vertical jump animation
  let jumpOffset = 0
  if (state.jumpStart !== null) {
    const elapsed = now() - state.jumpStart
    if (elapsed < JUMP_DURATION) {
      const t = elapsed / JUMP_DURATION
      const maxJump = 34 * scale
      jumpOffset = -maxJump * Math.sin(t * Math.PI)
    } else {
      state.jumpStart = null
    }
  }

  const footY = groundY + jumpOffset

  drawCharacter(ctx, cx, footY, scale)

  // Speech bubble
  if (state.speech !== null && state.speechStart !== null) {
    const elapsed = now() - state.speechStart
    if (elapsed < SPEECH_DURATION) {
      let alpha = 1
      if (elapsed < SPEECH_FADE) alpha = elapsed / SPEECH_FADE
      else if (elapsed > SPEECH_DURATION - SPEECH_FADE) alpha = (SPEECH_DURATION - elapsed) / SPEECH_FADE
      const legH = 7 * scale
      const torsoH = 13 * scale
      const headR = 8 * scale
      const headTop = footY - legH - torsoH - headR * 2
      drawSpeechBubble(ctx, cx, headTop, state.speech, scale, Math.max(0, Math.min(1, alpha)), engine.width)
    } else {
      state.speech = null
      state.speechStart = null
    }
  }
}
