// Escolhe a cor do texto (escuro ou claro) de acordo com a luminosidade da imagem da capa.

export const HERO_TEXT_DARK = '#2D2926';
export const HERO_TEXT_LIGHT = '#FFFFFF';

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const channelLuminance = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

// Luminosidade relativa (WCAG), de 0 (preto) a 1 (branco).
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

// Retorna o texto (escuro ou claro) com melhor contraste sobre o fundo informado.
export function pickTextColor(backgroundHex: string): string {
  const bg = relativeLuminance(backgroundHex);
  const contrastWithDark = (bg + 0.05) / (relativeLuminance(HERO_TEXT_DARK) + 0.05);
  const contrastWithLight = (1 + 0.05) / (bg + 0.05);
  return contrastWithLight > contrastWithDark ? HERO_TEXT_LIGHT : HERO_TEXT_DARK;
}

// Cor média da imagem (amostra reduzida). Retorna null se a imagem não puder ser lida,
// por exemplo quando um site externo não libera o acesso aos pixels.
export function averageImageColor(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        const count = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        resolve(rgbToHex(r / count, g / count, b / count));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
