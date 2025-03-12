import { useRef, useEffect, useState } from "react";
import { Button } from "./button";
import { Eraser, Undo2 } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
  width?: number;
  height?: number;
  defaultValue?: string;
}

const SignaturePad = ({
  onChange,
  width = 400,
  height = 200,
  defaultValue = "",
}: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas properties
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#000";

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Fill with white background
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    const initialState = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    setHistory([initialState]);

    setCtx(context);

    // Load default value if provided
    if (defaultValue) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
        saveState();
      };
      img.src = defaultValue;
    }
  }, [width, height, defaultValue]);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!ctx) return;
    setIsDrawing(true);

    // Get mouse/touch position
    const { offsetX, offsetY } = getCoordinates(e);

    // Start path
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing || !ctx) return;

    // Get mouse/touch position
    const { offsetX, offsetY } = getCoordinates(e);

    // Draw line
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !ctx) return;
    setIsDrawing(false);
    ctx.closePath();
    saveState();
  };

  const getCoordinates = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    if ("touches" in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      };
    } else {
      // Mouse event
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY,
      };
    }
  };

  const saveState = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, currentState]);

    // Notify parent component of change
    onChange(canvas.toDataURL());
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const undo = () => {
    if (!ctx || !canvasRef.current || history.length <= 1) return;
    const canvas = canvasRef.current;
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
    onChange(canvas.toDataURL());
  };

  return (
    <div className="flex flex-col items-center">
      <div className="border rounded-md overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none"
        />
      </div>
      <div className="flex space-x-2 mt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={history.length <= 1}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
