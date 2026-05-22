# Project: Custom Dashboard Implementation

This document outlines the requirements and design for a custom dashboard. It is intended to serve as a comprehensive guide for implementation.

> [!IMPORTANT]
> **Progress Status:** Development has already started. Do not assume extra items or tasks beyond what is listed.
> **Style Independence:** The Navbar and Dashboard styles are independent of any client-side website design changes.

---

## 1. Side Panel Layout

The side panel is already created. Focus on refining the functionality within the three main tabs: **Design**, **Items**, and **Config**.

### [ NEW ] Store at a Glance (Quick View)
Located at the top of the side panel for immediate insight:
- **Summary Stats:** Total Items, Out of Stock Items, and Most Viewed Category.

### A. Design Tab
Allows the client to customize the visual presentation and layout of the website.

**Key Features:**
- **Location Control:** Select positioning for various elements (Top Left, Top Center, Top Right, Left, Center, Right, Bottom Left, Bottom Center, Bottom Right).
- **Hero Banner Images:** Supports both static images and carousels, depending on the chosen layout.
- **Draggable Sections:** All layout divisions can be re-arranged via drag-and-drop or toggled on/off.
- **Catalog Placement:** A "Where?" button opens a window to specify catalog location:
  - Landing page (Full catalog)
  - Landing page (Featured: accented items, most recent)
  - Separate tab

**Customization Options:**
- **Templates:** `[ Change Template ]` button opens a template gallery.
- **Colours:** Background, Accent, and Text (Text is automatic by default according to the colour of the background).
- **Brand Identity:**
  - **Logo:** URL/Upload. Expandable settings for Location and Size.
  - **Store Name:** Text entry. Expandable settings for Location, Size, and Font (defaults to title font).
  - **SEO Title/Description:** Expandable settings for Location, Size, and Font.
- **Fonts:** Supports custom font URLs. Options for Title, Body, Accent, and Slogan. **Safe Fallbacks:** Dashboard automatically reverts to system-safe fonts if a custom URL fails.
- **Section Details:**
  - **Header:** Logo, Title, Text, Cart.
  - **Hero Banner:** Images, Logo, Title, Text, Slogan.
  - **Body:** Primarily for text, supports images.
  - **Catalog:** Sorters (Title, Category, Price, Date), Filters, Search Bar, Categories (all toggleable).
  - **Footer:** General footer configuration.
- **Add Section:** Button to add additional Body sections.
- **Custom Buttons:** Up to 3 buttons with Text, Image, URL, and Sticky options.

### B. Items Tab
Management of the product catalog.

**General Actions:**
- `[ Download Template ]`
- `[ Export Items ]`: Supports **CSV** (for easy spreadsheet editing) and **JSON** (for full technical system backups).
- `[ Import Items ]`: Includes a confirmation pop-up. **Warning:** Columns must align perfectly with the example.
- `[ NEW PRODUCT ]` button.
- Search (Basic: Title/ID), Filter, and Sort functionality for the item list.

**Item List View:**
- Columns: Name, Price.
- Actions: `[Duplicate]`, `[Edit]`, `[Delete]`.
- **Duplicate Logic:** Appends `-1` to the title. New duplicates default to "Draft" or "Hidden" status.
- **Bulk Editing:** Support for "Select All" or multiple selection to change category, price, or visibility.
- **Batch Confirmation:** A safety pop-up appears when performing bulk actions (e.g., "Apply changes to 50 items?").
- **Troubleshooting:** `[ Fetch Button ]` for missing items, `[ Broke Link Checker ]` for missing images, or contact the developer.

**Add/Edit Item Interface:**
- **Mandatory Fields:** ID, Title.
- **Other Fields:** Description, Price, Image(s), Categories.
- **Discount & Badges:** 
  - Supports simple (Fixed/%) and complex reductions.
  - **Badge Toggle:** Select from `-20%`, `NEW`, or custom labels like `FLASH SALE`.
- **Variations:** `[Add variation]` and `[Price Variation]`.
- **ID Restriction:** Variations should use the base ID with `VN` (where N is a number) appended. Clients are restricted from ending base IDs with `VN` to avoid conflicts.

### C. Config Tab
Global dashboard settings and feature toggles.

**Settings:**
- **Language:** Support for English, Spanish, Italian, and Portuguese. **(Dashboard UI Only)**.
- **Dashboard Size:** Small, Medium, Large.
- **Preview View:** Toggle between Desktop and Cellphone.
- **Advanced Tweaks (Toggleable):**
  - **Edit Item IDs:** Includes a technical responsibility warning pop-up.
  - **Newsletter Pop-up:** Configure Title, Text, and Image.
  - **Countdown Timer:** For sales events (Global or Category-specific).
  - **Out of Stock Behavior:** "Show anyway" or "Show with warning".
  - **Stock Visibility:** Private vs. Public.
  - **Start All Over:** Resets everything to 0. Requires typing "RESET" to confirm, then redirects to the template gallery.

---

## 2. Navbar

The Navbar should facilitate easy navigation and state management.

- **Navigation:** Main links as defined.
- **Undo/Redo:** Standard arrow icons for action history.
- **Discard Changes:** Button to reset the current session's unsaved modifications.
