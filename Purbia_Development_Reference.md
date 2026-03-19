# Purbia Enterprise: Development & Update Summary (2024-2026)

This document serves as a detailed reference for all recent developments, technical refactors, and feature updates implemented in the Purbia Enterprise internal software.

---

## 1. LR (Lorry Receipt) Module Updates

### Distance Field Refactor
- **Change**: The `distance` field was converted from a **numeric** type to a **string/text** type.
- **Reason**: To allow flexible entries like "Local", "Dahej to Beil", or specific distance ranges (e.g., "50 To 60") that were required for PI Industries billing.
- **Affected Files**: `LrController.php`, `LRForm.tsx`, and database migrations for the `lrs` table.

### Advanced Filtering in LR Printing
- **Feature**: Added a sophisticated filtering dialog in the Print LR module.
- **Capabilities**: Filter LRs by LR No, Date (Range), Billing Party, and Vehicle Number.
- **Result**: Users can now isolate specific LRs for bulk printing or verification based on their unique criteria.

---

## 2. Invoice Generation System

The system now supports two distinct industry-specific invoice formats with specialized logic.

### BEIL Industries
- **Format**: Landscape A4 PDF (to accommodate many columns).
- **Core Content**: Standardized table with specific item codes (45696 to 45700) and location names (Dahej, Saykha, Jhagadiya, Panoli, Ankleshwar).
- **Static Mapping**: Description fields are auto-mapped based on these item codes as per the `Beil.pdf` standard.

### PI Industries
- **Format**: New table structure based on "Invoice type 2".
- **Dynamic Columns**:
    - **Detention**: If an LR has detention days > 0, a sub-row is automatically generated below the LR transportation row.
    - **Inward/Outward Details**: The detention sub-row displays the date range and billing calculation (e.g., `3-1=2`).
- **Auto-Population**: When selecting an LR, the system automatically fetches:
    - Manifest No, Vehicle Registration, LR Date.
    - Inward Time and Outward Time (stored as `inward_date` and `outward_date` in invoice items).

### Inline Master Creation
- **Feature**: "+" buttons added next to the **Billing Party** and **Delivery Place** dropdowns in the Invoice module.
- **UX**: Allows operators to create a new master record on-the-fly without leaving the invoice creation screen. The newly created record is immediately selected.

---

## 3. Invoice History & Edit Flow

### Refactored Edit Dialog
- **Architecture**: The edit process was moved from a standalone page to a **Modal/Dialog popup** within the Invoice History module.
- **Benefits**: Fixed navigation issues and "blank screen" errors during editing. Ensures the UI state is preserved.

### Manual Read/Write Access (Overwrites)
- **Feature**: Users can now manually edit the following fields even after an invoice is generated/auto-populated:
    - **Date**, **Manifest No**, **Vehicle No**.
- **Logic**: The backend now prioritizes values provided in the request. If the user corrects a Vehicle No in the Edit Dialog, it overrides the value pulled from the original LR record.
- **Technical Fix**: Resolved the validation error *"The lr ids field is required when business type is PI"* by ensuring `lr_ids` are derived and sent from the Edit Dialog.

---

## 4. Technical Implementation Reference

### Database Schema Updates
- **Columns added to `invoice_items`**:
    - `manifest_no` (string)
    - `vehicle_no` (string)
    - `lr_date` (date)
    - `inward_date` (datetime)
    - `outward_date` (datetime)
- **Model Modifications**: `InvoiceItem.php` includes these in `$fillable` and handles decimal casting for `qty_display`.

### Backend Controller Logic (`InvoiceController.php`)
- **Lookup vs. Override**:
    - During `store()`, if an `lr_id` is provided, the backend attempts to auto-fetch details from the `Lr` model.
    - During `update()`, the backend checks if the user provided manual overrides. If not, it falls back to the LR lookup.
- **Validation**: Strict validation for business-specific fields (e.g., `lr_ids` required for PI).

---

## 5. Ongoing Considerations & Future Updates

- **Retrofitting Invoices**: Invoices created prior to March 2026 lack the extra LR detail columns. To "fix" an old invoice, it should be edited and re-saved using the new Edit Dialog.
- **Detention Calculation**: Currently uses a standard formula (Days - 1). Any deviations in detention policy should be updated in `calculateDetentionDays` within `InvoiceModule.tsx`.
- **PDF Margins**: A4 margins are optimized in `InvoicePrint.tsx` using CSS `@media print` rules.

---
*Document generated for Purbia Enterprise Development Reference.*
