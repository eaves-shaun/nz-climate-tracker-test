import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const START_YEAR = 1950;
const END_YEAR = 2026;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const shortMonths = monthNames.map((m) => m.slice(0, 3));

const MAP_VARIABLES = {
  precip: {
    label: "Precipitation",
    prefix: "precip_anom",
    title: "Precipitation anomaly"
  },
  temp: {
    label: "Temperature",
    prefix: "temp_anom",
    title: "Temperature anomaly"
  }
};

const totalFrames = (END_YEAR - START_YEAR + 1) * 12;
const maxIndex = totalFrames - 1;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function indexToDate(index) {
  const safeIndex = clamp(index, 0, maxIndex);
  const year = START_YEAR + Math.floor(safeIndex / 12);
  const month = (safeIndex % 12) + 1;
  return { year, month };
}

function dateToIndex(year, month) {
  return clamp((year - START_YEAR) * 12 + (month - 1), 0, maxIndex);
}

function realImagePath(year, month, variable) {
  return `${import.meta.env.BASE_URL}maps/${variable.prefix}_${year}_${String(month).padStart(2, "0")}.webp`;
}

export default function MapSequenceViewer() {
  const [index, setIndex] = useState(dateToIndex(1951, 1));
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(650);
  const [mapVariable, setMapVariable] = useState("precip");

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

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-white">
        <img
          src={frame.src}
          alt={frame.label}
          className="w-full h-auto select-none"
          draggable="false"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-5 space-y-5">
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
              {monthNames.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
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

        <div className="grid grid-cols-12 gap-1 text-center text-xs">
          {shortMonths.map((m, i) => (
            <button
              key={m}
              onClick={() => setIndex(dateToIndex(year, i + 1))}
              className={`rounded-lg px-1 py-2 transition ${
                month === i + 1
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Keyboard: ← / → = month, Shift + ← / → = year
        </div>
      </div>
    </div>
  );
}
