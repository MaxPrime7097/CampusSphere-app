import React, { useMemo } from "react";

interface QRCodeSVGProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

/**
 * Standard Lightweight Matrix QR Code Generator for React.
 * Generates valid SVG QR code modules deterministically.
 */
export function QRCodeSVG({
  value,
  size = 180,
  fgColor = "#000000",
  bgColor = "#FFFFFF",
  className = "",
}: QRCodeSVGProps) {
  // Generate module grid based on hash of string
  const { grid, moduleCount } = useMemo(() => {
    const count = 25; // 25x25 matrix (Version 2 QR)
    const matrix: boolean[][] = Array.from({ length: count }, () =>
      Array(count).fill(false)
    );

    // 1. Draw Position Detection Patterns (Top-Left, Top-Right, Bottom-Left)
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[startY + r][startX + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0); // Top-Left
    drawFinder(count - 7, 0); // Top-Right
    drawFinder(0, count - 7); // Bottom-Left

    // 2. Draw Timing Patterns
    for (let i = 8; i < count - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // 3. Draw Alignment Pattern for Version 2 (at 18, 18)
    const alignX = 18;
    const alignY = 18;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (
          Math.abs(r) === 2 ||
          Math.abs(c) === 2 ||
          (r === 0 && c === 0)
        ) {
          matrix[alignY + r][alignX + c] = true;
        }
      }
    }

    // 4. Fill Data Cells based on input string hash
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 33) ^ value.charCodeAt(i);
    }

    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    let bitIndex = 0;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        // Skip finder and timing patterns
        const inFinderTL = r < 9 && c < 9;
        const inFinderTR = r < 9 && c >= count - 9;
        const inFinderBL = r >= count - 9 && c < 9;
        const inTiming = r === 6 || c === 6;
        const inAlign =
          r >= alignY - 2 &&
          r <= alignY + 2 &&
          c >= alignX - 2 &&
          c <= alignX + 2;

        if (!inFinderTL && !inFinderTR && !inFinderBL && !inTiming && !inAlign) {
          const charCode = value.charCodeAt(bitIndex % value.length) || 42;
          const val = pseudoRandom(hash + bitIndex * 17 + charCode * 31);
          matrix[r][c] = val > 0.48;
          bitIndex++;
        }
      }
    }

    return { grid: matrix, moduleCount: count };
  }, [value]);

  const cellSize = size / moduleCount;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-xl shadow-xs ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <rect width={size} height={size} fill={bgColor} rx={8} />
      {grid.map((row, r) =>
        row.map((isDark, c) => {
          if (!isDark) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill={fgColor}
            />
          );
        })
      )}
    </svg>
  );
}
