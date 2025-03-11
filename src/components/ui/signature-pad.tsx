import React, { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
  onChange?: (dataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onChange,
  width = 400,
  height = 200,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set up the canvas
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "black";
    setCtx(context);

    // Clear the canvas initially
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    setIsDrawing(true);
    if (!ctx) return;

    let clientX, clientY;

    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing || !ctx) return;

    let clientX, clientY;

    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (!ctx) return;
    ctx.closePath();

    // Notify parent component of the signature data
    if (onChange && canvasRef.current) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.beginPath();

    // Notify parent component of the cleared signature
    if (onChange) {
      onChange("");
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-input rounded-md touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      <button
        type="button"
        onClick={clearSignature}
        className="mt-2 text-sm text-muted-foreground hover:text-foreground"
      >
        Clear Signature
      </button>
    </div>
  );
};

export default SignaturePad;
