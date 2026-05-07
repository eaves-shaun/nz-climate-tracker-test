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

  const bg = row
    ? anomaly >= 0
      ? variable.positiveBg
      : variable.negativeBg
    : "bg-white";

  const border = row
    ? anomaly >= 0
      ? variable.positiveBorder
      : variable.negativeBorder
    : "border-slate-200";

  return (
    <div className={`rounded-2xl shadow-sm border ${border} ${bg}`}>
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
