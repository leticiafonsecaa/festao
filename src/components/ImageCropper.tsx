import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}

const OUTPUT_MAX_WIDTH = 1280;

interface Point {
  x: number;
  y: number;
}

export default function ImageCropper({ file, aspect = 16 / 9, onCancel, onConfirm }: ImageCropperProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [src, setSrc] = useState('');
  const [loadError, setLoadError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point | null>(null);
  const [frameW, setFrameW] = useState(480);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState('');
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerX: number; pointerY: number; origin: Point } | null>(null);

  const frameH = frameW / aspect;

  // Carrega a imagem escolhida. Cada arquivo montado no modal é novo, então o estado começa limpo.
  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      if (cancelled) return;
      setSrc(url);
      setImg(image);
    };
    image.onerror = () => {
      if (!cancelled) setLoadError('Não foi possível carregar esta imagem.');
    };
    image.src = url;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Mede a largura disponível da área de recorte (e acompanha redimensionamento).
  useEffect(() => {
    const update = () => setFrameW(frameRef.current?.clientWidth || 480);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Escala mínima que cobre toda a área de recorte.
  const baseScale = img ? Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) : 1;
  const scale = baseScale * zoom;

  const clampTo = (x: number, y: number, s: number): Point => {
    if (!img) return { x: 0, y: 0 };
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    return {
      x: Math.min(0, Math.max(x, frameW - w)),
      y: Math.min(0, Math.max(y, frameH - h)),
    };
  };

  // Posição atual: centralizada na primeira vez, depois a que o usuário definiu.
  const centered: Point = img
    ? { x: (frameW - img.naturalWidth * scale) / 2, y: (frameH - img.naturalHeight * scale) / 2 }
    : { x: 0, y: 0 };
  const pos = clampTo(offset?.x ?? centered.x, offset?.y ?? centered.y, scale);

  const changeZoom = (next: number) => {
    if (!img) return;
    const nextScale = baseScale * next;
    const cx = frameW / 2;
    const cy = frameH / 2;
    const ratio = nextScale / scale;
    const nx = cx - (cx - pos.x) * ratio;
    const ny = cy - (cy - pos.y) * ratio;
    setZoom(next);
    setOffset(clampTo(nx, ny, nextScale));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerX: e.clientX, pointerY: e.clientY, origin: pos };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(
      clampTo(
        drag.origin.x + (e.clientX - drag.pointerX),
        drag.origin.y + (e.clientY - drag.pointerY),
        scale,
      ),
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleConfirm = () => {
    if (!img) return;
    setProcessing(true);
    setProcessError('');
    const srcX = -pos.x / scale;
    const srcY = -pos.y / scale;
    const srcW = frameW / scale;
    const srcH = frameH / scale;
    const outW = Math.min(OUTPUT_MAX_WIDTH, Math.round(srcW));
    const outH = Math.round(outW / aspect);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setProcessError('Não foi possível processar a imagem.');
      setProcessing(false);
      return;
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setProcessError('Não foi possível processar a imagem.');
          setProcessing(false);
          return;
        }
        onConfirm(new File([blob], 'capa.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  };

  const displayW = img ? img.naturalWidth * scale : 0;
  const displayH = img ? img.naturalHeight * scale : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-card-hover max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xl font-semibold">Ajustar capa</h2>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-cream transition-colors" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-charcoal-light mb-5">
          Arraste a imagem para posicionar e use o zoom para ajustar o enquadramento.
        </p>

        <div
          ref={frameRef}
          className="relative w-full overflow-hidden rounded-2xl bg-cream touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ height: frameH }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {img && (
            <img
              src={src}
              alt=""
              draggable={false}
              className="absolute max-w-none pointer-events-none"
              style={{ left: pos.x, top: pos.y, width: displayW, height: displayH }}
            />
          )}
          {!img && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-charcoal-light">Carregando...</div>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-charcoal/10" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-charcoal-light shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={!img}
            onChange={(e) => changeZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="w-full accent-rose disabled:opacity-40"
          />
        </div>

        {(loadError || processError) && (
          <p className="text-rose text-xs mt-3">{loadError || processError}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onCancel} className="flex-1 btn-secondary text-xs">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!img || processing}
            className="flex-1 btn-primary text-xs disabled:opacity-50"
          >
            {processing ? 'Processando...' : 'Aplicar capa'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
