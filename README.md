# Meteora Weather App 🌤

Full-stack weather application built as part of the *Tech Assessment – Software Engineer Intern (AI/ML Application)*.  
Implements *TA1 (Weather Forecasting UI)* + *TA2 (Database + Export Functionality)*.

---

## ✅ Completed Assessments

### Tech Assessment 1 (Weather App)
- Search weather by *city / ZIP / coordinates / landmarks*
- Display *current weather* with temperature, humidity, wind, etc.
- Show *5-day forecast by default*
- *Use my location* (via browser geolocation)
- Responsive UI styled with *TailwindCSS, **icons, and an interactive **map view (Leaflet)*

### Tech Assessment 2 (Advanced Weather App)
- *CRUD with database (Postgres via Prisma ORM)*:
  - *Create*: save requests with validated location & date ranges  
  - *Read: view all previous requests in **History*  
  - *Update*: modify saved requests  
  - *Delete*: remove requests  
- *Validation (Zod + client-side checks)*:
  - Location must exist  
  - dateStart ≤ dateEnd enforced  
- *Visuals & APIs*:
  - Interactive map (Leaflet / OpenStreetMap)  
  - Charts (Chart.js) for forecasts  
- *Data Export*: JSON, CSV, XML, Markdown, PDF  
- *Deployment Ready*: NeonDB (Postgres) + Prisma + Vercel

👉 *Both TA1 + TA2 requirements are fully met.*

---

## 📦 Tech Stack
- *Frontend:* Next.js 15 (App Router + Turbopack), React 19, TailwindCSS 4  
- *State/Data:* React Query, Zod (validation), date-fns  
- *Backend/ORM:* Prisma ORM + PostgreSQL (NeonDB for prod, SQLite for local dev)  
- *Visuals:* Leaflet (maps), Chart.js (charts)  
- *Exports:* PDFKit, json2csv, xmlbuilder2, markdown-it  
- *Deployment:* Vercel (with Prisma generate fix)

---

## ⚙ Setup & Requirements

```bash
# 1. Clone repo
git clone https://github.com/ChiranchiRahul/meteora-weather.git
cd meteora-weather

# 2. Install dependencies
npm install

# 3. Environment variables
# Copy .env.example → .env
# Example (NeonDB):
DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"

# 4. Prepare database
npx prisma migrate dev --name init
npx prisma generate

# (Optional) Inspect DB
npx prisma studio

# 5. Run app locally
npm run dev
# open http://localhost:3000
