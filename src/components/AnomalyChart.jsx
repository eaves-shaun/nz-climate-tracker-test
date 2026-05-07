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
  selectedPeriodLabel,
  selectedVariable,
  getAnomalyBarColor,
  formatAnomaly
}) {
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
    <div className="h-[32rem]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 24, left: 8, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" minTickGap={24} />
          <YAxis unit={selectedVariable.anomalyUnit} />
          <Tooltip content={<DashboardTooltip />} />

          <Legend
            content={() => (
              <div className="flex items-center justify-center gap-6 text-sm w-full">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    <div
                      className="w-3 h-3"
                      style={{ backgroundColor: selectedVariable.positiveColor }}
                    />
                    <div
                      className="w-3 h-3"
                      style={{ backgroundColor: selectedVariable.negativeColor }}
                    />
                  </div>
                  <span>
                    {`${districtName} ${selectedPeriodLabel} ${selectedVariable.label.toLowerCase()} anomaly`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-gray-500" />
                  <span>
                    {`Nationwide ${selectedPeriodLabel} mean ${selectedVariable.label.toLowerCase()} anomaly`}
                  </span>
                </div>
              </div>
            )}
          />

          <ReferenceLine y={0} strokeDasharray="4 4" />

          <Bar
            legendType="none"
            name={`${districtName} ${selectedPeriodLabel} ${selectedVariable.label.toLowerCase()} anomaly`}
            dataKey="period_anomaly"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getAnomalyBarColor(entry.period_anomaly, selectedVariable)}
              />
            ))}
          </Bar>

          <Line
            type="linear"
            name={`Nationwide ${selectedPeriodLabel} mean ${selectedVariable.label.toLowerCase()} anomaly`}
            dataKey="national_period_anomaly"
            dot={{ r: 2, fill: "#6b7280" }}
            strokeWidth={2}
            stroke="#6b7280"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
