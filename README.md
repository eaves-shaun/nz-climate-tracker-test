# NZ ERA5-Land Temperature Dashboard

A Vite + React dashboard for New Zealand district-level ERA5-Land monthly temperature anomalies.

## Local preview

```bash
npm install
npm run dev
```

The dashboard reads the fixed CSV at:

```text
public/data/nz_district_era5land_monthly_temps.csv
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

### Option A: use the included portable `base: './'`

This usually works for GitHub Pages project sites and other static hosts:

```bash
npm install
npm run deploy
```

Then enable Pages for the `gh-pages` branch in your GitHub repository settings.

### Option B: set an explicit repo base path

In `vite.config.js`, change:

```js
base: './'
```

to, for example:

```js
base: '/nz-era5-dashboard/'
```

where `nz-era5-dashboard` is your repository name. Then run:

```bash
npm run deploy
```

## Data format

Expected CSV columns:

```text
district_id,district_name,date,year,month,temp_c,anomalies
```

The dashboard uses `district_name` as the key because some GEE exports can contain blank `district_id` values.

DJF is assigned to the year of January/February, so Dec 2023 + Jan 2024 + Feb 2024 is labelled DJF 2024.
