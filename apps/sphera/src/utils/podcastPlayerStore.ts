import { useSyncExternalStore } from 'react'

export interface PodcastState {
  isActive: boolean
  isPlaying: boolean
  isMuted: boolean
  sessionId?: string | number
  title: string
  audioUrl?: string
  currentTime: number
  duration: number
  playbackSpeed: number
  dialogue?: Array<{ speaker: string; text: string }>
  lang?: string
}

let state: PodcastState = {
  isActive: false,
  isPlaying: false,
  isMuted: false,
  sessionId: undefined,
  title: '',
  audioUrl: undefined,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
  dialogue: undefined,
  lang: 'fr-FR',
}

const listeners = new Set<() => void>()
let audioElement: HTMLAudioElement | null = null
let currentTurnIndex = 0
let speechActive = false

// Chromium garbage-collection protection
let currentUtterance: SpeechSynthesisUtterance | null = null

// Speech voice boundary reactivity tracking
let speechVoiceEnergy = 0
let speechWordDuration = 220
let speechWordStartTime = 0

function emit() {
  listeners.forEach((l) => l())
}

function cleanSpokenText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[*_#`~]/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim()
}

function speakNextTurn() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  if (!speechActive || !state.dialogue || currentTurnIndex >= state.dialogue.length) {
    speechActive = false
    speechVoiceEnergy = 0
    currentUtterance = null
    state = { ...state, isPlaying: false }
    emit()
    return
  }

  const turn = state.dialogue[currentTurnIndex]
  const cleaned = cleanSpokenText(turn.text)
  if (!cleaned) {
    currentTurnIndex++
    state = { ...state, currentTime: currentTurnIndex }
    emit()
    speakNextTurn()
    return
  }

  const isSpeakerA = turn.speaker === 'A' || turn.speaker === '1'
  const langCode = state.lang?.toLowerCase().startsWith('en') ? 'en-US' : 'fr-FR'

  const utterance = new SpeechSynthesisUtterance(cleaned)
  currentUtterance = utterance
  utterance.lang = langCode
  utterance.rate = state.playbackSpeed
  utterance.pitch = isSpeakerA ? 1.0 : 1.15
  utterance.volume = state.isMuted ? 0 : 1

  // Best-effort matching browser voice
  try {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const langPrefix = langCode.slice(0, 2)
      const matching = voices.filter((v) => v.lang.startsWith(langPrefix))
      if (matching.length > 0) {
        utterance.voice = isSpeakerA ? matching[0] : (matching.length > 1 ? matching[1] : matching[0])
      }
    }
  } catch {
    // Keep default voice
  }

  utterance.onstart = () => {
    speechVoiceEnergy = 0.85
    speechWordDuration = 220
    speechWordStartTime = performance.now()
  }

  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      speechVoiceEnergy = 0.7 + Math.random() * 0.3
      speechWordDuration = Math.max(160, Math.min(480, (event.charLength || 5) * 50))
      speechWordStartTime = performance.now()
    }
  }

  utterance.onend = () => {
    speechVoiceEnergy = 0
    currentUtterance = null
    currentTurnIndex++
    state = { ...state, currentTime: currentTurnIndex }
    emit()
    if (speechActive) {
      speakNextTurn()
    }
  }

  utterance.onerror = (e) => {
    if (e.error === 'interrupted' || e.error === 'canceled') {
      return
    }
    console.warn('[podcastStore] speech error:', e.error)
    speechActive = false
    speechVoiceEnergy = 0
    currentUtterance = null
    state = { ...state, isPlaying: false }
    emit()
  }

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }

  window.speechSynthesis.speak(utterance)
}

