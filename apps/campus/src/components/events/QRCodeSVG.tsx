import { useMemo } from "react";
import QRCode from "qrcode";

interface QRCodeSVGProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

/**
 * Standard ISO-compliant scannable QR Code SVG component using `qrcode`.
 */
export function QRCodeSVG({
  value,
  size = 180,
  fgColor = "#111827",
  bgColor = "#FFFFFF",
  className = "",
}: QRCodeSVGProps) {
  const { modules, count } = useMemo(() => {
    if (!value) {
      return { modules: null, count: 0 };
    }
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
      return {
        modules: qr.modules,
        count: qr.modules.size,
      };
    } catch {
      return { modules: null, count: 0 };
    }
  }, [value]);

  if (!modules || count === 0) {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: bgColor }}
        className={`rounded-xl border border-border/40 flex items-center justify-center text-[10px] text-muted-foreground ${className}`}
      >
        QR
      </div>
    );
  }

  const quietZone = 2;
  const totalModules = count + quietZone * 2;

  const rects: JSX.Element[] = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules.get(r, c)) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c + quietZone}
            y={r + quietZone}
            width={1.02}
            height={1.02}
            fill={fgColor}
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalModules} ${totalModules}`}
      shapeRendering="crispEdges"
      className={`rounded-xl shadow-xs ${className}`}
      style={{ backgroundColor: bgColor }}
      role="img"
      aria-label={`QR Code ${value}`}
    >
      <rect width={totalModules} height={totalModules} fill={bgColor} />
      {rects}
    </svg>
  );
}
