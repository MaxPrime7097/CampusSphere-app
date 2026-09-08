const audioCache: Record<string, HTMLAudioElement> = {};

export function preloadSounds() {
  const sounds = ['join', 'tick', 'start', 'success', 'fail', 'podium'];
  sounds.forEach(name => {
    const audio = new Audio('/sounds/' + name + '.mp3');
    audio.preload = 'auto';
    audioCache[name] = audio;
  });
}

let isMuted = false;

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuteState() {
  return isMuted;
}

export function playSound(name: string) {
  if (isMuted) return;
  try {
    if (!audioCache[name]) {
      const audio = new Audio('/sounds/' + name + '.mp3');
      audio.preload = 'auto';
      audioCache[name] = audio;
    }
    const audioToPlay = audioCache[name].cloneNode() as HTMLAudioElement;
    audioToPlay.play().catch(e => console.log('Audio prevented:', e));
  } catch (e) {
    console.error('Audio play error:', e);
  }
}
