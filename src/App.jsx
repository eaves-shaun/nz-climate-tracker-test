import React, { useEffect, useMemo, useState } from "react";
import StatPanel from "./components/StatPanel";
import AnomalyChart from "./components/AnomalyChart";
import HeatmapMatrix from "./components/HeatmapMatrix";
import ClimatologyChart from "./components/ClimatologyChart";

function Card({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

// Dashboard expects the newer CSV exported from GEE with these columns:
// district_id,district_name,date,year,month,temp_c,precip_mm,clim_temp_c,clim_precip_mm,temp_anom_c,precip_anom_pct,area_m2,n_original_features,buffered_any,auckland_grouped
//
// It also remains backwards-compatible with the older temperature-only columns:
// district_id,district_name,date,year,month,temp_c,anomalies
//
// This dashboard uses district_name as the primary selection key because some
// CSV exports can have blank district_id values while district_name is present.
const APP_BASE_URL = import.meta.env?.BASE_URL ?? "/";
const CSV_URL = `${APP_BASE_URL}data/nz_grouped_era5land_monthly_195001_202604.csv`;
const DEFAULT_AREA_NAME = "New Zealand";
const sampleData = [];

const VARIABLES = {
  temp: {
    value: "temp",
    label: "Temperature",
    anomalyField: "temp_anom_c",
    valueField: "temp_c",
    unit: "°C",
    anomalyUnit: "°C",
    positiveLabel: "Warmest",
    negativeLabel: "Coolest",
    positiveColor: "#dc2626",
    negativeColor: "#2563eb",
    positiveBg: "bg-red-50",
    negativeBg: "bg-blue-50",
    positiveBorder: "border-red-300",
    negativeBorder: "border-blue-300",
    positiveBgColor: "#fef2f2",
    negativeBgColor: "#eff6ff",
    positiveBorderColor: "#fca5a5",
    negativeBorderColor: "#93c5fd"
  },
  precip: {
    value: "precip",
    label: "Precipitation",
    anomalyField: "precip_anom_pct",
    valueField: "precip_mm",
    unit: "mm",
    anomalyUnit: "%",
    positiveLabel: "Wettest",
    negativeLabel: "Driest",
    positiveColor: "#16a34a",
    negativeColor: "#b45309",
    positiveBg: "bg-green-50",
    negativeBg: "bg-amber-50",
    positiveBorder: "border-green-300",
    negativeBorder: "border-amber-300",
    positiveBgColor: "#f0fdf4",
    negativeBgColor: "#fffbeb",
    positiveBorderColor: "#86efac",
    negativeBorderColor: "#fcd34d"
  }
};

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const PERIODS = [
  { value: "annual", label: "Annual mean", type: "annual" },
  { value: "DJF", label: "DJF", type: "season", months: [12, 1, 2] },
  { value: "MAM", label: "MAM", type: "season", months: [3, 4, 5] },
  { value: "JJA", label: "JJA", type: "season", months: [6, 7, 8] },
  { value: "SON", label: "SON", type: "season", months: [9, 10, 11] },
  ...MONTHS.map((month) => ({
    value: String(month.value),
    label: month.label,
    type: "month",
    month: month.value
  }))
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  const parsed = typeof value === "number" ? value : Number(cleanText(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function mean(values) {
  const valid = values.map(toNumber).filter((value) => value !== null);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function weightedMean(values, weights) {
  const pairs = values
    .map((value, index) => ({
      value: toNumber(value),
      weight: toNumber(weights[index])
    }))
    .filter((pair) => pair.value !== null && pair.weight !== null && pair.weight > 0);

  if (!pairs.length) return null;

  const weightedSum = pairs.reduce((sum, pair) => sum + pair.value * pair.weight, 0);
  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);

  if (totalWeight === 0) return null;

  return weightedSum / totalWeight;
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  out.push(current);
  return out;
}

function normaliseRows(rows) {
  return rows
    .map((row) => {
      const rawAreaType = cleanText(row.area_type || row.region_type || "district").toLowerCase();

      const areaType =
        rawAreaType === "national" || rawAreaType === "nationwide"
          ? "national"
          : rawAreaType === "islands" || rawAreaType === "island"
            ? "island"
            : rawAreaType === "regions" || rawAreaType === "region"
              ? "region"
              : "district";

      const areaName = cleanText(row.area_name || row.district_name);
      const areaId = cleanText(row.area_id || row.district_id || areaName);

      const tempAnom = toNumber(row.temp_anom_c ?? row.anomaly_c ?? row.anomalies);
      const precipAnom = toNumber(row.precip_anom_pct);

      return {
        district_id: areaId,
        district_name: areaName,
        district_key: `${areaType}__${areaId}`,
        area_type: areaType,
        area_name: areaName,
        area_id: areaId,
        area_key: `${areaType}__${areaId}`,

        date: cleanText(row.date),
        year: toNumber(row.year),
        month: toNumber(row.month),
        temp_c: toNumber(row.temp_c),
        precip_mm: toNumber(row.precip_mm),
        clim_temp_c: toNumber(row.clim_temp_c),
        clim_precip_mm: toNumber(row.clim_precip_mm),
        temp_anom_c: tempAnom,
        precip_anom_pct: precipAnom,
        anomaly_c: tempAnom,
        area_m2: toNumber(row.area_m2) ?? 1,
        n_original_features: toNumber(row.n_original_features),
        buffered_any: cleanText(row.buffered_any),
        auckland_grouped: cleanText(row.auckland_grouped)
      };
    })
    .filter((row) => (
      row.district_name &&
      row.district_key &&
      row.date &&
      Number.isFinite(row.year) &&
      Number.isFinite(row.month) &&
      row.temp_anom_c !== null
    ));
}

function parseTemperatureCsv(text) {
  const lines = cleanText(text).split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => cleanText(header).replace(/^\uFEFF/, ""));
  const rawRows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });

  return normaliseRows(rawRows);
}

function getDistrictClimatology(rows, districtKey) {
  return MONTHS.map((month) => {
    const monthRows = rows.filter(
      (row) =>
        row.district_key === districtKey &&
        row.month === month.value
    );

    return {
      month: month.value,
      month_label: month.label.slice(0, 3),
      clim_temp_c: mean(monthRows.map((row) => row.clim_temp_c)),
      clim_precip_mm: mean(monthRows.map((row) => row.clim_precip_mm))
    };
  });
}

function getDistricts(rows) {
  const byKey = new Map();

  rows.forEach((row) => {
    if (!byKey.has(row.district_key)) {
      byKey.set(row.district_key, {
        key: row.district_key,
        name: row.district_name,
        id: row.district_id,
        type: row.area_type || "district"
      });
    }
  });

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });
}
function getExtremum(rows, mode, variable = VARIABLES.temp) {
  const field = variable.anomalyField;
  const valid = rows.filter((row) => Number.isFinite(row[field]));
  if (!valid.length) return null;

  return valid.reduce((best, row) => {
    if (!best) return row;
    if (mode === "max") return row[field] > best[field] ? row : best;
    return row[field] < best[field] ? row : best;
  }, null);
}

