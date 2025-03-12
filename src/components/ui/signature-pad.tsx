import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Undo2, Type, Pen } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
  defaultValue?: string;
  width?: number;
  height?: number;
}

const SignaturePad = ({
  onChange,
  defaultValue = "",
  width = 400,
  height = 200,
}: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [fontFamily, setFontFamily] = useState("'Satisfy', cursive");
  const [history, setHistory] = useState<string[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If there's a default value, draw it
    if (defaultValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = defaultValue;
    }

    // Save initial state
    saveState();
  }, [width, height, defaultValue]);

  // Handle drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== "draw") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (isDrawing && mode === "draw") {
      setIsDrawing(false);
      saveState();
      updateOutput();
    }
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);

    // Prevent scrolling while drawing
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== "draw") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    ctx.lineTo(x, y);
    ctx.stroke();

    // Prevent scrolling while drawing
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (isDrawing && mode === "draw") {
      setIsDrawing(false);
      saveState();
      updateOutput();
    }
  };

  // Save current state to history
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    setHistory((prev) => [...prev, dataUrl]);
  };

  // Undo last action
  const handleUndo = () => {
    if (history.length <= 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Remove current state
    setHistory((prev) => {
      const newHistory = [...prev];
      newHistory.pop();
      return newHistory;
    });

    // Load previous state
    const previousState = history[history.length - 2];
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      updateOutput();
    };
    img.src = previousState;
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    saveState();
    updateOutput();
  };

  // Update output
  const updateOutput = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  // Handle typed signature
  const handleTypeSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedSignature(e.target.value);
  };

  const applyTypedSignature = () => {
    if (!typedSignature.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.font = `36px ${fontFamily}`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    saveState();
    updateOutput();
  };

  // Change font
  const handleFontChange = (font: string) => {
    setFontFamily(font);
    if (typedSignature) {
      setTimeout(applyTypedSignature, 50); // Apply after font change
    }
  };

  // Switch between draw and type modes
  const switchToDrawMode = () => {
    setMode("draw");
  };

  const switchToTypeMode = () => {
    setMode("type");
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex space-x-2 mb-4">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={switchToDrawMode}
        >
          <Pen className="h-4 w-4 mr-2" />
          Draw
        </Button>
        <Button
          type="button"
          variant={mode === "type" ? "default" : "outline"}
          size="sm"
          onClick={switchToTypeMode}
        >
          <Type className="h-4 w-4 mr-2" />
          Type
        </Button>
      </div>

      {mode === "draw" ? (
        <>
          <div className="border rounded-md overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="touch-none"
            />
          </div>
          <div className="flex space-x-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={history.length <= 1}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={
                fontFamily === "'Satisfy', cursive" ? "default" : "outline"
              }
              size="sm"
              className="flex-1"
              onClick={() => handleFontChange("'Satisfy', cursive")}
            >
              Signature
            </Button>
            <Button
              type="button"
              variant={
                fontFamily === "'Dancing Script', cursive"
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="flex-1"
              onClick={() => handleFontChange("'Dancing Script', cursive")}
            >
              Cursive
            </Button>
            <Button
              type="button"
              variant={
                fontFamily === "Arial, sans-serif" ? "default" : "outline"
              }
              size="sm"
              className="flex-1"
              onClick={() => handleFontChange("Arial, sans-serif")}
            >
              Print
            </Button>
          </div>

          <input
            type="text"
            value={typedSignature}
            onChange={handleTypeSignature}
            placeholder="Type your signature"
            className="w-full p-2 border rounded-md text-center text-2xl"
            style={{ fontFamily }}
          />

          <div className="border rounded-md overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="touch-none"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={applyTypedSignature}
            disabled={!typedSignature.trim()}
            className="w-full"
          >
            Apply Signature
          </Button>
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
