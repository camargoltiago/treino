let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Toca um bip curto de contagem regressiva nos segundos 3, 2 e 1
 */
export function playWarningBeep(enabled: boolean = true) {
  if (!enabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Bip curto de preparação (750 Hz)
    osc.frequency.setValueAtTime(750, ctx.currentTime);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    console.warn('Áudio de aviso bloqueado ou não suportado:', err);
  }
}

/**
 * Toca o bip duplo esportivo ao finalizar o descanso (segundo 0)
 */
export function playTimerBeep(enabled: boolean = true) {
  if (!enabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpeggio de sino esportivo duplo (880Hz -> 1174Hz)
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn('Áudio bloqueado pelo navegador ou não suportado:', err);
  }
}

/**
 * Vibra o celular (padrão único longo ou pulsos)
 * Retorna true se a chamada foi aceita pelo navegador
 */
export function vibrateDevice(durationMs: number | number[] = 1000): boolean {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      return navigator.vibrate(durationMs);
    } catch (e) {
      console.warn('Vibração não permitida pelo navegador:', e);
      return false;
    }
  }
  return false;
}

/**
 * Função combinada ao finalizar o descanso (segundo 0):
 * Toca o som esportivo + 1 vibração longa de 1 segundo (sem push notification)
 */
export function notifyTimerFinished(exerciseName: string = '', soundEnabled: boolean = true) {
  playTimerBeep(soundEnabled);
  // 1 vibração longa apenas (1000ms = 1 segundo)
  vibrateDevice(1000);
}