function getPeriodConfig(periodValue) {
  return PERIODS.find((period) => period.value === periodValue) ?? PERIODS[0];
}

function getSeasonYear(row, season) {
  if (season === "DJF" && row.month === 12) return row.year + 1;
  return row.year;
}

function getSeasonRows(rows, season) {
  const config = getPeriodConfig(season);
  if (!config || config.type !== "season") return [];
  return rows.filter((row) => config.months.includes(row.month));
}

function aggregateRows(rows, getGroupKey, requiredMonthCount = null) {
  const grouped = new Map();

  rows.forEach((row) => {
    const groupKey = getGroupKey(row);
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey).push(row);
  });

  return Array.from(grouped.entries()).map(([groupKey, groupRows]) => {
    const uniqueMonths = new Set(groupRows.map((row) => row.month));
    if (requiredMonthCount !== null && uniqueMonths.size !== requiredMonthCount) return null;

    const first = groupRows[0];
    const parts = String(groupKey).split("__");
    const year = toNumber(parts[parts.length - 1]);

    return {
      district_id: first.district_id,
      district_name: first.district_name,
      district_key: first.district_key,
      year,
      month: null,
      temp_c: weightedMean(groupRows.map((row) => row.temp_c), groupRows.map((row) => row.area_m2)),
      precip_mm: weightedMean(groupRows.map((row) => row.precip_mm), groupRows.map((row) => row.area_m2)),
      temp_anom_c: weightedMean(groupRows.map((row) => row.temp_anom_c), groupRows.map((row) => row.area_m2)),
      precip_anom_pct: weightedMean(groupRows.map((row) => row.precip_anom_pct), groupRows.map((row) => row.area_m2)),
      anomaly_c: weightedMean(groupRows.map((row) => row.temp_anom_c), groupRows.map((row) => row.area_m2)),
      area_m2: mean(groupRows.map((row) => row.area_m2))
    };
  }).filter((row) => row && row.year !== null && row.temp_anom_c !== null);
}

