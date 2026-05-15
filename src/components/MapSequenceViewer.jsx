import React, { useMemo, useState, useEffect } from "react";


const START_YEAR = 1950;
const START_MONTH = 1;

const END_YEAR = 2026;
const END_MONTH = 3; // latest available month, e.g. March 2026

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const shortMonths = monthNames.map((m) => m.slice(0, 3));

const MAP_VARIABLES = {
  temp: {
    label: "Temperature",
    prefix: "temp_anom",
    title: "Temperature anomaly"
  },
  precip: {
    label: "Precipitation",
    prefix: "precip_anom",
    title: "Precipitation anomaly"
  }
};

const totalFrames =
  (END_YEAR - START_YEAR) * 12 + (END_MONTH - START_MONTH) + 1;

const maxIndex = totalFrames - 1;

function Button({ children, onClick, variant = "default", size = "default", title = "" }) {
  const base =
    "rounded-xl px-3 py-2 text-sm font-medium transition border shadow-sm";

  const styles =
    variant === "outline"
      ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
      : "bg-slate-900 border-slate-900 text-white hover:bg-slate-700";

  const sizeStyles =
    size === "icon"
      ? "w-10 h-10 px-0 flex items-center justify-center"
      : "";

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${base} ${styles} ${sizeStyles}`}
    >
      {children}
    </button>
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function indexToDate(index) {
  const safeIndex = clamp(index, 0, maxIndex);
  const absoluteMonth = START_MONTH - 1 + safeIndex;

  const year = START_YEAR + Math.floor(absoluteMonth / 12);
  const month = (absoluteMonth % 12) + 1;

  return { year, month };
}

function dateToIndex(year, month) {
  const index = (year - START_YEAR) * 12 + (month - START_MONTH);
  return clamp(index, 0, maxIndex);
}

function realImagePath(year, month, variable) {
  return `${import.meta.env.BASE_URL}maps/${variable.prefix}_${year}_${String(month).padStart(2, "0")}.webp`;
}

export default function MapSequenceViewer() {
  const [index, setIndex] = useState(dateToIndex(END_YEAR, END_MONTH));
  const [mapVariable, setMapVariable] = useState("temp");
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(650);

  const selectedMapVariable = MAP_VARIABLES[mapVariable];
  const { year, month } = indexToDate(index);

  const years = useMemo(
    () => Array.from(
      { length: END_YEAR - START_YEAR + 1 },
      (_, i) => START_YEAR + i
    ),
    []
  );

  const frame = useMemo(() => ({
    label: `${selectedMapVariable.title}: ${monthNames[month - 1]} ${year}`,
    src: realImagePath(year, month, selectedMapVariable)
  }), [year, month, selectedMapVariable]);

  useEffect(() => {
    if (!playing) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, playSpeed);

    return () => window.clearInterval(id);
  }, [playing, playSpeed]);

  useEffect(() => {
    const offsets = [-2, -1, 1, 2, 3];

    offsets.forEach((offset) => {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex > maxIndex) return;

      const d = indexToDate(nextIndex);
      const img = new Image();
      img.src = realImagePath(d.year, d.month, selectedMapVariable);
    });
  }, [index, selectedMapVariable]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "ArrowLeft") {
        setIndex((i) => clamp(i - (e.shiftKey ? 12 : 1), 0, maxIndex));
      }

      if (e.key === "ArrowRight") {
        setIndex((i) => clamp(i + (e.shiftKey ? 12 : 1), 0, maxIndex));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const progressPct = Math.round((index / maxIndex) * 100);

  return (
    <div className="space-y-4">
  
      {/* header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Monthly anomaly map viewer
          </h2>
          <p className="text-slate-600">
            Browse monthly anomaly maps ({START_YEAR}–{END_YEAR})
          </p>
        </div>
  
        <div className="rounded-2xl bg-white px-5 py-3 text-lg font-semibold text-slate-900 shadow-sm">
          {frame.label}
        </div>
      </div>
  
      {/* top dropdown controls */}
      <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Variable
            <select
              value={mapVariable}
              onChange={(e) => setMapVariable(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            >
              {Object.entries(MAP_VARIABLES).map(([key, variable]) => (
                <option key={key} value={key}>
                  {variable.label}
                </option>
              ))}
            </select>
          </label>
  
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Year
            <select
              value={year}
              onChange={(e) =>
                setIndex(dateToIndex(Number(e.target.value), month))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
  
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Month
            <select
              value={month}
              onChange={(e) =>
                setIndex(dateToIndex(year, Number(e.target.value)))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            >
              {monthNames.map((m, i) => {
                const monthValue = i + 1;
                const isUnavailable =
                  year === END_YEAR && monthValue > END_MONTH;
              
                return (
                  <option
                    key={m}
                    value={monthValue}
                    disabled={isUnavailable}
                  >
                    {m}
                  </option>
                );
              })}
            </select>
          </label>
  
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Animation speed
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            >
              <option value={1000}>Slow</option>
              <option value={650}>Medium</option>
              <option value={300}>Fast</option>
            </select>
          </label>
        </div>
      </div>
  
      {/* image */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-white">
        <img
          src={frame.src}
          alt={frame.label}
          className="w-full h-auto select-none"
          draggable="false"
        />
      </div>
  
      {/* bottom controls */}
      <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-5 space-y-3">
  
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex(0)}
            title="First frame"
          >
            ⏮
          </Button>
      
          <Button
            variant="outline"
            onClick={() => setIndex((i) => clamp(i - 12, 0, maxIndex))}
            title="Previous year"
          >
            « Year
          </Button>
      
          <Button
            variant="outline"
            onClick={() => setIndex((i) => clamp(i - 1, 0, maxIndex))}
            title="Previous month"
          >
            − Month
          </Button>
      
          <Button
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "Pause animation" : "Play animation"}
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </Button>
      
          <Button
            variant="outline"
            onClick={() => setIndex((i) => clamp(i + 1, 0, maxIndex))}
            title="Next month"
          >
            + Month
          </Button>
      
          <Button
            variant="outline"
            onClick={() => setIndex((i) => clamp(i + 12, 0, maxIndex))}
            title="Next year"
          >
            Year »
          </Button>
      
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex(maxIndex)}
            title="Last frame"
          >
            ⏭
          </Button>
      
          <div className="ml-auto rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Frame {index + 1} of {totalFrames} · {progressPct}%
          </div>
        </div>
      
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="w-full accent-slate-900"
          />
      
          <div className="flex justify-between text-xs text-slate-500">
            <span>{START_YEAR}</span>
            <span>{Math.round((START_YEAR + END_YEAR) / 2)}</span>
            <span>{END_YEAR}</span>
          </div>
        </div>
      
        <div className="flex justify-between text-xs text-slate-500">
          <span>← / → = month</span>
          <span>Shift + ← / → = year</span>
        </div>
      
      </div>
    </div>
    );
}
