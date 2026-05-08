import React from "react";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line
} from "recharts";

export default function ClimatologyChart({ data }) {
  return (
    <div style={{ width: "100%", height: 416, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 32, left: 8, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month_label" />

          <YAxis
            yAxisId="temp"
            unit="°C"
            label={{
              value: "Temperature",
              angle: -90,
              position: "insideLeft"
            }}
          />

          <YAxis
            yAxisId="precip"
            orientation="right"
            unit="mm"
            label={{
              value: "Precipitation",
              angle: 90,
              position: "insideRight"
            }}
          />

          <Tooltip />

          <Legend />

          <Bar
            yAxisId="temp"
            dataKey="clim_temp_c"
            name="1991–2020 mean temperature"
          />

          <Line
            yAxisId="precip"
            type="linear"
            dataKey="clim_precip_mm"
            name="1991–2020 precipitation"
            dot={{ r: 3 }}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