function getPeriodRows(rows, period) {
  if (!period) return [];

  if (period.type === "annual") {
    return aggregateRows(rows, (row) => `${row.district_key}__${row.year}`, 12);
  }

  if (period.type === "season") {
    const seasonRows = getSeasonRows(rows, period.value);
    return aggregateRows(seasonRows, (row) => `${row.district_key}__${getSeasonYear(row, period.value)}`, 3);
  }

  return rows.filter((row) => row.month === period.month);
}

function getAnnualDistrictAnomalies(rows, districtKey) {
  const annualRows = getPeriodRows(rows, getPeriodConfig("annual"));
  return annualRows
    .filter((row) => row.district_key === districtKey)
    .sort((a, b) => a.year - b.year)
    .map((row) => ({ year: row.year, annual_anomaly_c: row.anomaly_c }));
}

function getDistrictPeriodAnomalies(rows, districtKey, period, variable = VARIABLES.temp) {
  return getPeriodRows(rows, period)
    .filter((row) => row.district_key === districtKey && Number.isFinite(row[variable.anomalyField]))
    .sort((a, b) => a.year - b.year)
    .map((row) => ({
      year: row.year,
      period_anomaly: row[variable.anomalyField],
      period_anomaly_c: row[variable.anomalyField],
      month_anomaly_c: row[variable.anomalyField],
      display_value: row[variable.valueField],
      temp_c: row.temp_c,
      precip_mm: row.precip_mm
    }));
}

function getMonthDistrictAnomalies(rows, districtKey, month) {
  return getDistrictPeriodAnomalies(rows, districtKey, getPeriodConfig(String(month)), VARIABLES.temp);
}

function getNationalPeriodMeanAnomalies(rows, period, variable = VARIABLES.temp) {
  const periodRows = getPeriodRows(rows, period);
  const grouped = new Map();

  periodRows.forEach((row) => {
    const value = row[variable.anomalyField];
    if (!Number.isFinite(value)) return;

    if (!grouped.has(row.year)) grouped.set(row.year, []);

    grouped.get(row.year).push({
      value,
      area: toNumber(row.area_m2) ?? 1
    });
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, entries]) => {
      const weighted = weightedMean(
        entries.map((entry) => entry.value),
        entries.map((entry) => entry.area)
      );

      return {
        year,
        national_period_anomaly: weighted,
        national_period_anomaly_c: weighted
      };
    });
}

function getNationalMonthMeanAnomalies(rows, month) {
  return getNationalPeriodMeanAnomalies(rows, getPeriodConfig(String(month)), VARIABLES.temp);
}

