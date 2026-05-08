# NZ Climate Tracker

Interactive dashboard for exploring observed climate anomalies across New Zealand districts using ERA5-Land climate reanalysis data.

The dashboard allows users to:
- compare temperature and precipitation anomalies through time
- examine annual, seasonal, and monthly anomalies
- compare district anomalies against nationwide means
- visualise monthly anomaly matrices
- explore 1991–2020 climatologies for individual districts

The application is built with:
- React
- Vite
- Recharts
- Tailwind CSS

and is deployed via GitHub Pages.

---

# Features

## District selection

Users can select any New Zealand district from the dropdown menu. The dashboard loads with:
- Wellington City
- Annual mean
- Temperature anomalies

selected by default.

---

## Variable selection

Two variables are currently supported:

### Temperature
- anomaly units: °C
- monthly mean temperature
- 1991–2020 climatological reference period

### Precipitation
- anomaly units: %
- monthly precipitation totals
- anomalies relative to 1991–2020 monthly climatology

---

## Temporal aggregation

The dashboard supports:
- annual mean anomalies
- seasonal anomalies:
  - DJF
  - MAM
  - JJA
  - SON
- individual calendar months

Annual means require all 12 months to be present.

Seasonal means require all 3 constituent months.

DJF is assigned to the year of January and February:
- December 2023 + January 2024 + February 2024 = DJF 2024

---

# Dashboard panels

## Extreme anomaly panels

Four summary panels show:
- warmest/wettest anomaly for selected district
- coolest/driest anomaly for selected district
- most anomalous district nationally (positive)
- most anomalous district nationally (negative)

Panel colours reflect anomaly direction:
- red/blue for temperature
- green/brown for precipitation

---

## Time-series anomaly chart

The main chart displays:
- district anomalies as coloured bars
- nationwide area-weighted mean anomaly as a grey line

Colours:
- temperature:
  - warm = red
  - cool = blue
- precipitation:
  - wetter = green
  - drier = brown

Nationwide means are area-weighted using district area values supplied in the CSV.

---

## Monthly anomaly matrix

The heatmap matrix displays:
- months as rows
- years as columns
- colour-scaled anomaly values

Features:
- hover tooltips
- highlighted hover cell
- interactive inspection of individual months

---

## Climatology panel

The climatology panel shows the 1991–2020 seasonal cycle for the selected district:
- precipitation as monthly bars
- temperature as a monthly line

This provides seasonal context for the anomaly plots.

---

# Data

The dashboard expects a CSV located at:

```text
public/data/nz_grouped_era5land_monthly_195001_202604.csv
