import React, { useEffect, useMemo, useState } from "react";
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

function Card({ children, className = "" }) {
  return <div className={`bg-white ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

// CSV must be placed at public/data/nz_district_era5land_monthly_temps.csv
// Vite rewrites import.meta.env.BASE_URL for GitHub Pages builds.
const CSV_URL = `${import.meta.env.BASE_URL}data/nz_district_era5land_monthly_temps.csv`;

const sampleData = [
  { district_id: "001", district_name: "Wellington City", date: "1950-01", year: 1950, month: 1, temp_c: 15.1, anomaly_c: -0.4 },
  { district_id: "001", district_name: "Wellington City", date: "1950-02", year: 1950, month: 2, temp_c: 15.7, anomaly_c: -0.2 },
  { district_id: "001", district_name: "Wellington City", date: "1951-01", year: 1951, month: 1, temp_c: 16.4, anomaly_c: 0.9 },
  { district_id: "001", district_name: "Wellington City", date: "1951-02", year: 1951, month: 2, temp_c: 14.9, anomaly_c: -1.0 },
  { district_id: "001", district_name: "Wellington City", date: "2024-01", year: 2024, month: 1, temp_c: 17.4, anomaly_c: 1.7 },
  { district_id: "001", district_name: "Wellington City", date: "2024-02", year: 2024, month: 2, temp_c: 18.1, anomaly_c: 1.3 },
  { district_id: "002", district_name: "Auckland", date: "1950-01", year: 1950, month: 1, temp_c: 18.4, anomaly_c: -0.2 },
  { district_id: "002", district_name: "Auckland", date: "1950-02", year: 1950, month: 2, temp_c: 19.0, anomaly_c: 0.1 },
  { district_id: "002", district_name: "Auckland", date: "1951-01", year: 1951, month: 1, temp_c: 17.2, anomaly_c: -1.4 },
  { district_id: "002", district_name: "Auckland", date: "1951-02", year: 1951, month: 2, temp_c: 20.2, anomaly_c: 1.2 },
  { district_id: "002", district_name: "Auckland", date: "2024-01", year: 2024, month: 1, temp_c: 20.4, anomaly_c: 1.8 },
  { district_id: "002", district_name: "Auckland", date: "2024-02", year: 2024, month: 2, temp_c: 20.9, anomaly_c: 1.6 }
];

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
  ...MONTHS.map((month) => ({ value: String(month.value), label: month.label, type: "month", month: month.value }))
];

function cleanText(value) { return String(value ?? "").trim(); }
function toNumber(value) { const parsed = typeof value === "number" ? value : Number(cleanText(value)); return Number.isFinite(parsed) ? parsed : null; }
function mean(values) { const valid = values.map(toNumber).filter((value) => value !== null); return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null; }

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') { current += '"'; i += 1; }
    else if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) { out.push(current); current = ""; }
    else current += char;
  }
  out.push(current);
  return out;
}

function normaliseRows(rows) {
  return rows.map((row) => {
    const districtName = cleanText(row.district_name);
    return {
      district_id: cleanText(row.district_id),
      district_name: districtName,
      district_key: districtName,
      date: cleanText(row.date),
      year: toNumber(row.year),
      month: toNumber(row.month),
      temp_c: toNumber(row.temp_c),
      anomaly_c: toNumber(row.anomaly_c ?? row.anomalies)
    };
  }).filter((row) => row.district_name && row.district_key && row.date && Number.isFinite(row.year) && Number.isFinite(row.month) && row.temp_c !== null && row.anomaly_c !== null);
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

function getDistricts(rows) {
  const byName = new Map();
  rows.forEach((row) => {
    if (!byName.has(row.district_key)) byName.set(row.district_key, { key: row.district_key, name: row.district_name, id: row.district_id });
  });
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getExtremum(rows, mode) {
  if (!rows.length) return null;
  return rows.reduce((best, row) => {
    if (!best) return row;
    return mode === "max" ? (row.anomaly_c > best.anomaly_c ? row : best) : (row.anomaly_c < best.anomaly_c ? row : best);
  }, null);
}

function getPeriodConfig(periodValue) { return PERIODS.find((period) => period.value === periodValue) ?? PERIODS[0]; }
function getSeasonYear(row, season) { return season === "DJF" && row.month === 12 ? row.year + 1 : row.year; }
function getSeasonRows(rows, season) { const config = getPeriodConfig(season); return !config || config.type !== "season" ? [] : rows.filter((row) => config.months.includes(row.month)); }

function aggregateRows(rows, getGroupKey) {
  const grouped = new Map();
  rows.forEach((row) => {
    const groupKey = getGroupKey(row);
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey).push(row);
  });
  return Array.from(grouped.entries()).map(([groupKey, groupRows]) => {
    const first = groupRows[0];
    const parts = String(groupKey).split("__");
    const year = toNumber(parts[parts.length - 1]);
    return { district_id: first.district_id, district_name: first.district_name, district_key: first.district_key, year, month: null, temp_c: mean(groupRows.map((row) => row.temp_c)), anomaly_c: mean(groupRows.map((row) => row.anomaly_c)) };
  }).filter((row) => row.year !== null && row.temp_c !== null && row.anomaly_c !== null);
}

function getPeriodRows(rows, period) {
  if (!period) return [];
  if (period.type === "annual") return aggregateRows(rows, (row) => `${row.district_key}__${row.year}`);
  if (period.type === "season") return aggregateRows(getSeasonRows(rows, period.value), (row) => `${row.district_key}__${getSeasonYear(row, period.value)}`);
  return rows.filter((row) => row.month === period.month);
}

function getAnnualDistrictAnomalies(rows, districtKey) {
  return getPeriodRows(rows, getPeriodConfig("annual")).filter((row) => row.district_key === districtKey).sort((a, b) => a.year - b.year).map((row) => ({ year: row.year, annual_anomaly_c: row.anomaly_c }));
}

function getDistrictPeriodAnomalies(rows, districtKey, period) {
  return getPeriodRows(rows, period).filter((row) => row.district_key === districtKey).sort((a, b) => a.year - b.year).map((row) => ({ year: row.year, period_anomaly_c: row.anomaly_c, month_anomaly_c: row.anomaly_c, temp_c: row.temp_c }));
}

function getMonthDistrictAnomalies(rows, districtKey, month) { return getDistrictPeriodAnomalies(rows, districtKey, getPeriodConfig(String(month))); }

function getNationalPeriodMeanAnomalies(rows, period) {
  const periodRows = getPeriodRows(rows, period);
  const grouped = new Map();
  periodRows.forEach((row) => { if (!grouped.has(row.year)) grouped.set(row.year, []); grouped.get(row.year).push(row.anomaly_c); });
  return Array.from(grouped.entries()).sort(([a], [b]) => a - b).map(([year, values]) => ({ year, national_period_anomaly_c: mean(values) }));
}

function getNationalMonthMeanAnomalies(rows, month) { return getNationalPeriodMeanAnomalies(rows, getPeriodConfig(String(month))); }

function mergeChartSeries(annualRows, periodRows, nationalPeriodRows) {
  const byYear = new Map();
  annualRows.forEach((row) => { byYear.set(row.year, { year: row.year, annual_anomaly_c: row.annual_anomaly_c }); });
  periodRows.forEach((row) => {
    const existing = byYear.get(row.year) ?? { year: row.year };
    byYear.set(row.year, { ...existing, period_anomaly_c: row.period_anomaly_c, month_anomaly_c: row.period_anomaly_c, temp_c: row.temp_c });
  });
  nationalPeriodRows.forEach((row) => {
    const existing = byYear.get(row.year) ?? { year: row.year };
    byYear.set(row.year, { ...existing, national_period_anomaly_c: row.national_period_anomaly_c });
  });
  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

function mergeAnnualAndMonthly(annualRows, monthRows) { return mergeChartSeries(annualRows, monthRows, []); }
function getAnomalyBarColor(value) { if (!Number.isFinite(value)) return "#94a3b8"; return value >= 0 ? "#dc2626" : "#2563eb"; }

function getHeatmapColor(value, maxAbs) {
  if (!Number.isFinite(value)) return "#e5e7eb";
  if (!Number.isFinite(maxAbs) || maxAbs === 0) return "#f8fafc";
  const intensity = Math.min(Math.abs(value) / maxAbs, 1);
  const lightness = 96 - intensity * 42;
  return value >= 0 ? `hsl(0 72% ${lightness}%)` : `hsl(217 78% ${lightness}%)`;
}

function getDistrictMonthlyMatrix(rows, districtKey) {
  return rows.filter((row) => row.district_key === districtKey).sort((a, b) => a.year - b.year || a.month - b.month).map((row) => ({ year: row.year, month: row.month, month_label: MONTHS.find((m) => m.value === row.month)?.label ?? `Month ${row.month}`, anomaly_c: row.anomaly_c, temp_c: row.temp_c, date: row.date }));
}

function getMatrixYears(matrixRows) { return Array.from(new Set(matrixRows.map((row) => row.year))).sort((a, b) => a - b); }
function findMatrixCell(matrixRows, year, month) { return matrixRows.find((row) => row.year === year && row.month === month) ?? null; }
function formatAnomaly(value) { if (!Number.isFinite(value)) return "—"; return `${value > 0 ? "+" : ""}${value.toFixed(2)} °C`; }
function formatTemp(value) { if (!Number.isFinite(value)) return "—"; return `${value.toFixed(2)} °C`; }
function periodLabel(period) { return period?.label ?? "Selected period"; }
function periodDetail(row, period) { if (!row) return "—"; return `${formatTemp(row.temp_c)} for ${periodLabel(period)}`; }

function runSelfTests() {
  console.assert(mean([1, 2, 3]) === 2, "mean should average numeric values");
  console.assert(mean([]) === null, "mean should return null for empty arrays");
  console.assert(mean([1, NaN, 3]) === 2, "mean should ignore non-finite values");
  const parsed = parseTemperatureCsv("district_id,district_name,date,year,month,temp_c,anomalies\n1,Test,2000-01,2000,1,12.5,-0.2");
  console.assert(parsed.length === 1, "CSV parser should parse one row");
  console.assert(parsed[0].anomaly_c === -0.2, "CSV parser should map anomalies to anomaly_c");
  const parsedMissingIds = parseTemperatureCsv("district_id,district_name,date,year,month,temp_c,anomalies\n,Test District,2000-01,2000,1,12.5,-0.2\n,Test District,2001-01,2001,1,13.5,0.8");
  console.assert(parsedMissingIds.length === 2, "CSV parser should keep rows with missing district_id when district_name exists");
  console.assert(getDistricts(parsedMissingIds).length === 1, "district list should group rows by district_name when district_id is missing");
  console.assert(getMonthDistrictAnomalies(parsedMissingIds, "Test District", 1).length === 2, "monthly series should work using district_name key");
  const normalised = normaliseRows([{ district_id: "", district_name: "A", date: "2000-01", year: "2000", month: "1", temp_c: "10", anomalies: "0.5" }]);
  console.assert(normalised.length === 1 && normalised[0].district_key === "A", "normaliseRows should support missing district_id and numeric strings");
  console.assert(getDistricts(normaliseRows(sampleData)).length === 2, "sampleData should contain two districts");
  console.assert(getExtremum(normaliseRows(sampleData), "max").anomaly_c === 1.8, "max extremum should find warmest anomaly");
  console.assert(getExtremum(normaliseRows(sampleData), "min").anomaly_c === -1.4, "min extremum should find coolest anomaly");
  console.assert(getMonthDistrictAnomalies(normaliseRows(sampleData), "Wellington City", 1).length === 3, "monthly series should filter by district name key and month");
  console.assert(getAnnualDistrictAnomalies(normaliseRows(sampleData), "Wellington City").length === 3, "annual series should return one row per year");
  console.assert(getNationalMonthMeanAnomalies(normaliseRows(sampleData), 1).length === 3, "national monthly anomaly series should return one row per year");
  console.assert(getPeriodConfig("annual").type === "annual", "period config should support annual means");
  console.assert(getPeriodConfig("DJF").type === "season", "period config should support seasons");
  console.assert(getPeriodConfig("1").type === "month", "period config should support months");
  console.assert(getPeriodRows(normaliseRows(sampleData), getPeriodConfig("annual")).length === 6, "annual period rows should aggregate by district and year");
  console.assert(getPeriodRows(normaliseRows(sampleData), getPeriodConfig("DJF")).length === 6, "seasonal period rows should aggregate by district and season-year");
  console.assert(mergeAnnualAndMonthly([{ year: 2000, annual_anomaly_c: 0.1 }], [{ year: 2000, period_anomaly_c: 0.2 }])[0].month_anomaly_c === 0.2, "merged chart rows should combine annual and monthly values");
  console.assert(formatAnomaly(1.234) === "+1.23 °C", "positive anomalies should show plus sign");
  console.assert(periodLabel(getPeriodConfig("annual")) === "Annual mean", "period label should return annual mean label");
  console.assert(periodLabel(getPeriodConfig("DJF")) === "DJF", "period label should return seasonal label");
  console.assert(periodLabel(getPeriodConfig("1")) === "January", "period label should return monthly label");
  console.assert(getAnomalyBarColor(0.1) === "#dc2626", "positive bars should be red");
  console.assert(getAnomalyBarColor(-0.1) === "#2563eb", "negative bars should be blue");
  console.assert(getAnomalyBarColor(null) === "#94a3b8", "missing bars should be grey");
  console.assert(getHeatmapColor(null, 2) === "#e5e7eb", "missing heatmap cells should be grey");
  console.assert(getDistrictMonthlyMatrix(normaliseRows(sampleData), "Wellington City").length === 6, "monthly matrix should include all rows for selected district");
  console.assert(getMatrixYears(getDistrictMonthlyMatrix(normaliseRows(sampleData), "Wellington City")).length === 3, "matrix years should return unique years");
  console.assert(findMatrixCell(getDistrictMonthlyMatrix(normaliseRows(sampleData), "Wellington City"), 1950, 1).anomaly_c === -0.4, "matrix cell lookup should find year-month anomaly");
}

runSelfTests();

function StatPanel({ title, row, detailMode, period }) {
  const bg = row ? (row.anomaly_c >= 0 ? "bg-red-50" : "bg-blue-50") : "bg-white";
  const border = row ? (row.anomaly_c >= 0 ? "border-red-300" : "border-blue-300") : "border-slate-200";
  return (
    <Card className={`rounded-2xl shadow-sm border ${border} ${bg}`}>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {row ? (
          <div className="mt-3 space-y-1">
            <div className="text-3xl font-semibold tracking-tight">{row.year}</div>
            <div className="text-lg font-medium">{formatAnomaly(row.anomaly_c)}</div>
            <div className="text-sm text-slate-500">{detailMode === "district" ? periodDetail(row, period) : `${row.district_name}, ${periodDetail(row, period)}`}</div>
          </div>
        ) : <div className="mt-3 text-3xl font-semibold">—</div>}
      </CardContent>
    </Card>
  );
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-sm">
      <div className="font-semibold mb-2">{label}</div>
      {payload.map((entry) => <div key={entry.dataKey} className="flex justify-between gap-4"><span>{entry.name}</span><span className="font-medium">{formatAnomaly(entry.value)}</span></div>)}
    </div>
  );
}

export default function App() {
  const initialRows = useMemo(() => normaliseRows(sampleData), []);
  const [rows, setRows] = useState(initialRows);
  const [dataStatus, setDataStatus] = useState(`Loading data from ${CSV_URL}...`);
  const districts = useMemo(() => getDistricts(rows), [rows]);
  const [districtKey, setDistrictKey] = useState(initialRows[0]?.district_key ?? "");
  const [periodValue, setPeriodValue] = useState("1");

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
          setDistrictKey((current) => parsed.some((row) => row.district_key === current) ? current : parsed[0]?.district_key ?? "");
          setDataStatus(`Loaded ${parsed.length.toLocaleString()} rows from ${CSV_URL}.`);
        }
      })
      .catch((error) => { if (!cancelled) setDataStatus(`${error.message} Falling back to sample data for preview.`); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (districts.length && !districts.some((district) => district.key === districtKey)) setDistrictKey(districts[0].key); }, [districts, districtKey]);

  const selectedDistrict = districts.find((district) => district.key === districtKey) ?? districts[0];
  const selectedPeriod = useMemo(() => getPeriodConfig(periodValue), [periodValue]);
  const periodRows = useMemo(() => getPeriodRows(rows, selectedPeriod), [rows, selectedPeriod]);
  const districtPeriodRows = useMemo(() => periodRows.filter((row) => row.district_key === selectedDistrict?.key), [periodRows, selectedDistrict]);
  const countryPeriodRows = periodRows;

  const districtWarmest = useMemo(() => getExtremum(districtPeriodRows, "max"), [districtPeriodRows]);
  const districtCoolest = useMemo(() => getExtremum(districtPeriodRows, "min"), [districtPeriodRows]);
  const countryWarmest = useMemo(() => getExtremum(countryPeriodRows, "max"), [countryPeriodRows]);
  const countryCoolest = useMemo(() => getExtremum(countryPeriodRows, "min"), [countryPeriodRows]);

  const chartData = useMemo(() => {
    if (!selectedDistrict) return [];
    return mergeChartSeries(getAnnualDistrictAnomalies(rows, selectedDistrict.key), getDistrictPeriodAnomalies(rows, selectedDistrict.key, selectedPeriod), getNationalPeriodMeanAnomalies(rows, selectedPeriod));
  }, [rows, selectedDistrict, selectedPeriod]);

  const heatmapRows = useMemo(() => selectedDistrict ? getDistrictMonthlyMatrix(rows, selectedDistrict.key) : [], [rows, selectedDistrict]);
  const heatmapYears = useMemo(() => getMatrixYears(heatmapRows), [heatmapRows]);
  const heatmapMaxAbs = useMemo(() => { const values = heatmapRows.map((row) => Math.abs(row.anomaly_c)).filter(Number.isFinite); return values.length ? Math.max(...values) : 0; }, [heatmapRows]);

  const selectedPeriodLabel = periodLabel(selectedPeriod);
  const districtName = selectedDistrict?.name ?? "District";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">ERA5-Land / New Zealand districts</p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">New Zealand Climate Tracker</h1>
            <p className="mt-3 max-w-3xl text-slate-600">Choose a district and period to identify local anomaly extremes, national anomaly extremes, and compare the selected period with the national mean.</p>
            <p className="mt-2 text-xs text-slate-500">{dataStatus}</p>
            <p className="mt-1 text-xs text-slate-500">Loaded districts: {districts.length.toLocaleString()} | Rows for selected district/period: {districtPeriodRows.length.toLocaleString()} | Rows for selected period nationally: {countryPeriodRows.length.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-[32rem]">
            <label className="block"><span className="block text-sm font-medium text-slate-600 mb-2">District</span><select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400" value={selectedDistrict?.key ?? ""} onChange={(event) => setDistrictKey(event.target.value)}>{districts.map((district) => <option key={district.key} value={district.key}>{district.name}</option>)}</select></label>
            <label className="block"><span className="block text-sm font-medium text-slate-600 mb-2">Period</span><select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400" value={periodValue} onChange={(event) => setPeriodValue(event.target.value)}>{PERIODS.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}</select></label>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatPanel title={`${districtName}: warmest ${selectedPeriodLabel}`} row={districtWarmest} detailMode="district" period={selectedPeriod} />
          <StatPanel title={`${districtName}: coolest ${selectedPeriodLabel}`} row={districtCoolest} detailMode="district" period={selectedPeriod} />
          <StatPanel title={`NZ warmest ${selectedPeriodLabel} anomaly`} row={countryWarmest} detailMode="country" period={selectedPeriod} />
          <StatPanel title={`NZ coolest ${selectedPeriodLabel} anomaly`} row={countryCoolest} detailMode="country" period={selectedPeriod} />
        </section>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-4"><div><h2 className="text-xl font-semibold">{districtName}: {selectedPeriodLabel} anomalies</h2><p className="text-sm text-slate-500">Bars show the selected district's period anomaly: red for positive anomalies and blue for negative anomalies. The grey line is the nationwide mean anomaly for the selected period.</p></div></div>
            <div className="h-[32rem]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 8, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" minTickGap={24} />
                  <YAxis unit="°C" />
                  <Tooltip content={<DashboardTooltip />} />
                  <Legend content={() => <div className="flex items-center justify-center gap-6 text-sm w-full"><div className="flex items-center gap-2"><div className="flex"><div className="w-3 h-3 bg-red-500" /><div className="w-3 h-3 bg-blue-500" /></div><span>{`${districtName} ${selectedPeriodLabel} anomaly`}</span></div><div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-gray-500" /><span>{`Nationwide ${selectedPeriodLabel} mean anomaly`}</span></div></div>} />
                  <ReferenceLine y={0} strokeDasharray="4 4" />
                  <Bar legendType="none" name={`${districtName} ${selectedPeriodLabel} anomaly`} dataKey="period_anomaly_c">{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getAnomalyBarColor(entry.period_anomaly_c)} />)}</Bar>
                  <Line type="linear" name={`Nationwide ${selectedPeriodLabel} mean anomaly`} dataKey="national_period_anomaly_c" dot={{ r: 2, fill: "#6b7280" }} strokeWidth={2} stroke="#6b7280" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5"><div><h2 className="text-xl font-semibold">{districtName}: monthly anomaly matrix</h2><p className="text-sm text-slate-500">Rows are months and columns are years. Hover over a cell to see the month, year, temperature, and anomaly.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><span>Cooler</span><div className="h-3 w-20 rounded-full bg-gradient-to-r from-blue-600 via-slate-100 to-red-600" /><span>Warmer</span></div></div>
            <div className="overflow-x-auto pb-2">
              <div className="grid gap-px text-xs" style={{ gridTemplateColumns: `4.5rem repeat(${heatmapYears.length}, minmax(1.45rem, 1fr))`, minWidth: `${Math.max(860, heatmapYears.length * 24 + 90)}px` }}>
                <div className="sticky left-0 z-10 bg-white" />
                {heatmapYears.map((year) => <div key={`year-${year}`} className="h-8 flex items-center justify-center text-[0.65rem] text-slate-500 -rotate-45 origin-center">{year}</div>)}
                {MONTHS.map((month) => <React.Fragment key={`month-row-${month.value}`}><div className="sticky left-0 z-10 bg-white pr-2 flex items-center text-slate-600 font-medium">{month.label.slice(0, 3)}</div>{heatmapYears.map((year) => { const cell = findMatrixCell(heatmapRows, year, month.value); const title = cell ? `${month.label} ${year}: anomaly ${formatAnomaly(cell.anomaly_c)}, temperature ${formatTemp(cell.temp_c)}` : `${month.label} ${year}: no data`; return <div key={`${month.value}-${year}`} title={title} aria-label={title} className="h-5 rounded-[2px] border border-white" style={{ backgroundColor: getHeatmapColor(cell?.anomaly_c, heatmapMaxAbs) }} />; })}</React.Fragment>)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm"><CardContent className="p-5 text-sm text-slate-600 space-y-2"><h2 className="text-xl font-semibold text-slate-900">Implementation notes</h2><p>This version uses <code>district_name</code> as the dashboard key because the source CSV can contain blank <code>district_id</code> values.</p><p>DJF is assigned to the year of January and February, so December 2023 plus January 2024 and February 2024 are labelled DJF 2024.</p><p>For public deployment, place the compact CSV at <code>public/data/nz_district_era5land_monthly_temps.csv</code>. The dashboard loads that fixed file automatically at startup.</p></CardContent></Card>
      </div>
    </div>
  );
}