function mergeChartSeries(annualRows, periodRows, nationalPeriodRows) {
  const byYear = new Map();

  annualRows.forEach((row) => {
    byYear.set(row.year, {
      year: row.year,
      annual_anomaly_c: row.annual_anomaly_c
    });
  });

  periodRows.forEach((row) => {
    const existing = byYear.get(row.year) ?? { year: row.year };
    byYear.set(row.year, {
      ...existing,
      period_anomaly: row.period_anomaly,
      period_anomaly_c: row.period_anomaly,
      month_anomaly_c: row.period_anomaly,
      display_value: row.display_value,
      temp_c: row.temp_c,
      precip_mm: row.precip_mm
    });
  });

  nationalPeriodRows.forEach((row) => {
    const existing = byYear.get(row.year) ?? { year: row.year };
    byYear.set(row.year, {
      ...existing,
      national_period_anomaly: row.national_period_anomaly,
      national_period_anomaly_c: row.national_period_anomaly
    });
  });

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

function mergeAnnualAndMonthly(annualRows, monthRows) {
  return mergeChartSeries(annualRows, monthRows, []);
}

function getAnomalyBarColor(value, variable = VARIABLES.temp) {
  if (!Number.isFinite(value)) return "#94a3b8";
  return value >= 0 ? variable.positiveColor : variable.negativeColor;
}

function getHeatmapColor(value, maxAbs, variable = VARIABLES.temp) {
  if (!Number.isFinite(value)) return "#e5e7eb";
  if (!Number.isFinite(maxAbs) || maxAbs === 0) return "#f8fafc";

  const intensity = Math.min(Math.abs(value) / maxAbs, 1);
  const lightness = 96 - intensity * 42;

  if (variable.value === "precip") {
    if (value >= 0) return `hsl(142 65% ${lightness}%)`;
    return `hsl(32 75% ${lightness}%)`;
  }

  if (value >= 0) return `hsl(0 72% ${lightness}%)`;
  return `hsl(217 78% ${lightness}%)`;
}

function getDistrictMonthlyMatrix(rows, districtKey, variable = VARIABLES.temp) {
  return rows
    .filter((row) => row.district_key === districtKey && Number.isFinite(row[variable.anomalyField]))
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((row) => ({
      year: row.year,
      month: row.month,
      month_label: MONTHS.find((m) => m.value === row.month)?.label ?? `Month ${row.month}`,
      anomaly: row[variable.anomalyField],
      anomaly_c: row[variable.anomalyField],
      display_value: row[variable.valueField],
      temp_c: row.temp_c,
      precip_mm: row.precip_mm,
      date: row.date
    }));
}

function getMatrixYears(matrixRows) {
  return Array.from(new Set(matrixRows.map((row) => row.year))).sort((a, b) => a - b);
}

function findMatrixCell(matrixRows, year, month) {
  return matrixRows.find((row) => row.year === year && row.month === month) ?? null;
}

function formatAnomaly(value, variable = VARIABLES.temp) {
  if (!Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)} ${variable.anomalyUnit}`;
}

function formatValue(value, variable = VARIABLES.temp) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)} ${variable.unit}`;
}

function formatTemp(value) {
  return formatValue(value, VARIABLES.temp);
}

function periodLabel(period) {
  return period?.label ?? "Selected period";
}

function periodDetail(row, period, variable = VARIABLES.temp) {
  if (!row) return "—";
  const value = formatValue(row[variable.valueField] ?? row.display_value, variable);
  const label = periodLabel(period);
  return `${value} for ${label}`;
}


