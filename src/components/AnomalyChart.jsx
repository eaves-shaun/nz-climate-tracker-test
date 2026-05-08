import React from "react";

import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine
} from "recharts";

export default function AnomalyChart({
  chartData,
  districtName,
  comparisonName,
  selectedPeriodLabel,
  selectedVariable,
  getAnomalyBarColor,
  formatAnomaly,
  districts,
  comparisonKey,
  setComparisonKey,
  primaryKey
}) {
  function exportSvg() {
    const svg = document.querySelector(".recharts-surface");
  
    if (!svg) return;
  
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
  
    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8"
    });
  
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
  
    link.href = url;
  
    link.download = `${districtName}_${selectedPeriodLabel}.svg`
      .replace(/\s+/g, "_");
  
    link.click();
  
    URL.revokeObjectURL(url);
  }
  
  function DashboardTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-sm">
        <div className="font-semibold mb-1">{label}</div>

        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex justify-between gap-4">
            <span>{entry.name}</span>
            <span className="font-medium">
              {formatAnomaly(entry.value, selectedVariable)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end">
      
        <label className="block w-full max-w-sm">
          <span className="block text-sm font-medium text-slate-600 mb-2">
            Add comparison area
          </span>
      
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
            value={comparisonKey}
            onChange={(event) => setComparisonKey(event.target.value)}
          >
            <option value="">None</option>
      
            {[
              ["national", "National"],
              ["island", "Islands"],
              ["region", "Regions"],
              ["district", "Districts"]
            ].map(([type, label]) => {
              const groupItems = districts.filter(
                (item) =>
                  item.type === type &&
                  item.key !== primaryKey
              );
      
              if (!groupItems.length) return null;
      
              return (
                <optgroup key={type} label={label}>
                  {groupItems.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>
      
        <button
          type="button"
          onClick={exportSvg}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Export SVG
        </button>
      
      </div>

      <div className="h-[32rem]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 24, left: 28, bottom: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" minTickGap={24} />
            <YAxis unit={selectedVariable.anomalyUnit} />
            <Tooltip content={<DashboardTooltip />} />

            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: 12,
                fontSize: 13
              }}
            />

            <ReferenceLine y={0} strokeDasharray="4 4" />

            <Bar
              legendType="none"
              name={`${districtName} ${selectedPeriodLabel} anomaly`}
              dataKey="period_anomaly"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getAnomalyBarColor(entry.period_anomaly, selectedVariable)}
                />
              ))}
            </Bar>

            {comparisonName && (
              <Line
                type="linear"
                name={`${comparisonName} ${selectedPeriodLabel} anomaly`}
                dataKey="comparison_anomaly"
                dot={{ r: 2, fill: "#6b7280" }}
                strokeWidth={2}
                stroke="#6b7280"
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
