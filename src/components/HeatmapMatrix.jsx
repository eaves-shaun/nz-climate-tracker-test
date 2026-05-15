import React, { useEffect, useRef } from "react";

export default function HeatmapMatrix({
  MONTHS,
  heatmapRows,
  heatmapYears,
  heatmapMaxAbs,
  selectedVariable,
  findMatrixCell,
  getHeatmapColor,
  formatAnomaly,
  formatValue,
  onCellClick
}) {
  const [hoveredCell, setHoveredCell] = React.useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [heatmapYears]);

  return (
    <div ref={scrollRef} className="overflow-x-auto pb-2">
      <div
        className="grid gap-px text-xs"
        style={{
          gridTemplateColumns: `4.5rem repeat(${heatmapYears.length}, minmax(1.45rem, 1fr))`,
          minWidth: `${Math.max(860, heatmapYears.length * 24 + 90)}px`
        }}
      >
        <div className="sticky left-0 z-10 bg-white" />

        {heatmapYears.map((year) => (
          <div
            key={`year-${year}`}
            className="h-8 flex items-center justify-center text-[0.65rem] text-slate-500 -rotate-45 origin-center"
          >
            {year}
          </div>
        ))}

        {MONTHS.map((month) => (
          <React.Fragment key={`month-row-${month.value}`}>
            <div className="sticky left-0 z-10 bg-white pr-2 flex items-center text-slate-600 font-medium">
              {month.label.slice(0, 3)}
            </div>

            {heatmapYears.map((year) => {
              const cell = findMatrixCell(
                heatmapRows,
                year,
                month.value
              );

              const cellKey = `${month.value}-${year}`;

              const title = cell
                ? `${month.label} ${year}: anomaly ${formatAnomaly(
                    cell.anomaly,
                    selectedVariable
                  )}, value ${formatValue(
                    cell.display_value,
                    selectedVariable
                  )}`
                : `${month.label} ${year}: no data`;

              return (
                <button
                  key={cellKey}
                  type="button"
                  title={title}
                  aria-label={title}
                  disabled={!cell}
                  onClick={() => {
                    if (cell) onCellClick?.(cell);
                  }}
                  onMouseEnter={() => setHoveredCell(cellKey)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`h-5 rounded-[2px] border border-white p-0 ${
                    cell ? "cursor-pointer" : "cursor-default"
                  }`}
                  style={{
                    backgroundColor: getHeatmapColor(
                      cell?.anomaly,
                      heatmapMaxAbs,
                      selectedVariable
                    ),
                    outline:
                      hoveredCell === cellKey
                        ? "2px solid #111827"
                        : "none",
                    outlineOffset: "-1px",
                    transform:
                      hoveredCell === cellKey
                        ? "scale(1.15)"
                        : "scale(1)",
                    zIndex:
                      hoveredCell === cellKey
                        ? 20
                        : 1,
                    position: "relative"
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