export default function NZERA5DashboardPrototype() {
  const [rows, setRows] = useState([]);
  const [dataStatus, setDataStatus] = useState(`Loading data from ${CSV_URL}...`);
  const districts = useMemo(() => getDistricts(rows), [rows]);
  const [districtKey, setDistrictKey] = useState("");
  const [periodValue, setPeriodValue] = useState("annual");
  const [variableValue, setVariableValue] = useState("temp");
  const [comparisonKey, setComparisonKey] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(CSV_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`CSV not found at ${CSV_URL}`);
        return response.text();
      })
      .then((text) => {
        const parsed = parseTemperatureCsv(text);
        if (!parsed.length) throw new Error("CSV parsed successfully, but no valid rows were found.");
        if (!cancelled) {
          setRows(parsed);
          setDistrictKey((current) => {
            if (parsed.some((row) => row.district_key === current)) return current;
          
            const defaultRow = parsed.find(
              (row) => row.district_name === DEFAULT_AREA_NAME
            );
          
            return defaultRow?.district_key ?? parsed[0]?.district_key ?? "";
          });
          setDataStatus(`Loaded ${parsed.length.toLocaleString()} rows from ${CSV_URL}.`);
        }
      })
      .catch((error) => {
        if (!cancelled) setDataStatus(`${error.message} Falling back to sample data for preview.`);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (districts.length && !districts.some((district) => district.key === districtKey)) {
      setDistrictKey(districts[0].key);
    }
  }, [districts, districtKey]);

  const selectedDistrict = districts.find((district) => district.key === districtKey) ?? districts[0];
  const comparisonArea =  districts.find((district) => district.key === comparisonKey) ?? null;
  const selectedPeriod = useMemo(() => getPeriodConfig(periodValue), [periodValue]);
  const selectedVariable = VARIABLES[variableValue] ?? VARIABLES.temp;

  const periodRows = useMemo(() => getPeriodRows(rows, selectedPeriod), [rows, selectedPeriod]);
  const districtPeriodRows = useMemo(() => {
    return periodRows.filter((row) => row.district_key === selectedDistrict?.key);
  }, [periodRows, selectedDistrict]);
  const countryPeriodRows = periodRows;

  const districtWarmest = useMemo(() => getExtremum(districtPeriodRows, "max", selectedVariable), [districtPeriodRows, selectedVariable]);
  const districtCoolest = useMemo(() => getExtremum(districtPeriodRows, "min", selectedVariable), [districtPeriodRows, selectedVariable]);
  const countryWarmest = useMemo(() => getExtremum(countryPeriodRows, "max", selectedVariable), [countryPeriodRows, selectedVariable]);
  const countryCoolest = useMemo(() => getExtremum(countryPeriodRows, "min", selectedVariable), [countryPeriodRows, selectedVariable]);

  const chartData = useMemo(() => {
    if (!selectedDistrict) return [];
  
    const primaryRows = getDistrictPeriodAnomalies(
      rows,
      selectedDistrict.key,
      selectedPeriod,
      selectedVariable
    );
  
    const comparisonRows = comparisonArea
      ? getDistrictPeriodAnomalies(
          rows,
          comparisonArea.key,
          selectedPeriod,
          selectedVariable
        )
      : [];
  
    const byYear = new Map();
  
    primaryRows.forEach((row) => {
      byYear.set(row.year, {
        year: row.year,
        period_anomaly: row.period_anomaly
      });
    });
  
    comparisonRows.forEach((row) => {
      const existing = byYear.get(row.year) ?? { year: row.year };
      byYear.set(row.year, {
        ...existing,
        comparison_anomaly: row.period_anomaly
      });
    });
  
    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [
    rows,
    selectedDistrict,
    comparisonArea,
    selectedPeriod,
    selectedVariable
  ]);

  const heatmapRows = useMemo(() => {
    if (!selectedDistrict) return [];
    return getDistrictMonthlyMatrix(rows, selectedDistrict.key, selectedVariable);
  }, [rows, selectedDistrict, selectedVariable]);

  const heatmapYears = useMemo(() => getMatrixYears(heatmapRows), [heatmapRows]);

  const heatmapMaxAbs = useMemo(() => {
    const values = heatmapRows.map((row) => Math.abs(row.anomaly)).filter(Number.isFinite);
    return values.length ? Math.max(...values) : 0;
  }, [heatmapRows]);

  const selectedPeriodLabel = periodLabel(selectedPeriod);
  const districtName = selectedDistrict?.name ?? "District";
  
  const climatologyData = useMemo(() => {
    if (!selectedDistrict) return [];
    return getDistrictClimatology(rows, selectedDistrict.key);
  }, [rows, selectedDistrict]);
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex items-start gap-4">
          
            <img
              src={`${APP_BASE_URL}NZClimTracker-logo-noText.png`}
              alt="NZ Climate Tracker logo"
              style={{
                width: "250px",
                height: "250px",
                objectFit: "contain",
                marginTop: "4px"
              }}
            />
          
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">
                ERA5-Land / New Zealand
              </p>
          
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                NZ Climate Tracker
              </h1>
          
              
            </div>
          
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-[48rem]">
            <label className="block">
              <span className="block text-sm font-medium text-slate-600 mb-2">District</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
                value={selectedDistrict?.key ?? ""}
                onChange={(event) => setDistrictKey(event.target.value)}
              >
                {[
                  ["national", "National"],
                  ["island", "Islands"],
                  ["region", "Regions"],
                  ["district", "Districts"]
                ].map(([type, label]) => {
                  const groupItems = districts.filter((item) => item.type === type);
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

            <label className="block">
              <span className="block text-sm font-medium text-slate-600 mb-2">Variable</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
                value={variableValue}
                onChange={(event) => setVariableValue(event.target.value)}
              >
                {Object.values(VARIABLES).map((variable) => (
                  <option key={variable.value} value={variable.value}>{variable.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-600 mb-2">Period</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
                value={periodValue}
                onChange={(event) => setPeriodValue(event.target.value)}
              >
                {PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatPanel
            title={`${districtName}: ${selectedVariable.positiveLabel.toLowerCase()} ${selectedPeriodLabel}`}
            row={districtWarmest}
            detailMode="district"
            period={selectedPeriod}
            variable={selectedVariable}
            formatAnomaly={formatAnomaly}
            periodDetail={periodDetail}
          />
          <StatPanel
            title={`${districtName}: ${selectedVariable.negativeLabel.toLowerCase()} ${selectedPeriodLabel}`}
            row={districtCoolest}
            detailMode="district"
            period={selectedPeriod}
            variable={selectedVariable}
            formatAnomaly={formatAnomaly}
            periodDetail={periodDetail}
          />
          <StatPanel
            title={`NZ ${selectedVariable.positiveLabel.toLowerCase()} ${selectedPeriodLabel} anomaly`}
            row={countryWarmest}
            detailMode="country"
            period={selectedPeriod}
            variable={selectedVariable}
            formatAnomaly={formatAnomaly}
            periodDetail={periodDetail}
          />
          <StatPanel
            title={`NZ ${selectedVariable.negativeLabel.toLowerCase()} ${selectedPeriodLabel} anomaly`}
            row={countryCoolest}
            detailMode="country"
            period={selectedPeriod}
            variable={selectedVariable}
            formatAnomaly={formatAnomaly}
            periodDetail={periodDetail}
          />
        </section>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-semibold">{districtName}: {selectedPeriodLabel} {selectedVariable.label.toLowerCase()} anomalies</h2>
                <p className="text-sm text-slate-500">
                  Bars show the selected area anomaly. Optionally add a second area for comparison as a grey line.
                </p>
              </div>
            </div>

            <AnomalyChart
              chartData={chartData}
              districtName={districtName}
              comparisonName={comparisonArea?.name ?? ""}
              selectedPeriodLabel={selectedPeriodLabel}
              selectedVariable={selectedVariable}
              getAnomalyBarColor={getAnomalyBarColor}
              formatAnomaly={formatAnomaly}
              districts={districts}
              comparisonKey={comparisonKey}
              setComparisonKey={setComparisonKey}
              primaryKey={selectedDistrict?.key ?? ""}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                {districtName}: 1991–2020 monthly climatology
              </h2>
        
              <p className="text-sm text-slate-500">
                Bars show monthly mean temperature. The line shows monthly precipitation
                on the right-hand axis.
              </p>
            </div>
        
            <ClimatologyChart data={climatologyData} />
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-semibold">{districtName}: monthly {selectedVariable.label.toLowerCase()} anomaly matrix</h2>
                <p className="text-sm text-slate-500">
                  Rows are months and columns are years. Hover over a cell to see the month, year, value, and anomaly.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{selectedVariable.negativeLabel}</span>
                <div
                  className="h-3 w-20 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${selectedVariable.negativeColor}, #f8fafc, ${selectedVariable.positiveColor})`
                  }}
                />
                <span>{selectedVariable.positiveLabel}</span>
              </div>
            </div>
            
            <HeatmapMatrix
              MONTHS={MONTHS}
              heatmapRows={heatmapRows}
              heatmapYears={heatmapYears}
              heatmapMaxAbs={heatmapMaxAbs}
              selectedVariable={selectedVariable}
              findMatrixCell={findMatrixCell}
              getHeatmapColor={getHeatmapColor}
              formatAnomaly={formatAnomaly}
              formatValue={formatValue}
            />
            

          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 text-sm text-slate-600 space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Implementation notes</h2>
            <p>
              All data sourced from{" "}
              <a
                href="https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                ERA5-Land
              </a>,
              {" "}
              the fifth-generation European Centre for Medium-Range Weather
              Forecasts (ECMWF) atmospheric reanalysis of global climatic land variables
              covering the period from January 1950 to present.
            </p>
            <p>
              DJF is assigned to the year of January and February, so December 2023 plus January 2024 and February 2024 are labelled DJF 2024.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
