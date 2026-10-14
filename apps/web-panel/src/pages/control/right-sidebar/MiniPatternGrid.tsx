import React from "react";

export interface MiniPatternGridProps {
  points: number[];
  size?: number;
  interactive?: boolean;
  onPointClick?: (point: number) => void;
}

export const MiniPatternGrid: React.FC<MiniPatternGridProps> = ({
  points,
  size = 54,
  interactive = false,
  onPointClick
}) => {
  const coords: Record<number, [number, number]> = {
    0: [15, 15], 1: [45, 15], 2: [75, 15],
    3: [15, 45], 4: [45, 45], 5: [75, 45],
    6: [15, 75], 7: [45, 75], 8: [75, 75]
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 90 90"
      style={{
        background: "#060911",
        borderRadius: "6px",
        border: "1px solid #1e293b",
        overflow: "hidden",
        flexShrink: 0
      }}
    >
      {/* Connector lines between consecutive selected points */}
      {points.slice(0, -1).map((pt, idx) => {
        const nextPt = points[idx + 1];
        const p1 = coords[pt];
        const p2 = coords[nextPt];
        if (!p1 || !p2) return null;
        return (
          <line
            key={`line-${idx}`}
            x1={p1[0]}
            y1={p1[1]}
            x2={p2[0]}
            y2={p2[1]}
            stroke="#00e5ff"
            strokeWidth={interactive ? "4" : "3"}
            strokeLinecap="round"
          />
        );
      })}

      {/* 9 Grid Dots */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pt) => {
        const c = coords[pt];
        const isSelected = points.includes(pt);
        const seqIndex = points.indexOf(pt);
        return (
          <g
            key={`dot-${pt}`}
            onClick={() => interactive && onPointClick?.(pt)}
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            <circle
              cx={c[0]}
              cy={c[1]}
              r={interactive ? (isSelected ? 9 : 7) : (isSelected ? 6 : 4)}
              fill={isSelected ? "#00e5ff" : "#1e293b"}
              stroke={isSelected ? "#ffffff" : "#334155"}
              strokeWidth="1.5"
            />
            {isSelected && seqIndex >= 0 && (
              <text
                x={c[0]}
                y={c[1] + (interactive ? 3 : 2)}
                fontSize={interactive ? "8" : "6"}
                fontWeight="900"
                fill="#000000"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {seqIndex + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
