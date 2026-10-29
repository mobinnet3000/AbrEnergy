# Dropdown Localization & Enum Architecture Audit Report — Phase 12.29

**Platform:** AbarEnergy Commercial Solar Platform  
**Target:** Client-Side & Server-Side Dropdown Components (`src/components/ui/select.tsx`, `src/lib/enum-labels.ts`)  
**Phase:** 12.29 — Comprehensive UI/UX, Brand Identity, CMS, Security, SEO/GEO & Multilingual Readiness  
**Engineer Roles:** Senior Full-Stack Engineer & Frontend Architecture Specialist  
**Date:** 2026-10-29  

---

## 1. Problem Statement & Symptoms

Prior to Phase 12.29, multiple dropdown and select controls across admin and public views exhibited disruptive UX behavior:
1. **Initial English Display in Persian Views:** When opening an admin list (e.g., Articles, Products, Inquiries), filter dropdowns displayed raw technical English values (such as `draft`, `published`, `archived`, `commercial`, `super_admin`) instead of localized Persian labels (`پیش‌نویس`, `منتشر شده`, `بایگانی شده`, `تجاری`, `مدیر ارشد`).
2. **Selection Reversion Bug:** When a user clicked an option, the dropdown temporarily rendered the translated label, but immediately reverted to displaying the raw English key inside the closed select trigger.
3. **RTL Text Alignment Flaw:** The select trigger element had hardcoded `className="flex flex-1 text-left"`, forcing Persian and Arabic labels to align leftwards against the natural reading direction.

---

## 2. Root Cause Analysis (RCA)

Investigation into the underlying component tree revealed a fundamental limitation in the headless UI library `@base-ui-components/react/select`:
- The Base UI select component's `<SelectPrimitive.Value>` hook expects items to be supplied via an `items` array property on the root `<SelectPrimitive.Root>` to map internal values to display representations.
- Throughout the AbarEnergy codebase, `<SelectContent>` renders items declaratively via JSX children:
  ```tsx
  <Select value={status} onValueChange={setStatus}>
    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="draft">{t('status.draft')}</SelectItem>
      <SelectItem value="published">{t('status.published')}</SelectItem>
    </SelectContent>
  </Select>
  ```
- Because no `items` array was provided to the root primitive, Base UI's `<SelectPrimitive.Value>` defaulted to calling `String(value)`. When `value="draft"`, it literally printed `"draft"` inside the trigger.
- Furthermore, in Server-Side Rendering (SSR) and Hydration, this caused mismatch warnings whenever client state updated out-of-sync with the trigger text.

---

## 3. Architecture & Implementation Solution

To resolve this system-wide without requiring refactoring hundreds of form and filter files, a dual-layer architectural fix was designed:

### Layer 1: Authoritative Central Enum Dictionary (`src/lib/enum-labels.ts`)
Created a centralized translation and label resolution utility covering every enumeration across the platform:
- **User Roles:** `super_admin`, `website_admin`, `seo_manager`, `content_manager`, `analyst`, `customer`
- **Publication Statuses:** `draft`, `published`, `archived`
- **Inquiry Statuses:** `new`, `contacted`, `in_progress`, `quoted`, `resolved`, `closed`
- **Product Types:** `solar_panel`, `inverter`, `battery`, `mounting_structure`, `monitoring_device`, `cable_accessory`
- **Project & Service Categories:** `commercial_rooftop`, `industrial_rooftop`, `ground_mounted`, `solar_carport`, etc.
- **Locales:** `fa` (فارسی), `en` (English), `ar` (العربية)

```typescript
// Excerpt from src/lib/enum-labels.ts
export function getLocalizedEnumLabel(
  key: string,
  locale: Locale = 'fa',
  category?: 'role' | 'status' | 'product_type' | 'inquiry_status' | 'locale'
): string {
  // Deterministic lookup with graceful fallback
}
```

### Layer 2: Dynamic Select Registry Context (`src/components/ui/select.tsx`)
Added a lightweight React Context inside `Select` that allows child `<SelectItem>` components to register their rendered label upon mounting:

```tsx
// Excerpt from src/components/ui/select.tsx
interface SelectRegistry {
  registerLabel: (value: string, label: string) => void;
  getLabel: (value: string) => string | undefined;
}

const SelectItemRegistryContext = React.createContext<SelectRegistry | null>(null);

function Select({ ...props }: SelectProps) {
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  
  const registerLabel = React.useCallback((val: string, label: string) => {
    setLabels(prev => (prev[val] === label ? prev : { ...prev, [val]: label }));
  }, []);

  const getLabel = React.useCallback((val: string) => labels[val], [labels]);

  return (
    <SelectItemRegistryContext.Provider value={{ registerLabel, getLabel }}>
      <SelectPrimitive.Root {...props} />
    </SelectItemRegistryContext.Provider>
  );
}
```

### Layer 3: Enhanced `SelectValue` with Three-Tier Resolution
The updated `SelectValue` component resolves display text in three deterministic tiers:
1. **Tier 1 (Explicit Registry):** If an active `<SelectItem>` registered a label matching the current value, render that exact localized string.
2. **Tier 2 (Dictionary Lookup):** If the registry is empty (e.g. during SSR before children mount), query `getLocalizedEnumLabel(value, activeLocale)`.
3. **Tier 3 (Placeholder / Fallback):** If neither matches, render the provided `placeholder` or the raw string.

### Layer 4: RTL Logical Alignment
Replaced `className="flex flex-1 text-left"` with `className="flex flex-1 text-start"`. In RTL locales (FA, AR), text aligns rightwards; in LTR (EN), text aligns leftwards.

---

## 4. Verification & Testing Evidence

1. **Unit Testing (`src/components/ui/select-localization.test.tsx`):**
   - Verified that rendering `<Select value="draft">` in Persian renders `"پیش‌نویس"` immediately upon initial mount.
   - Verified that changing value to `"published"` updates the trigger text to `"منتشر شده"` without flashing `"published"`.
   - Verified that English locale displays `"Draft"` and `"Published"`.
2. **Regression Testing across Admin Screens:**
   - **Articles List:** Status filter displays `همه وضعیت‌ها`, `پیش‌نویس`, `منتشر شده`, `بایگانی شده`.
   - **Products Category Selector:** Dynamic category tree resolves parent and child titles in Persian without duplicating keys.
   - **User Management:** Role dropdown displays `مدیر ارشد`, `مدیر سایت`, `مدیر سئو`, etc.
   - **SEO Dashboard:** Keyword search intent dropdown displays `اطلاعاتی`, `تجاری`, `تراکنشی`, `ناوبری`.
3. **Hydration Integrity:** Verified Next.js console in development mode — **0 React hydration mismatch warnings**.

---

## 5. Conclusion
Dropdown localization is now structurally solved. Values sent to the backend API remain technical, immutable strings (`draft`, `super_admin`), while all user-facing labels are strictly localized, directionally aligned, and immune to display reversion.
