# Meteora Weather App 🌤️

Full-stack weather application built as part of the **Tech Assessment – Software Engineer Intern (AI/ML Application)**.

---

## ✅ Completed Assessments

### Tech Assessment 1 (Weather App)
- Search weather by city / ZIP / coordinates / landmarks
- Display **current weather** with useful details
- Show **5-day forecast** by default
- **Use my location** (via browser geolocation)
- Styled UI with icons and an interactive **map view (Leaflet)**

### Tech Assessment 2 (Advanced Weather App)
- **CRUD with database (SQLite via Prisma ORM)**:
  - **Create**: save requests with validated location & date ranges
  - **Read**: view all previous requests in **History**
  - **Update**: modify saved requests
  - **Delete**: remove requests
- **Validation**:
  - Checks that location exists
  - Ensures `dateStart ≤ dateEnd`
- **Extra APIs**: interactive map (Leaflet / OpenStreetMap)
- **Data Export**: JSON, CSV, XML, Markdown, PDF

👉 **Both TA1 + TA2 requirements are fully met.**

---

## 📦 Tech Stack
- **Frontend:** Next.js 15 (App Router + Turbopack), React 19, Tailwind CSS  
- **State/Data:** React Query, Zod (validation), date-fns  
- **Backend/ORM:** Prisma + SQLite (local dev DB)  
- **Visuals:** Leaflet (maps), Chart.js (charts)  
- **Exports:** PDFKit, json2csv, xmlbuilder2, markdown-it  

---

## ⚙️ Setup & Requirements (Local)

```bash
# 1. Clone repo
git clone https://github.com/ChiranchiRahul/meteora-weather.git
cd meteora-weather

# 2. Install dependencies
npm install

# 3. Prepare database (generates prisma/dev.db)
npx prisma db push

# 4. Run app
npm run dev
# open http://localhost:3000

# 5. Environment variables
# Copy .env.example → .env
DATABASE_URL="file:./dev.db"

# 6. Requirements
# All dependencies are listed in requirements.txt
# Dependencies are also managed via package.json
