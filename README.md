# CarbonIQ: Enterprise-Grade Carbon Footprint Assistant

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/RAMINENI-TEJA-24MEI10040/Carbon-Footprint-Awareness-Platform.git)

CarbonIQ is a production-ready, highly optimized Single Page Application (SPA) designed to empower individuals to measure, analyze, and reduce their personal carbon footprints. The application is built using **React + TypeScript + Vite + Vanilla CSS**, prioritizing code quality, security, performance, and WCAG 2.2 AA accessibility standards.


---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd "Carbon Footprint Awareness Platform"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Build the minified production assets:
   ```bash
   npm run build
   ```

---

## 🛠️ Environment & Configuration

The application is structured to run fully client-side (offline first) for maximum user privacy and lightning-fast reactivity.
* **Electricity Grid Factor**: Configurable directly within the application's **Settings Panel** (under `Grid Electricity Factor`). Default value is `0.380 kg CO2e / kWh`. Overriding this value automatically updates all logged utility records.
* **Default Database Seed**: The application initializes with 30 days of mock log history representing realistic commuter patterns, meal logs, shopping behavior, and utility invoices. Slicing can be reset to factory defaults via the **Reset Database** trigger in the *Reports & Insights* panel.

---

## 📐 Architecture Overview

CarbonIQ follows a strict modular, layered architecture to enforce SOLID principles and separation of concerns:

```
[UI Component Layer] (React Components)
         │
         ▼
[Application State Layer] (React AppContext & useApp)
         │
         ├─────────────────────────────────┐
         ▼                                 ▼
[Services Layer]                   [Domain Logic Layer]
 ├─ StorageService (localStorage)   ├─ CarbonCalculator (CO2e equations)
 └─ AuditLogger (History trail)     ├─ RecommendationEngine (Data-driven tips)
                                    ├─ GoalManager (Smart forecasts)
                                    └─ EcoScore (XP levels & streaks)
```

1. **Domain Layer**: Contains pure algorithmic code decoupled from React (pure functions and static calculators). Very fast and easily unit-tested.
2. **Services Layer**: Manages infrastructure actions such as reading/writing to `localStorage` and audit logging.
3. **Application State Layer**: Wraps state variables in a unified context provider (`AppContext.tsx`) to coordinate mutations, perform automatic checks (e.g. goal achievements), and trigger saves.
4. **UI Presentation Layer**: Consists of modular, responsive views. All charts are drawn directly using custom inline SVG nodes styled with theme-aware HSL custom properties.

---

## 🧪 Testing Instructions

CarbonIQ features a robust unit testing setup using **Vitest**.

To execute the test suite:
```bash
npm run test
```

### Coverage Scope
* **Carbon Calculator**: Verification of emission multipliers, grid overrides, negative offsets, and boundary validations.
* **AI Recommendation Engine**: Verification of priority rankings and explanation math based on high mileage or high power habits.
* **Goal Manager**: Baseline calculations, completion progress checks, and milestone checklists.
* **Eco Score & Gamification**: Streak counting across dates, XP leveling formulas, and badge unlock logic.

---

## 🔒 Security Considerations

CarbonIQ is designed with a defense-in-depth posture:
1. **Input Sanitization**: All user logging and profile inputs are parsed and validated by strict validators (`CarbonCalculator.validateLogValue`) to prevent extreme integers, NaN values, and buffer overflows.
2. **XSS Prevention**: Rendering is handled by React's virtual DOM which automatically escapes text content. Standalone user input variables are never passed to raw `dangerouslySetInnerHTML`.
3. **Audit Trail**: Every mutation (create, edit, delete, import) generates a unique, timestamped record logged in a local audit trail.
4. **Least Privilege**: Application uses zero external cookies or tracker scripts. All data is kept strictly inside the user's browser sandbox (`localStorage`).

---

## ♿ Accessibility Statement (WCAG 2.2 AA)

We target WCAG 2.2 AA compliance:
* **Keyboard Usability**: Every interactive card, input, and tab is focusable (`tabIndex={0}`) with high-contrast visible focus rings.
* **Skip Link**: A "Skip to Main Content" utility is positioned at the top of the DOM for immediate screen reader/keyboard navigation bypass.
* **ARIA & Landmark Semantics**: Appropriate semantic HTML tags (`<header>`, `<main>`, `<nav>`, `<svg>`, `<table>`) are used with descriptive `aria-label` tags.
* **Accessible Visualizations**: Charts are constructed with SVG title and description markers. In addition, an invisible CSS `.sr-only` HTML table containing raw tabular data runs alongside every SVG chart, allowing blind users to retrieve chart values instantly.
* **Reduced Motion**: All transitions support media query triggers to automatically shut down animations for users requesting reduced motion.

---

## 📊 Assumptions & Limitations

* **Emission Coefficients**: Coefficients are derived from standard environmental databases (DEFRA 2023, EPA, and IPCC guidelines). They represent global averages and may vary depending on municipal recycling details or vehicle fuel efficiency grades.
* **Annualization Calculation**: Weekly/monthly rates are annualized assuming a linear continuation of the user's current 30-day logging frequency.
* **Savings Estimations**: Monetary fuel savings assume gasoline costs of `$0.12 per km` and grid electricity charges of `$0.16 per kWh`.

---

## 🔮 Future Enhancements

1. **Smart Meter Integrations**: API connection to municipal utility providers to auto-log grid power invoices.
2. **Receipt OCR Scanner**: Integrations to parse grocery receipts or shopping invoices to auto-log shopping items.
3. **Co-operative Challenges**: Multiplayer clean-commute team leagues.

---

## 📄 License
This project is licensed under the MIT License.
