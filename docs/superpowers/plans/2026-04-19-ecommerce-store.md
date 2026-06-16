# Implementation Plan: E-Commerce Store (Srey Tha Boutique)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Build a cinematic, high-fashion public store for Srey Tha Curtain with a "Westwood Blush" aesthetic.

**Architecture**: React SPA using the Node.js API. Focused on editorial layouts and minimalist interactions.

**Tech Stack**: React, Vanilla CSS, Axios, Lucide-React.

---

### Task 1: Store App Initialization
**Files**:
- Create: `ecommerce-frontend/src/api/axios.js`
- Modify: `ecommerce-frontend/src/App.jsx`

- [ ] **Step 1: Scaffold Vite Project**
Run: `npx create-vite@latest ecommerce-frontend --template react -- --yes`
Install: `axios lucide-react`

- [ ] **Step 2: Setup Axios Utility**
```javascript
import axios from 'axios';
export default axios.create({ baseURL: 'http://localhost:5000/api' });
```

- [ ] **Step 3: Commit**
```bash
git add ecommerce-frontend/
git commit -m "chore: scaffold ecommerce store"
```

---

### Task 2: "Westwood Blush" Aesthetic
**Files**:
- Create: `ecommerce-frontend/src/index.css`
- Create: `ecommerce-frontend/src/styles/Store.css`

- [ ] **Step 1: Define Global Blush Style**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap');

:root {
  --bg-blush: #FFF5F5;
  --text-primary: #000000;
  --text-muted: #555555;
  --accent-pink: #F4C2C2;
}

body {
  background: var(--bg-blush);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 2: Commit**
```bash
git add ecommerce-frontend/src/index.css
git commit -m "style: implement boutique blush tokens"
```

---

### Task 3: Editorial Boutique Interface
**Files**:
- Create: `ecommerce-frontend/src/components/Navbar.jsx`
- Create: `ecommerce-frontend/src/components/ProductGrid.jsx`

- [ ] **Step 1: Create Symmetrical Header**
Centered "SREY THA" branding with minimalist navigation.

- [ ] **Step 2: Create Product Grid**
Displays products as artistic cards with elegant serif titles.

- [ ] **Step 3: Commit**
```bash
git add ecommerce-frontend/src/components/
git commit -m "feat: implement boutique boutique layout and grid"
```