function getAudio(): HTMLAudioElement {
  if (!audioElement && typeof window !== 'undefined') {
    audioElement = new Audio()
    audioElement.preload = 'auto'
    audioElement.addEventListener('timeupdate', () => {
      state = { ...state, currentTime: audioElement?.currentTime || 0 }
      emit()
    })
    audioElement.addEventListener('loadedmetadata', () => {
      state = { ...state, duration: audioElement?.duration || 0 }
      emit()
    })
    audioElement.addEventListener('ended', () => {
      state = { ...state, isPlaying: false, currentTime: 0 }
      emit()
    })
    audioElement.addEventListener('play', () => {
      state = { ...state, isPlaying: true }
      emit()
    })
    audioElement.addEventListener('pause', () => {
      state = { ...state, isPlaying: false }
      emit()
    })
    audioElement.addEventListener('error', () => {
      console.warn('[podcastStore] Audio element failed, falling back to speech synthesis')
      if (state.dialogue && state.dialogue.length > 0) {
        state = { ...state, audioUrl: undefined }
        podcastStore.loadAndPlay(state.title, undefined, state.dialogue, state.lang, state.sessionId)
      }
    })
  }
  return audioElement!
}

export const podcastStore = {
  getSnapshot(): PodcastState {
    return state
  },

  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  loadAndPlay(
    title: string,
    audioUrl?: string,
    dialogue?: Array<{ speaker: string; text: string }>,
    lang?: string,
    sessionId?: string | number
  ) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speechActive = false
    speechVoiceEnergy = 0
    currentUtterance = null
    currentTurnIndex = 0

    state = {
      ...state,
      isActive: true,
      sessionId,
      title: title || 'Podcast audio',
      audioUrl,
      dialogue,
      lang: lang || 'fr-FR',
      currentTime: 0,
      duration: audioUrl ? state.duration : (dialogue?.length || 0),
    }

    if (audioUrl) {
      const audio = getAudio()
      audio.muted = state.isMuted
      if (audio.src !== audioUrl) {
        audio.src = audioUrl
        audio.load()
      }
      audio.playbackRate = state.playbackSpeed
      audio.play().catch((err) => {
        console.warn('[podcastStore] Audio playback failed:', err)
        // Fall back to SpeechSynthesis
        if (dialogue && dialogue.length > 0) {
          state = { ...state, audioUrl: undefined, isPlaying: true }
          speechActive = true
          emit()
          speakNextTurn()
        }
      })
    } else if (dialogue && dialogue.length > 0) {
      speechActive = true
      state = { ...state, isPlaying: true }
      emit()
      // Allow browser speech queue to settle after cancel()
      setTimeout(() => {
        if (speechActive) {
          speakNextTurn()
        }
      }, 50)
    } else {
      state = { ...state, isPlaying: true }
      emit()
    }
  },

  togglePlay() {
    if (state.audioUrl) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      speechActive = false
      speechVoiceEnergy = 0
      currentUtterance = null

      const audio = getAudio()
      if (state.isPlaying) {
        audio.pause()
      } else {
        audio.play().catch(console.warn)
      }
    } else if (state.dialogue && state.dialogue.length > 0) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (state.isPlaying) {
          window.speechSynthesis.cancel()
          speechActive = false
          speechVoiceEnergy = 0
          currentUtterance = null
          state = { ...state, isPlaying: false }
          emit()
        } else {
          speechActive = true
          state = { ...state, isPlaying: true }
          emit()
          setTimeout(() => {
            if (speechActive) {
              speakNextTurn()
            }
          }, 50)
        }
      }
    } else {
      state = { ...state, isPlaying: !state.isPlaying }
      emit()
    }
  },

  toggleMute() {
    const nextMuted = !state.isMuted
    if (audioElement) {
      audioElement.muted = nextMuted
    }
    state = { ...state, isMuted: nextMuted }
    emit()
    // If speech is ongoing, adjust current volume
    if (currentUtterance) {
      currentUtterance.volume = nextMuted ? 0 : 1
    }
  },

  pause() {
    if (state.audioUrl) {
      const audio = getAudio()
      audio.pause()
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speechActive = false
    speechVoiceEnergy = 0
    currentUtterance = null
    state = { ...state, isPlaying: false }
    emit()
  },

  seek(time: number) {
    if (state.audioUrl) {
      const audio = getAudio()
      audio.currentTime = time
    }
    state = { ...state, currentTime: time }
    emit()
  },

  skip(seconds: number) {
    if (state.audioUrl) {
      const audio = getAudio()
      const newTime = Math.max(0, Math.min(state.duration || 9999, (audio.currentTime || 0) + seconds))
      audio.currentTime = newTime
      state = { ...state, currentTime: newTime }
      emit()
    } else if (state.dialogue && state.dialogue.length > 0) {
      const nextTurn = Math.max(0, Math.min(state.dialogue.length - 1, currentTurnIndex + (seconds > 0 ? 1 : -1)))
      this.seekToTurn(nextTurn)
    }
  },

  seekToTurn(turnIndex: number) {
    if (!state.dialogue || turnIndex < 0 || turnIndex >= state.dialogue.length) return
    currentTurnIndex = turnIndex

    if (state.audioUrl) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      speechActive = false
      speechVoiceEnergy = 0
      currentUtterance = null

      const audio = getAudio()
      const totalTurns = state.dialogue.length
      const targetTime = state.duration > 0 ? (turnIndex / totalTurns) * state.duration : 0
      audio.currentTime = targetTime
      state = { ...state, currentTime: targetTime }
      emit()
      if (!state.isPlaying) {
        audio.play().catch(console.warn)
      }
      return
    }

    state = { ...state, currentTime: currentTurnIndex }
    emit()
    if (state.isPlaying) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      speechActive = true
      currentUtterance = null
      setTimeout(() => {
        if (speechActive) {
          speakNextTurn()
        }
      }, 50)
    }
  },

  setSpeed(speed: number) {
    if (state.audioUrl) {
      const audio = getAudio()
      audio.playbackRate = speed
    }
    state = { ...state, playbackSpeed: speed }
    emit()
  },

  close() {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    speechActive = false
    speechVoiceEnergy = 0
    currentUtterance = null
    currentTurnIndex = 0
    state = {
      ...state,
      isActive: false,
      isPlaying: false,
      currentTime: 0,
    }
    emit()
  },
}

