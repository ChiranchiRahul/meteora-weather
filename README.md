# Meteora Weather App 🌤️

Full-stack weather app (TA1 + TA2). Next.js 15, Tailwind, Prisma, SQLite.

## Features
- Search weather by city/ZIP/coords/landmark
- Current weather + default 5-day forecast (adjustable with date pickers)
- "Use my location"
- Map preview (Leaflet)
- Save requests (Create) with validation (dateStart ≤ dateEnd, real location)
- History (Read), Update, Delete
- Export: JSON, CSV, XML, Markdown, PDF
- Header shows: **Meteora — by Rahul Chiranchi** and **ℹ︎ PM Accelerator** (opens LinkedIn)

## Tech Stack
Next.js 15 (App Router, Turbopack) · React 19 · Tailwind · Prisma · SQLite · React Query · Zod · date-fns · Leaflet · Chart.js · PDFKit · json2csv · xmlbuilder2 · markdown-it

## Requirements
See `requirements.txt` for dependencies.

## Local Setup
```bash
npm install
npx prisma db push
npm run dev
