# Design Specification: Srey Tha Curtain

**Project Name**: Srey Tha Curtain  
**Designer**: Antigravity  
**Tech Stack**: Node.js (Backend), React (Frontend), MongoDB (Database)

## 1. Project Overview
A dual-fronted web application system for a high-end textile boutique. One site provides a cinematic, editorial shopping experience, while the other provides a secure, minimalist dashboard for product management (CRUD) and stock control.

## 2. Architecture & Folder Structure
We will use a "Pro Split" architecture to ensure security and performance isolation.

```text
/srey-tha-curtain
  /backend
    - Node.js + Express
    - Mongoose Models (Product, User)
    - API Routes (/api/products, /api/auth)
  /ecommerce-frontend
    - React (Public Store)
    - Styled with "Westwood Blush" theme
  /admin-dashboard
    - React (Stock & CRUD)
    - Secure login gate
    - Real-time stock indicators
```

## 3. Visual Aesthetic: "Westwood Blush"
Inspired by Vivienne Westwood’s high-fashion editorial style mixed with the "Srey Tha" personal touch.

*   **Palette**:
    *   Background: **Subtle Blush** (`#FFF5F5`)—soft and elegant.
    *   Text/Primary: **Rich Raven Black** (`#1A1A1A`).
    *   Accents: **Champagne Pink** (#F4C2C2) for hover states.
    *   Alerts: **Vanguard Pink** (#E0115F) for "Sold Out" or "Low Stock" badges.
*   **Typography**:
    *   Headlines: **Engraver's Serif** (Elegant, Boutique feel).
    *   UI/Body: **Strict Sans-Serif** (Modern, High-contrast).

## 4. Feature Specifications

### A. E-Commerce Store (Public)
*   **Hero Section**: Artistic widescreen shots of curtains/bedsheets with "Srey Tha Curtain" branding.
*   **Product Gallery**: Minimalist cards with large images and subtle "Westwood" typography.
*   **Categories**: Curtains, Bed Sheets, Pillow Cases.
*   **Shopping Cart**: A slide-out drawer for adding items before checkout.

### B. Admin Dashboard (CRUD & Stock)
*   **The "Stock Engine"**: A central table showing current inventory.
    *   **CRUD**: Full Add, Read, Update, Delete capabilities for products.
    *   **Stock Badging**: Automatic color-coding (Pink for sold out, Subtle Blush for in stock).
*   **Bulk Edit**: Quick-change mode for updating multiple stock counts at once.

### C. Backend API
*   `GET /api/products`: Retrieve all products for the store.
*   `POST /api/products`: Create new product (Admin only).
*   `PUT /api/products/:id`: Update stock or price (Admin only).
*   `DELETE /api/products/:id`: Remove product (Admin only).

## 5. Success Criteria
*   The storefront looks like a high-end luxury website (Vivienne Westwood style).
*   The Admin site can successfully manage (CRUD) products and update stock in real-time.
*   Data is persistently stored in MongoDB.
