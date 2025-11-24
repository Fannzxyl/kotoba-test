import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GameEngine } from '../core/engine';
import { TargetEntity } from '../core/types';

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
  onTargetHit: (target: TargetEntity) => void;
  onWrongTarget: (target: TargetEntity) => void;
}

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ onEngineReady, onTargetHit, onWrongTarget }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<GameEngine | null>(null);

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Inisialisasi engine sekali saja
      const engine = new GameEngine(canvas, onTargetHit, onWrongTarget);
      engineRef.current = engine;
      onEngineReady(engine);

      // Pastikan size canvas ikut container
      const handleResize = () => {
        engine.resize();
      };

      window.addEventListener('resize', handleResize);
      // Resize di awal
      engine.resize();

      // Input mouse & touch
      const handleInput = (e: MouseEvent | TouchEvent) => {
        e.preventDefault(); // cegah scroll di HP

        const currentCanvas = canvasRef.current;
        if (!currentCanvas || !engineRef.current) return;

        const rect = currentCanvas.getBoundingClientRect();
        let clientX: number;
        let clientY: number;

        if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          const me = e as MouseEvent;
          clientX = me.clientX;
          clientY = me.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        engineRef.current.handleInput(x, y);
      };

      const mouseHandler = (evt: MouseEvent) => handleInput(evt);
      const touchHandler = (evt: TouchEvent) => handleInput(evt);

      canvas.addEventListener('mousedown', mouseHandler);
      canvas.addEventListener('touchstart', touchHandler, {
        passive: false,
      } as AddEventListenerOptions);

      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', mouseHandler);
        canvas.removeEventListener('touchstart', touchHandler);
        engine.stop();
      };
      // PENTING: effect ini cuma jalan sekali saat mount
    }, []); // <<< ini yang kemarin bikin masalah kalau diisi deps

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none select-none cursor-crosshair"
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
