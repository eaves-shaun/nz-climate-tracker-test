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
  const base = "rounded-xl px-3 py-2 text-sm font-medium transition border shadow-sm";

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

        <div className="rounded-2xl bg-white px-5 py-3 text-lg font-semibold text-slate-900 shadow-sm">
          {frame.label}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm space-y-4">
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          {Object.entries(MAP_VARIABLES).map(([key, variable]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapVariable(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mapVariable === key
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {variable.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-[80px_1fr] md:items-start">
          <div className="pt-1 text-sm font-medium text-slate-500">
            Year
          </div>

          <div className="grid max-w-[32rem] grid-cols-7 gap-1.5 sm:grid-cols-9 md:grid-cols-11">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setIndex(dateToIndex(y, month))}
                className={`h-8 rounded-full text-xs font-medium transition ${
                  y === year
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {String(y).slice(2)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[80px_1fr] md:items-start">
          <div className="pt-1 text-sm font-medium text-slate-500">
            Month
          </div>

          <div className="flex max-w-[32rem] flex-wrap justify-start gap-1.5">
            {monthNames.map((m, i) => {
              const monthValue = i + 1;
              const unavailable = year === END_YEAR && monthValue > END_MONTH;

              return (
                <button
                  key={m}
                  type="button"
                  disabled={unavailable}
                  onClick={() => setIndex(dateToIndex(year, monthValue))}
                  className={`h-8 w-12 rounded-full text-xs font-medium transition ${
                    unavailable
                      ? "cursor-not-allowed text-slate-300"
                      : monthValue === month
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-white">
        <img
          src={frame.src}
          alt={frame.label}
          className="w-full h-auto select-none"
          draggable="false"
        />
      </div>

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

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            Animation speed
          </span>

          <select
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value={1000}>Slow</option>
            <option value={650}>Medium</option>
            <option value={300}>Fast</option>
          </select>
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>← / → = month</span>
          <span>Shift + ← / → = year</span>
        </div>
      </div>
    </div>
  );
}
