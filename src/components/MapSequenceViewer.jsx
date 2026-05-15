import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Long-series prototype: monthly frames from 1950–2026.
// Canvas preview uses generated SVG frames so the demo works here.
// In your real app, set USE_PREVIEW_FRAMES = false and place PNGs in:
// public/maps/precip_anom_1950_01.png ... public/maps/precip_anom_2026_12.png

const START_YEAR = 1950;
const END_YEAR = 2026;
const USE_PREVIEW_FRAMES = false;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const shortMonths = monthNames.map((m) => m.slice(0, 3));
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

function realImagePath(year, month) {
  return `/maps/precip_anom_${year}_${String(month).padStart(2, "0")}.png`;
}

function makePreviewFrame(year, month) {
  const monthName = monthNames[month - 1];

  // Fake but deterministic anomaly value, just to make the prototype visibly change.
  const t = (year - START_YEAR) * 12 + month;
  const anomaly = Math.round(
    85 * Math.sin(t / 7.5) + 42 * Math.cos(t / 19) + 18 * Math.sin(year / 3)
  );
  const wetText = anomaly >= 0 ? `Main anomaly: +${anomaly}%` : `Main anomaly: ${anomaly}%`;
  const wet = anomaly;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1000">
    <rect width="1400" height="1000" fill="white"/>
    <text x="28" y="62" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800">Precipitation Anomaly</text>
    <text x="28" y="125" font-family="Arial, Helvetica, sans-serif" font-size="32">${monthName} ${year}</text>

    <defs>
      <linearGradient id="cb" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#7a4300"/>
        <stop offset="0.5" stop-color="#f7f4e8"/>
        <stop offset="1" stop-color="#005a4a"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.16"/>
      </filter>
    </defs>

    <rect x="45" y="230" width="54" height="600" fill="url(#cb)" stroke="#111" stroke-width="2"/>
    <text x="122" y="245" font-family="Arial" font-size="20">150</text>
    <text x="122" y="545" font-family="Arial" font-size="20">0</text>
    <text x="112" y="830" font-family="Arial" font-size="20">−150</text>
    <text x="180" y="670" font-family="Arial" font-size="24" transform="rotate(-90 180,670)">Precipitation anomaly (%)</text>

    <text x="200" y="500" font-family="Arial" font-size="26">Anomalies are</text>
    <text x="200" y="530" font-family="Arial" font-size="26">relative to the</text>
    <text x="200" y="560" font-family="Arial" font-size="26">1991–2020 average.</text>
    <text x="200" y="620" font-family="Arial" font-size="26">Data source:</text>
    <text x="200" y="650" font-family="Arial" font-size="26">ERA5-Land</text>

    <g transform="translate(570 70) rotate(-18)" filter="url(#shadow)">
      <path d="M470 20 C520 110 530 200 505 290 C490 350 500 415 550 485 C600 560 580 660 515 725 C455 785 420 850 430 930 C370 900 325 835 312 760 C300 690 250 625 210 565 C150 475 130 360 160 250 C188 150 285 70 470 20Z" fill="#e8e1c8" stroke="#888" stroke-width="2"/>
      <path d="M235 520 C280 555 310 600 325 665 C340 735 380 790 422 833" fill="none" stroke="#888" stroke-width="2"/>
      <path d="M395 80 C430 160 435 250 405 320 C380 380 390 450 430 520" fill="none" stroke="#888" stroke-width="2"/>
      <path d="M260 310 C325 350 360 420 380 500" fill="none" stroke="#888" stroke-width="2"/>
      <path d="M410 610 C470 620 515 590 545 530" fill="none" stroke="#888" stroke-width="2"/>

      <circle cx="365" cy="205" r="70" fill="${wet > 0 ? "#8dd0c8" : "#e2bf61"}" opacity="0.9"/>
      <circle cx="285" cy="480" r="95" fill="${wet > 25 ? "#3c9f94" : wet < -25 ? "#c58724" : "#f7f4e8"}" opacity="0.85"/>
      <circle cx="430" cy="705" r="80" fill="${wet > 60 ? "#006b5a" : wet < -60 ? "#8a4c00" : "#bfe2df"}" opacity="0.85"/>
    </g>

    <g transform="translate(940 760)">
      <rect x="0" y="0" width="230" height="92" rx="18" fill="#fff" stroke="#e6e6e6"/>
      <circle cx="48" cy="46" r="30" fill="none" stroke="#2d9cdb" stroke-width="3"/>
      <path d="M42 16 L75 38 L50 76 L29 58 Z" fill="#f05a28"/>
      <path d="M30 64 L55 72 L36 86 L18 80 Z" fill="#0072bc"/>
      <text x="92" y="42" font-family="Arial" font-size="28" font-weight="800" fill="#102a43">NZ</text>
      <text x="92" y="66" font-family="Arial" font-size="17" font-weight="700" fill="#102a43">CLIMATE</text>
      <text x="92" y="86" font-family="Arial" font-size="17" font-weight="700" fill="#102a43">TRACKER</text>
    </g>

    <text x="1050" y="935" font-family="Arial" font-size="18" font-style="italic">Map: NZ Climate Tracker</text>
    <text x="1030" y="170" font-family="Arial" font-size="30" font-weight="700" fill="#334155">Long-series preview</text>
    <text x="1030" y="205" font-family="Arial" font-size="24" fill="#475569">${wetText}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getImageSrc(year, month) {
  return USE_PREVIEW_FRAMES ? makePreviewFrame(year, month) : realImagePath(year, month);
}

export default function DatedPngSliderPrototype() {
  const [index, setIndex] = useState(dateToIndex(1951, 1));
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(650);
  const { year, month } = indexToDate(index);

  const years = useMemo(
    () => Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i),
    []
  );

  const frame = useMemo(() => ({
    label: `${monthNames[month - 1]} ${year}`,
    src: getImageSrc(year, month),
    realPngPath: realImagePath(year, month),
  }), [year, month]);

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, playSpeed);
    return () => window.clearInterval(id);
  }, [playing, playSpeed]);

  // Preload nearby frames. Useful when using real PNGs.
  React.useEffect(() => {
    const offsets = [-2, -1, 1, 2, 3];
    offsets.forEach((offset) => {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex > maxIndex) return;
      const d = indexToDate(nextIndex);
      const img = new Image();
      img.src = getImageSrc(d.year, d.month);
    });
  }, [index]);

  React.useEffect(() => {
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              NZ Climate Tracker Map Viewer
            </h1>
            <p className="text-slate-600">
              Long monthly sequence prototype: {START_YEAR}–{END_YEAR}.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-5 py-3 text-2xl font-bold text-slate-900 shadow-sm">
            {frame.label}
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-lg">
          <CardContent className="p-0">
            <motion.div
              key={frame.src}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              className="bg-white"
            >
              <img
                src={frame.src}
                alt={`Precipitation anomaly map for ${frame.label}`}
                className="h-auto w-full select-none"
                draggable="false"
              />
            </motion.div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-4 md:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div className="grid grid-cols-2 gap-3 md:max-w-md">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Year
                  <select
                    value={year}
                    onChange={(e) => setIndex(dateToIndex(Number(e.target.value), month))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm"
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
                    onChange={(e) => setIndex(dateToIndex(year, Number(e.target.value)))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm"
                  >
                    {monthNames.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                Animation speed
                <select
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm md:w-36"
                >
                  <option value={1000}>Slow</option>
                  <option value={650}>Medium</option>
                  <option value={300}>Fast</option>
                </select>
              </label>

              <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Frame {index + 1} of {totalFrames} · {progressPct}%
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIndex(0)} aria-label="First frame">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setIndex((i) => clamp(i - 12, 0, maxIndex))}>
                <ChevronsLeft className="mr-2 h-4 w-4" /> Year
              </Button>
              <Button variant="outline" onClick={() => setIndex((i) => clamp(i - 1, 0, maxIndex))}>
                − Month
              </Button>
              <Button onClick={() => setPlaying((p) => !p)}>
                {playing ? (
                  <><Pause className="mr-2 h-4 w-4" /> Pause</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Play</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIndex((i) => clamp(i + 1, 0, maxIndex))}>
                + Month
              </Button>
              <Button variant="outline" onClick={() => setIndex((i) => clamp(i + 12, 0, maxIndex))}>
                Year <ChevronsRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIndex(maxIndex)} aria-label="Last frame">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={maxIndex}
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
                className="w-full accent-slate-900"
                aria-label="Map date slider"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{START_YEAR}</span>
                <span>{Math.round((START_YEAR + END_YEAR) / 2)}</span>
                <span>{END_YEAR}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1 text-center text-xs text-slate-500">
              {shortMonths.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setIndex(dateToIndex(year, i + 1))}
                  className={`rounded-lg px-1 py-2 transition ${
                    month === i + 1
                      ? "bg-slate-900 font-semibold text-white"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              Real PNG path for this frame: <code>{frame.realPngPath}</code>
              <div className="mt-1 text-xs text-slate-500">
                Keyboard: ←/→ moves one month; Shift + ←/→ moves one year.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
