# Furniva — Full Project Context

**Compiled from an extended build session.** This document covers Furniva as a business, not just the Shopify theme — CRM, marketing, inventory, and the storefront build are all summarized here for continuity in a new session/tool.

---

## 1. Business Overview

- **Brand**: Furniva (furniva.in) — D2C furniture e-commerce, India
- **Founded**: January 2024
- **2025 revenue**: ~₹1.2 Cr
- **Sales channels**: Amazon (~90% of revenue), Flipkart, own website, WhatsApp-integrated channels
- **Self-run marketing** starting September 2026
- **Monthly ads/tools budget**: ₹30,000 INR
- **Sourcing**: Bhiwandi and China
- **Founder**: Nishit, based in Rajasthan, India
- **Corporate office (current, confirmed)**: Himank Path, Ganpati Nagar, Manyawas, Jaipur, Rajasthan, India – 302020
- **Key dates**: GIF (Great Indian Festival) stock deadline was mid-September

## 2. CRM — Custom-Built System

- **Backend**: FastAPI + MongoDB, hosted on **Fly.io** (`furniva-crm-api.fly.dev`)
- **Frontend**: React, hosted on **Vercel**
- **Marketing report endpoint**: `https://furniva-crm-api.fly.dev/api/reports/marketing-summary?token=[REDACTED]&days=90` - the live token has been redacted from this document; retrieve it from wherever it's originally stored (not this repo) and rotate if it may have been exposed.
- **SKU tracker (Google Sheet)**: ID `1eLPnKFkqad9UDhMSccNtkrbrB8kuv4GAHZuf6EV4Z9E`
  - 37 existing SKUs with sales history (tiers: Accelerating / Declining / Dead-Liquidate)
  - 20 new sourced SKUs with no sales data yet
  - Known data issue: a tab-character duplicate SKU ("\t Furniva Skyline 6 Feet Wooden 2 Door") needs cleanup

## 3. Marketing & Advertising

- Role scope: UGC, social, paid ads, CRO, SEO, reporting — run as an ongoing Senior Marketing & Advertising Planner function
- Connected tools during this session: **Meta MCP** (Ads), **Shopify MCP**, **Google Drive**
- GIF-2026 priority restocks identified: Skyline Wenge (0 stock, #1 priority), Pop Two Door (China restock in progress)
- Liquidate-before-GIF candidates: Fusion Sonoma Oak (99 units, lifetime 2 sales), Eclipse 6-Seater Milky White (28 units, 0 sales), Italiana Cream (28 units, 0 sales)
- Declining-tier SKUs blocked by Hyderabad supplier pricing issues (restock pending resolution)

## 4. Shopify Store

- **Store**: `hx1b8e-3e.myshopify.com` (was on trial plan — confirm current plan status)
- **GitHub repo**: `nish53/dawn`, branch `main`, GitHub-connected theme
- **GitHub PAT**: was used throughout this build session and should be **rotated immediately** - not included in this document since it's a live credential (GitHub's secret-scanning correctly blocked an earlier attempt to commit it here). Retrieve/regenerate it from GitHub Settings > Developer settings > Personal access tokens.
- **Local theme working path** (previous session): `/home/claude/furniva-theme/`

