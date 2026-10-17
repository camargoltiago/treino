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
 * Toca um bip curto de contagem regressiva (para os segundos 2 e 1)
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

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    // Vibração tátil sutil de contagem
    vibrateDevice([100]);
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
 * Vibra o celular no bolso (padrão esportivo tátil)
 */
export function vibrateDevice(pattern: number | number[] = [300, 150, 300]) {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Vibração não permitida pelo navegador:', e);
    }
  }
}

/**
 * Solicita permissão para notificações do sistema (se ainda não solicitou)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/**
 * Dispara notificação push nativa do sistema / PWA
 */
export function sendTimerNotification(exerciseName: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const title = '⏱️ Descanso Finalizado!';
  const options = {
    body: `Hora da próxima série de ${exerciseName || 'exercício'}. Vamos com tudo!`,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [300, 150, 300],
    tag: 'rest-timer'
  };

  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
      });
    } else {
      new Notification(title, options);
    }
  } catch (err) {
    console.warn('Não foi possível disparar notificação:', err);
  }
}

/**
 * Função combinada que aciona som final, vibração forte e notificação de descanso (segundo 0)
 */
export function notifyTimerFinished(exerciseName: string, soundEnabled: boolean = true) {
  playTimerBeep(soundEnabled);
  vibrateDevice([350, 150, 350]);
  sendTimerNotification(exerciseName);
}
