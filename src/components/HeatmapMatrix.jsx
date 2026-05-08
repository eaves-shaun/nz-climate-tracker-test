import React from "react";

export default function HeatmapMatrix({
  MONTHS,
  heatmapRows,
  heatmapYears,
  heatmapMaxAbs,
  selectedVariable,
  findMatrixCell,
  getHeatmapColor,
  formatAnomaly,
  formatValue
}) {
  const [hoveredCell, setHoveredCell] = React.useState(null);
  
  return (
    <div className="overflow-x-auto pb-2">
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
               <div
                  key={`${month.value}-${year}`}
                  title={title}
                  aria-label={title}
                  onMouseEnter={() => setHoveredCell(`${month.value}-${year}`)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className="h-5 rounded-[2px] border border-white"
                  style={{
                    backgroundColor: getHeatmapColor(
                      cell?.anomaly,
                      heatmapMaxAbs,
                      selectedVariable
                    ),
                    outline:
                      hoveredCell === `${month.value}-${year}`
                        ? "2px solid #111827"
                        : "none",
                    outlineOffset: "-1px",
                    transform:
                      hoveredCell === `${month.value}-${year}`
                        ? "scale(1.15)"
                        : "scale(1)",
                    zIndex:
                      hoveredCell === `${month.value}-${year}`
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
