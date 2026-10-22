/**
 * Serviço de reconhecimento de voz (Speech-to-Text) usando Web Speech API nativa.
 * Funciona de forma instantânea em navegadores modernos (Chrome, Edge, Android, iOS Safari 14.5+).
 */

// Declaração de tipos para Web Speech API caso não estejam nos tipos globais
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}

export const SpeechService = {
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  createRecognitionInstance(handlers: SpeechRecognitionHandlers) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      handlers.onError?.('Reconhecimento de voz não é suportado neste navegador.');
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        handlers.onStart?.();
      };

      recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            if (item.isFinal) {
              sessionFinal += item[0].transcript + ' ';
            } else {
              sessionInterim += item[0].transcript + ' ';
            }
          }
        }

        const transcript = (sessionFinal + sessionInterim).trim().replace(/\s+/g, ' ');
        if (transcript) {
          handlers.onResult(transcript, sessionInterim.trim().length === 0);
        }
      };

      recognition.onerror = (event: any) => {
        let msg = 'Erro no microfone.';
        if (event.error === 'not-allowed') {
          msg = 'Permissão de microfone negada. Permita o microfone no navegador.';
        } else if (event.error === 'no-speech') {
          msg = 'Nenhuma fala detectada. Tente falar mais próximo ao microfone.';
        } else if (event.error === 'network') {
          msg = 'Falha de conexão no reconhecimento de áudio.';
        }
        handlers.onError?.(msg);
      };

      recognition.onend = () => {
        handlers.onEnd?.();
      };

      return recognition;
    } catch (err: any) {
      handlers.onError?.(err?.message || 'Erro ao inicializar microfone.');
      return null;
    }
  }
};
