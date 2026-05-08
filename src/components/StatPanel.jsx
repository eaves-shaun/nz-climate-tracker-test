import React from "react";

export default function StatPanel({
  title,
  row,
  detailMode,
  period,
  variable,
  formatAnomaly,
  periodDetail
}) {
  const anomaly = row
    ? row[variable.anomalyField] ?? row.period_anomaly ?? row.anomaly_c
    : null;

  const isPositive = anomaly >= 0;

  const panelStyle = row
    ? {
        backgroundColor: isPositive
          ? variable.positiveBgColor
          : variable.negativeBgColor,
        borderColor: isPositive
          ? variable.positiveBorderColor
          : variable.negativeBorderColor
      }
    : {};

  return (
    <div className="rounded-2xl shadow-sm border" style={panelStyle}>
      <div className="p-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        {row ? (
          <div className="mt-3 space-y-1">
            <div className="text-3xl font-semibold tracking-tight">
              {row.year}
            </div>

            <div className="text-lg font-medium">
              {formatAnomaly(anomaly, variable)}
            </div>

            <div className="text-sm text-slate-500">
              {detailMode === "district"
                ? periodDetail(row, period, variable)
                : `${row.district_name}, ${periodDetail(row, period, variable)}`}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-3xl font-semibold">—</div>
        )}
      </div>
    </div>
  );
}
