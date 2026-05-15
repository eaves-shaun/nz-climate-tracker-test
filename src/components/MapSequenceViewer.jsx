import React, { useMemo, useState, useEffect } from "react";

const START_YEAR = 1950;
const START_MONTH = 1;

const END_YEAR = 2026;
const END_MONTH = 3; // latest available month, e.g. March 2026

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MAP_VARIABLES = {
  temp: {
    value: "temp",
    label: "Temperature",
    prefix: "temp_anom",
    title: "Temperature anomaly"
  },
  precip: {
    value: "precip",
    label: "Precipitation",
    prefix: "precip_anom",
    title: "Precipitation anomaly"
  }
};

const totalFrames =
  (END_YEAR - START_YEAR) * 12 + (END_MONTH - START_MONTH) + 1;

const maxIndex = totalFrames - 1;

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

function ControlButton({ children, onClick, title = "", variant = "outline" }) {
  const styles =
    variant === "primary"
      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition ${styles}`}
    >
      {children}
    </button>
  );
}

export default function MapSequenceViewer() {
  const [index, setIndex] = useState(dateToIndex(END_YEAR, END_MONTH));
  const [mapVariable, setMapVariable] = useState("temp");
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(650);

  const selectedMapVariable = MAP_VARIABLES[mapVariable];
  const { year, month } = indexToDate(index);

  const years = useMemo(
    () =>
      Array.from(
        { length: END_YEAR - START_YEAR + 1 },
        (_, i) => START_YEAR + i
      ),
    []
  );

  const frame = useMemo(
    () => ({
      label: `${selectedMapVariable.title}: ${monthNames[month - 1]} ${year}`,
      src: realImagePath(year, month, selectedMapVariable)
    }),
    [year, month, selectedMapVariable]
  );

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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Monthly anomaly map viewer
          </h2>
          <p className="text-slate-600">
            Browse monthly anomaly maps ({START_YEAR}–{END_YEAR})
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          {frame.label}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Variable
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
              value={mapVariable}
              onChange={(event) => setMapVariable(event.target.value)}
            >
              {Object.values(MAP_VARIABLES).map((variable) => (
                <option key={variable.value} value={variable.value}>
                  {variable.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Year
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
              value={year}
              onChange={(event) =>
                setIndex(dateToIndex(Number(event.target.value), month))
              }
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Month
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
              value={month}
              onChange={(event) =>
                setIndex(dateToIndex(year, Number(event.target.value)))
              }
            >
              {monthNames.map((m, i) => {
                const monthValue = i + 1;
                const unavailable =
                  year === END_YEAR && monthValue > END_MONTH;

                return (
                  <option
                    key={m}
                    value={monthValue}
                    disabled={unavailable}
                  >
                    {m}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <img
          src={frame.src}
          alt={frame.label}
          className="h-auto w-full select-none"
          draggable="false"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <ControlButton
            onClick={() => setIndex(0)}
            title="First frame"
          >
            ⏮ First
          </ControlButton>

          <ControlButton
            onClick={() => setIndex((i) => clamp(i - 12, 0, maxIndex))}
            title="Previous year"
          >
            « Year
          </ControlButton>

          <ControlButton
            onClick={() => setIndex((i) => clamp(i - 1, 0, maxIndex))}
            title="Previous month"
          >
            − Month
          </ControlButton>

          <ControlButton
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "Pause animation" : "Play animation"}
            variant="primary"
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </ControlButton>

          <ControlButton
            onClick={() => setIndex((i) => clamp(i + 1, 0, maxIndex))}
            title="Next month"
          >
            + Month
          </ControlButton>

          <ControlButton
            onClick={() => setIndex((i) => clamp(i + 12, 0, maxIndex))}
            title="Next year"
          >
            Year »
          </ControlButton>

          <ControlButton
            onClick={() => setIndex(maxIndex)}
            title="Last frame"
          >
            Last ⏭
          </ControlButton>

          <div className="ml-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
            Frame {index + 1} of {totalFrames} · {progressPct}%
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            className="w-full accent-slate-900"
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>{START_YEAR}</span>
            <span>{Math.round((START_YEAR + END_YEAR) / 2)}</span>
            <span>
              {END_YEAR}
              {END_MONTH < 12 ? ` (${monthNames[END_MONTH - 1]})` : ""}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="block w-full max-w-xs">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Animation speed
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-slate-400"
              value={playSpeed}
              onChange={(event) => setPlaySpeed(Number(event.target.value))}
            >
              <option value={1000}>Slow</option>
              <option value={650}>Medium</option>
              <option value={300}>Fast</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span>← / → = month</span>
            <span>Shift + ← / → = year</span>
          </div>
        </div>
      </div>
    </div>
  );
}
