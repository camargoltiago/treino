/**
 * Utilitário para comprimir e converter imagens em Base64 no navegador.
 * Evita upload de imagens gigantes (5MB-15MB de câmeras móveis) e reduz para ~100-200KB,
 * acelerando drasticamente o tempo de resposta da IA e economizando dados e memória.
 */
export async function compressImageToBase64(file: File, maxDimension = 1024, quality = 0.8): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular redimensionamento proporcional se maior que maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas.'));
          return;
        }

        // Desenhar no canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para JPEG comprimido
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1] || '';

        resolve({ dataUrl, base64 });
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão.'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
