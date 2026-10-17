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
 * Solicita permissão para notificações do sistema (se ainda não concedido)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
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
 * Dispara notificação via Service Worker com padrão de vibração.
 * No Android/Chrome, esta é a ÚNICA forma permitida pelo sistema operacional de vibrar
 * o celular quando a tela está apagada/bloqueada ou o aplicativo em segundo plano.
 */
export async function sendTimerNotification(
  title: string,
  body: string,
  vibratePattern: number | number[] = 800,
  autoCloseMs?: number
) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const pattern = Array.isArray(vibratePattern) ? vibratePattern : [vibratePattern];

  const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: pattern,
    tag: 'rest-timer',
    renotify: true
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        await reg.showNotification(title, options);
        if (autoCloseMs && autoCloseMs > 0) {
          setTimeout(async () => {
            try {
              const notifs = await reg.getNotifications({ tag: 'rest-timer' });
              notifs.forEach(n => n.close());
            } catch {
              // ignore
            }
          }, autoCloseMs);
        }
        return;
      }
    }
  } catch (err) {
    console.warn('Erro ao disparar notificação com vibração:', err);
  }
}

/**
 * Vibra o celular diretamente (funciona quando a tela está ligada e o app aberto)
 * Retorna true se a chamada foi aceita pelo navegador
 */
export function vibrateDevice(durationMs: number | number[] = 150): boolean {
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
 * Toca um bip curto de contagem regressiva e vibra nos segundos 3, 2 e 1.
 * Com a tela aberta: vibração física tátil de 150ms.
 * Com a tela fechada/bloqueada: canaliza via notificação para vibrar o celular no bolso.
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

  // Vibração rápida de preparação (150ms) com a tela aberta
  vibrateDevice(150);

  // Se a tela estiver apagada/bloqueada (document.hidden), o Android bloqueia o navigator.vibrate.
  // Canalizamos via notificação com renotify para acionar o motor de vibração no bolso.
  if (typeof document !== 'undefined' && document.hidden) {
    sendTimerNotification(
      `⏱️ ${second}... Preparar!`,
      `Próximo: ${exerciseName || 'exercício'}`,
      [150]
    );
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
 * Função combinada ao finalizar o descanso (segundo 0):
 * Toca o som esportivo + 1 vibração longa e contínua de 800ms
 * Se a tela estiver fechada (ou em segundo plano), canaliza a notificação para vibrar o celular no bolso
 */
export function notifyTimerFinished(exerciseName: string = '', soundEnabled: boolean = true) {
  playTimerBeep(soundEnabled);

  // Vibração direta (tela aberta)
  vibrateDevice(800);

  // Notificação do sistema: se a tela estiver fechada, faz o aparelho vibrar 800ms no bolso
  // e exibe a mensagem na tela de bloqueio
  sendTimerNotification(
    '⏱️ Descanso Finalizado!',
    `Hora da próxima série de ${exerciseName || 'exercício'}. Vamos lá!`,
    [800],
    8000
  );
}
