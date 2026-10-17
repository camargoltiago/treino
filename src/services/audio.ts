let audioCtx: AudioContext | null = null;

/**
 * Toca o bip duplo esportivo ao finalizar o descanso
 */
export function playTimerBeep(enabled: boolean = true) {
  if (!enabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Arpeggio de sino esportivo duplo (880Hz -> 1174Hz)
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.75);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.75);
  } catch (err) {
    console.warn('Áudio bloqueado pelo navegador ou não suportado:', err);
  }
}

/**
 * Vibra o celular no bolso (padrão de alerta esportivo)
 */
export function vibrateDevice(pattern: number[] = [250, 100, 250]) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignorar caso navegador restrinja
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
    vibrate: [250, 100, 250],
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
 * Função combinada que aciona som, vibração e notificação de descanso
 */
export function notifyTimerFinished(exerciseName: string, soundEnabled: boolean = true) {
  playTimerBeep(soundEnabled);
  vibrateDevice([250, 120, 250]);
  sendTimerNotification(exerciseName);
}