export function getPodcastVoiceData(binsCount = 24): number[] {
  if (!state.isPlaying) {
    return Array.from({ length: binsCount }, (_, i) => 4 + (i % 2) * 2)
  }

  // 1. Browser speech synthesis reactive voice envelope (word boundaries)
  if (speechActive) {
    const now = performance.now()
    const elapsed = now - speechWordStartTime

    if (elapsed < speechWordDuration && speechVoiceEnergy > 0) {
      const progress = elapsed / speechWordDuration
      const envelope = Math.sin(progress * Math.PI) * speechVoiceEnergy

      return Array.from({ length: binsCount }, (_, i) => {
        const normalizedPos = i / (binsCount - 1)
        const formantWeight = Math.sin(normalizedPos * Math.PI) * 0.85 + 0.15
        const jitter = Math.sin(now * 0.04 + i * 1.3) * 0.2 + 0.8
        const targetHeight = envelope * formantWeight * jitter * 92
        return Math.max(6, Math.min(96, Math.round(targetHeight)))
      })
    } else {
      // Subtle inter-word breath pause
      return Array.from({ length: binsCount }, (_, i) => 5 + (i % 3) * 2)
    }
  }

  // 2. Audio URL harmonic pulse
  if (state.audioUrl) {
    const now = performance.now()
    const pulse = Math.sin(now * 0.008) * 0.3 + 0.7
    return Array.from({ length: binsCount }, (_, i) => {
      const freq = Math.sin(now * 0.015 + i * 0.5) * 0.35 + 0.55
      return Math.max(6, Math.min(92, Math.round(freq * pulse * 75)))
    })
  }

  return Array.from({ length: binsCount }, () => 6)
}

export function usePodcastPlayer() {
  return useSyncExternalStore(podcastStore.subscribe, podcastStore.getSnapshot)
}
