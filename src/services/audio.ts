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
 * Toca um bip curto de contagem regressiva e vibra nos segundos 3, 2 e 1
 */
export function playWarningBeep(second: number = 3, exerciseName: string = '', enabled: boolean = true) {
  if (enabled) {
    try {
      const ctx = getAudioContext();
      if (ctx) {
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
      }
    } catch (err) {
      console.warn('Áudio de aviso bloqueado ou não suportado:', err);
    }
  }

  // Vibração via API web padrão
  vibrateDevice([180]);

  // Vibração garantida via sistema de notificações (Android PWA)
  sendCountdownNotification(second, exerciseName);
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
 * Notificação e vibração nos segundos 3, 2 e 1 (atualiza a mesma notificação via tag)
 */
export function sendCountdownNotification(second: number, exerciseName: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const title = `⏱️ ${second}... Preparar!`;
  const options = {
    body: `Próximo: ${exerciseName || 'exercício'}`,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [180],
    tag: 'rest-timer',
    renotify: true,
    silent: true
  };

  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.showNotification(title, options);
        }
      });
    }
  } catch (err) {
    console.warn('Não foi possível disparar notificação de contagem:', err);
  }
}

/**
 * Dispara notificação push nativa do sistema / PWA com vibração longa
 */
export function sendTimerNotification(exerciseName: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const title = '⏱️ Descanso Finalizado!';
  const options = {
    body: `Hora da próxima série de ${exerciseName || 'exercício'}. Vamos com tudo!`,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [700, 200, 700],
    tag: 'rest-timer',
    renotify: true
  };

  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.showNotification(title, options);
          // Fechar automaticamente a notificação após 7s se não clicada
          setTimeout(() => {
            reg.getNotifications({ tag: 'rest-timer' }).then(notifs => {
              notifs.forEach(n => n.close());
            });
          }, 7000);
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
 * Função combinada que aciona som final, vibração longa e notificação de término (segundo 0)
 */
export function notifyTimerFinished(exerciseName: string, soundEnabled: boolean = true) {
  playTimerBeep(soundEnabled);
  // Vibração longa no zero (700ms pulso, 200ms pausa, 700ms pulso)
  vibrateDevice([700, 200, 700]);
  sendTimerNotification(exerciseName);
}
