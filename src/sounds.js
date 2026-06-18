let audioCtx = null
let muted = false

const getCtx = () => {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  if (audioCtx.state === 'suspended') {
    try { audioCtx.resume() } catch (e) { /* ignored */ }
  }
  return audioCtx
}

export const setMuted = (m) => { muted = !!m }
export const isMuted = () => muted

const playTone = (opts) => {
  if (muted) return
  const ctx = getCtx()
  if (!ctx) return
  const {
    freq,
    type = 'sine',
    duration = 0.15,
    gain = 0.18,
    attack = 0.005,
    release = 0.1,
    slideTo = null,
    when = 0
  } = opts
  const t = ctx.currentTime + when
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration)
  }
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration + release)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration + release + 0.05)
}

const playNoiseBurst = (opts) => {
  if (muted) return
  const ctx = getCtx()
  if (!ctx) return
  const {
    duration = 0.12,
    gain = 0.15,
    lowpass = 1800,
    highpass = 0,
    when = 0
  } = opts
  const t = ctx.currentTime + when
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = lowpass
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  let node = src.connect(lp)
  if (highpass > 0) {
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = highpass
    node = node.connect(hp)
  }
  node.connect(g)
  g.connect(ctx.destination)
  src.start(t)
  src.stop(t + duration)
}

// A muted "thud" when a block lands on the stack
export const playDrop = () => {
  playTone({
    freq: 240, slideTo: 90, type: 'triangle',
    duration: 0.07, gain: 0.18, release: 0.16
  })
  playNoiseBurst({ duration: 0.05, gain: 0.06, lowpass: 600 })
}

// A bright two-note chime when the drop is perfect
export const playPerfect = () => {
  playTone({ freq: 880, type: 'sine', duration: 0.08, gain: 0.14, release: 0.18 })
  playTone({ freq: 1320, type: 'sine', duration: 0.12, gain: 0.12, release: 0.22, when: 0.06 })
  playTone({ freq: 1760, type: 'sine', duration: 0.16, gain: 0.08, release: 0.24, when: 0.13 })
}

// A soft swish during rotation/fall
export const playRotate = () => {
  playNoiseBurst({ duration: 0.16, gain: 0.08, lowpass: 1400, highpass: 400 })
}

// A short descending chord on game over
export const playGameOver = () => {
  const seq = [392, 311, 247, 196]
  seq.forEach((freq, i) => {
    playTone({
      freq, type: 'triangle',
      duration: 0.22, gain: 0.16, release: 0.24,
      when: i * 0.12
    })
  })
}

// Click acknowledgement (kept for future use)
export const playClick = () => {
  playTone({ freq: 660, type: 'square', duration: 0.04, gain: 0.08, release: 0.06 })
}
