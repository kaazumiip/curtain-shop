# Implementation Plan: Admin Dashboard (Srey Tha Control Center)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Build a React-based stock management system with a high-fashion, minimalist dark theme for Srey Tha Curtain.

**Architecture**: React SPA communicating with Node.js API. Centralized CSS for the "Vivienne Westwood" minimalist/dark identity.

**Tech Stack**: React, Vanilla CSS, Axios, Lucide-React.

---

### Task 1: Admin App Initialization
**Files**:
- Create: `admin-dashboard/src/api/axios.js`
- Modify: `admin-dashboard/src/App.jsx`

- [ ] **Step 1: Scaffold Vite Project**
Run: `npx create-vite@latest admin-dashboard --template react` in workspace root.
Followed by: `npm install axios lucide-react`

- [ ] **Step 2: Create API Utility**
```javascript
import axios from 'axios';
const instance = axios.create({
  baseURL: 'http://localhost:5000/api'
});
export default instance;
```

- [ ] **Step 3: Commit**
```bash
git add admin-dashboard/
git commit -m "chore: scaffold admin dashboard"
```

---

### Task 2: "Vanguard Dark" Styling
**Files**:
- Create: `admin-dashboard/src/index.css`
- Create: `admin-dashboard/src/styles/Dashboard.css`

- [ ] **Step 1: Define Global Style (Black, White, Pink)**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap');

:root {
  --bg: #000000;
  --surface: #111111;
  --text: #ffffff;
  --pink: #F4C2C2;
  --vanguard: #E0115F;
  --gray: #444444;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  margin: 0;
}

h1, .serif { font-family: 'Playfair Display', serif; }
```

- [ ] **Step 2: Commit**
```bash
git add admin-dashboard/src/index.css
git commit -m "style: implement core aesthetic tokens"
```

---

### Task 3: Dashboard Layout & Product Table
**Files**:
- Create: `admin-dashboard/src/components/Dashboard.jsx`
- Create: `admin-dashboard/src/components/StockTable.jsx`

- [ ] **Step 1: Create Main Dashboard**
A centered centered "STOCK CONTROL CENTER" title in refined serif.

- [ ] **Step 2: Create Stock Table**
Minimalist rows with "Status Assignment" badges (LIMITED EDITION, SOLD OUT, etc.).

- [ ] **Step 3: Commit**
```bash
git add admin-dashboard/src/components/
git commit -m "feat: implement dashboard layout and stock table"
```