### Theme Architecture
- Dawn-based, heavily customized with custom-liquid sections throughout
- Fully custom header (sticky, mega menu) and footer (WhatsApp widget, social icons)
- Site-wide font: **Red Hat Display** (theme setting `type_header_font`/`type_body_font` AND hardcoded `font-family` replaced across every custom-liquid section/page template — went through Poppins → Jost → DM Sans → Outfit → Cabin → Red Hat Display before landing here)
- Color palette: `#152420` (dark green, primary/foreground) + `#f4a51c` (amber, accent/highlight)
- Homepage section order: hero, trust bar, "As Seen On" shoppable video section, category grid, edit banners, Bestsellers carousel, Wooden Shoe Racks carousel, lifestyle banner (3-col overlay), Beds carousel, TV Units carousel, Study carousel, Dining carousel, reviews bar, testimonials, SEO text
- **Category grid** ("Shop every room"): fixed 6-column × 2-row grid (12 categories, no horizontal overflow, responsive collapse to 3/2 cols), large rounded-square images with soft drop-shadow, 14px bold uppercase caption below, hover = image zoom only (no lift/shadow)
- Collection pages: custom hero with category-aware theming, real subset "Browse by type" pills (including drawer-count sub-pills for Chest of Drawers), buyer-guide tips per category, cross-sell block
- **Product cards**: centered 15px bold titles, star ratings hidden entirely when no reviews (was showing empty stars + "No reviews yet"), price reordered sale-price-first (16px bold) → small strikethrough regular price → %-off badge (no borders), all centered on one line, ₹ symbol forced via replace filter (store's Admin currency format still says "Rs.", theme files can't override that directly)
- Custom sections built with proper theme-editor schema (not just raw custom-liquid): `sections/shoppable-videos.liquid` (image_picker, video type select, product picker per block), `sections/lifestyle-banner-overlay.liquid` (image_picker, text position L/R, color, heading/link/subtext fields per block — uses percentage-based margins matching the old WordPress site's exact responsive technique)
- Shoppable video carousel: click opens in-page modal (no bounce), stops playback properly on close (empties the DOM node), supports both iframe embeds and self-hosted `<video>` per block

### Known Pending Items
- [ ] Rotate GitHub PAT
- [ ] Confirm Shopify plan (trial → paid) before going fully live
- [ ] Create actual Shopify **Page** records in Admin for About Us, Contact, and all policy pages (templates exist, pages need to be created and assigned)
- [ ] Wardura 3 Door Wardrobe product listing needs a real image (page was robots-blocked from fetching)
- [ ] 3-Drawer Chests, Coffee Tables, and 6-Seater Dining Sets collections are empty — pills/cross-sells for these will stay hidden until real products exist
- [ ] Add "Free-Install" tag to qualifying products (manual, API doesn't support bulk tag edit)
- [ ] Wishlist/Compare features — explicitly deferred, not built
- [ ] Bestseller badges (#1/#2/#3) — deferred, needs metafields
- [ ] Lifestyle banner overlay's 3 columns currently show placeholder product photos as images — real photos need uploading via each block's Image field in the theme editor
- [ ] Verify Shopify Admin's Store currency format (Settings → General) — theme currently force-replaces "Rs." with "₹" via a Liquid filter as a workaround; updating the actual Admin setting would be cleaner

## 5. Catalog Summary

**37+ products live in Shopify** (DRAFT status), spanning:
- Beds (complete: 3/3 real SKUs)
- TV Units (complete: 2/2 real SKUs)
- Dining (4 major bestsellers: LuxeDine 4 & 6-seater, EliteDine 6-seater, QuattroDine)
- Storage & Study (~28 SKUs — shoe racks, wardrobes, bookshelves, chests, cabinets)
- 5 brand-new SKUs sourced from a Drive folder ("Product Images New"): Penny Bed Side Table, Contour Accent Table, Rune Shoe Cabinet, Thyme Kitchen Cabinet, Metro 3 Door Shoe Rack

**Full furniva.in site audit** (WordPress source, pre-migration) found ~42 unique real products across Beds/Dining/TV Units/Storage/Study — used to prioritize what's been migrated vs. what's still pending.

## 6. Notes on Data Reliability

- The original site's corporate address flickered between "Churu, Rajasthan" and "Jaipur, Rajasthan" across different cached pages — **Jaipur (Manyawas) is confirmed correct** per the user directly.
- Several Shopify sync failures during this build were caused by real, findable bugs (not flaky tooling) — e.g., a stray literal backslash in Liquid code, a `padding_top` step-validation mismatch, an `assets/` subfolder violation. Worth knowing this GitHub-Shopify sync pipeline **does** surface real errors in its log — always check the reimport log text, not just whether it says "Theme updated."

---

*This document was compiled from conversation history for continuity purposes. Some details (prices, stock levels, tier classifications) will have changed since compilation — treat as a snapshot, not live data.*
