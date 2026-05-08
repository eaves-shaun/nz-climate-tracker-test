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

function ClimatologyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const temp = payload.find((p) => p.dataKey === "clim_temp_c")?.value;
  const precip = payload.find((p) => p.dataKey === "clim_precip_mm")?.value;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <div className="mb-1 font-semibold">{label}</div>
      <div>
        Precipitation:{" "}
        <span className="font-medium">
          {Number.isFinite(precip) ? Math.round(precip) : "—"} mm
        </span>
      </div>
      <div>
        Temperature:{" "}
        <span className="font-medium">
          {Number.isFinite(temp) ? temp.toFixed(1) : "—"} °C
        </span>
      </div>
    </div>
  );
}

export default function ClimatologyChart({ data }) {
  return (
    <div className="h-[32rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 54, left: 44, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="month_label"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            yAxisId="precip"
            orientation="left"
            unit="mm"
            stroke="#166534"
            tick={{ fontSize: 12 }}
            label={{
              value: "Precipitation (mm)",
              angle: -90,
              position: "insideLeft",
              offset: -28,
              style: {
                fontSize: 14,
                fontWeight: 500,
                fill: "#166534"
              }
            }}
          />

          <YAxis
            yAxisId="temp"
            orientation="right"
            unit="°C"
            stroke="#dc2626"
            tick={{ fontSize: 12 }}
            label={{
              value: "Temperature (°C)",
              angle: 90,
              position: "insideRight",
              offset: -28,
              style: {
                fontSize: 14,
                fontWeight: 500,
                fill: "#dc2626"
              }
            }}
          />

          <Tooltip content={<ClimatologyTooltip />} />

          <Legend />

          <Bar
            yAxisId="precip"
            dataKey="clim_precip_mm"
            name="1991–2020 monthly precipitation"
            fill="#86efac"
          />

          <Line
            yAxisId="temp"
            type="linear"
            dataKey="clim_temp_c"
            name="1991–2020 mean temperature"
            stroke="#dc2626"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#dc2626" }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// import React from "react";

// import {
//   ResponsiveContainer,
//   ComposedChart,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   Bar,
//   Line
// } from "recharts";

// function ClimatologyTooltip({ active, payload, label }) {
//   if (!active || !payload?.length) return null;

//   const temp = payload.find((p) => p.dataKey === "clim_temp_c")?.value;
//   const precip = payload.find((p) => p.dataKey === "clim_precip_mm")?.value;

//   return (
//     <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-sm">
//       <div className="font-semibold mb-1">{label}</div>
//       <div>Temperature: {Number.isFinite(temp) ? temp.toFixed(1) : "—"} °C</div>
//       <div>Precipitation: {Number.isFinite(precip) ? Math.round(precip) : "—"} mm</div>
//     </div>
//   );
// }

// export default function ClimatologyChart({ data }) {
//   return (
//     <div className="h-[32rem] w-full">
//       <ResponsiveContainer width="100%" height="100%">
//         <ComposedChart
//           data={data}
//           margin={{ top: 10, right: 48, left: 32, bottom: 10 }}
//         >
//           <CartesianGrid strokeDasharray="3 3" />

//           <XAxis dataKey="month_label" />

//           <YAxis
//             yAxisId="temp"
//             unit="°C"
//             stroke="#dc2626"
//             tick={{ fontSize: 12 }}
//             label={{
//               value: "Temperature (°C)",
//               angle: -90,
//               position: "insideLeft",
//               offset: 4,
//               style: { fontSize: 14, fontWeight: 500, fill: "#dc2626" }
//             }}
//           />

//           <YAxis
//             yAxisId="precip"
//             orientation="right"
//             unit="mm"
//             stroke="#166534"
//             tick={{ fontSize: 12 }}
//             label={{
//               value: "Precipitation (mm)",
//               angle: 90,
//               position: "insideRight",
//               offset: 8,
//               style: { fontSize: 14, fontWeight: 500, fill: "#166534" }
//             }}
//           />

//           <Tooltip content={<ClimatologyTooltip />} />

//           <Legend />

//           <Bar
//             yAxisId="temp"
//             dataKey="clim_temp_c"
//             name="1991–2020 mean temperature"
//             fill="#f87171"
//           />

//           <Line
//             yAxisId="precip"
//             type="linear"
//             dataKey="clim_precip_mm"
//             name="1991–2020 precipitation"
//             dot={{ r: 3, fill: "#166534" }}
//             stroke="#166534"
//             strokeWidth={2}
//           />
//         </ComposedChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }
