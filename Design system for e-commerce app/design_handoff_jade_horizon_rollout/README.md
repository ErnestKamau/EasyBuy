# Handoff: Jade Horizon design system — full app rollout

## Overview
EasyBuy already has a real design system implemented in code: **Jade Horizon** (`client/design/*` tokens + `client/components/ui/*` primitives — glass surfaces, buttons, badges, skeletons, etc). It is *not fully adopted* across the app yet. Six screens still hand-roll their own `StyleSheet.create` + raw hex-math colors instead of the token/primitive library. This handoff is the checklist to finish the rollout so every screen is visually and structurally consistent, in both light and dark mode.

This is **not a from-scratch design** — do not invent new colors, spacing, or components. Every token and component referenced below already exists in the repo at the paths given. The job is wiring, not designing.

## About the reference files
`reference/jade-horizon-dark.png` (and the live `Jade Horizon Design System.dc.html` if shared) is an HTML **style-guide reference** — it documents the tokens/components pixel-accurately but is not code to copy. Recreate what it shows using the app's own React Native components listed below.

## Fidelity
**High-fidelity.** Use exact token values from `client/design/tokens/*.ts` and `client/design/themes.ts` — they are the source of truth, already correct. Nothing here should be re-derived or approximated.

## Source of truth (already built — import, don't recreate)
- `client/design/tokens/primitives.ts` — jade/neutral/red/amber/blue ramps, spacing, radius, opacity, blur, iconSize
- `client/design/tokens/typography.ts` — Manrope (display/headings) + Inter (body), full type scale
- `client/design/tokens/elevation.ts` — `getElevationStyle(level, mode)`, elv100–elv900
- `client/design/tokens/motion.ts` — duration, easing, spring, pressScale, reduced-motion helpers
- `client/design/themes.ts` — `jadeLight` / `jadeDark`, `theme.colors.*`, `theme.glass[level]`
- `client/contexts/ThemeContext.tsx` — `useAppTheme()` hook, already wired everywhere
- `client/components/ui/*` — **the actual components to use in every screen below**: `Button`, `IconButton`, `FAB`, `Surface`, `Card`, `GlassSurface`, `GlassTabBar`, `Badge`, `StatusPill`, `Skeleton` / `SkeletonOrderRow` / `SkeletonProductCard` / `SkeletonList`, `Text`, `Input`, `Chip`, `Modal`, `EmptyState`, `Divider`, etc.

Screens that already do this correctly (use as the reference pattern): `client/app/onboarding.tsx`, `client/app/product/[id].tsx`, `client/app/order/track.tsx`, `client/app/(tabs)/index.tsx`, everything in `client/components/ui/`.

## Screens to migrate

### 1. `client/app/auth.tsx` (Login / Register / forgot-password / verification / success)
**Current state:** uses `useAppTheme()` for colors but hand-rolls every style in a local `createStyles()` — raw `TextInput` rows with manual icon padding, a plain `LinearGradient` background, no `GlassSurface`, no `Button`/`Input` primitives, hardcoded radii (28, 12, 16) instead of `theme.radius.*`.

**Target:**
- Wrap the whole screen background in the **horizon gradient**: `theme.colors.horizonStart → horizonEnd` (dark) / `horizonStart → background` (light), vertical, `LinearGradient` from `(0, 0)` to `(0, 0.55)` — already partially there, keep it, don't remove it.
- Replace the hand-rolled `formContainer` box with `<Surface variant="glass" glassLevel={3} radius="xl" padding={5}>` (or `GlassSurface level={3}`) instead of the manual `rgba(35,46,39,0.85)` background — this is exactly what `GlassSurface` level 3 already produces on this gradient.
- Replace every `TextInput` row with the existing `Input` component from `components/ui/Input.tsx` (it already supports left icon + secure-entry eye toggle — check its props before adding new ones).
- Replace the primary/Google buttons with `<Button variant="primary">` / `<Button variant="secondary">` from `components/ui/Button.tsx` instead of custom `TouchableOpacity` + `styles.primaryButton`.
- Use `theme.spacing[*]` and `theme.radius.*` for all padding/margins/radii currently hardcoded as raw numbers.
- Keep all copy exactly as-is ("Login Account", "Welcome Back!", "Create Account", "Sign up to continue", etc.) — only the styling layer changes.

### 2. `client/app/admin.tsx`
**Current state:** imports `Theme` type from the now-deprecated `@/constants/Themes` re-export; every card/row/modal is a raw `View`/`Text` with inline `{ backgroundColor: currentTheme.surface, ... }`, ad hoc shadows (`shadowOpacity: 0.1` hardcoded instead of `theme.getElevation('elv200')`), and manual opacity hacks like `currentTheme.primary + '20'` instead of `theme.colors.primaryMuted`.

**Target:**
- Swap `import { Theme } from "@/constants/Themes"` for `import { AppTheme } from "@/design"` (or keep using `useAppTheme()` return type directly).
- Every stat/metric card → `<Card>` or `<Surface variant="elevated">` from `components/ui/Surface.tsx`.
- Every order/driver row → reuse `OrderRow` (`components/ui/OrderRow.tsx`) or `ListItem` where the shape matches, instead of the bespoke `itemCard` styles at line ~3539.
- Order/delivery status anywhere in admin → `<StatusPill status={...} />` from `Badge.tsx` (it already maps `pending/preparing/delivering/delivered/cancelled/processing/ready/picked_up` to label+icon+tone) instead of manual color-only badges.
- Replace every `currentTheme.primary + '20'` / `+ '10'` / `+ '15'` pattern with the matching muted token: `theme.colors.primaryMuted`, `theme.colors.successMuted`, `theme.colors.dangerMuted`, `theme.colors.infoMuted`, `theme.colors.warningMuted`.
- Replace raw `shadowColor/shadowOffset/shadowOpacity/shadowRadius/elevation` blocks with `theme.getElevation('elv200')` (cards), `elv400` (modals/sheets).
- The "Assign Driver" modal (~line 3520) → `<Modal>` from `components/ui/Modal.tsx` (already `GlassSurface level={4}`), driver rows → `ListItem`/`Avatar`.
- Low-stock / inventory list rows → same stock-bar + `StatusPill` pattern documented in the reference file's "Admin — Inventory" card.
- This is the biggest file (160KB) — migrate section by section (Dashboard → Inventory → Dispatch/map modal → Driver assignment), verifying each against the reference screenshots before moving to the next.

### 3. `client/app/checkout.tsx`
**Current state:** same pattern — `Theme` type import, raw `View` rows for delivery-method toggle, payment-method toggle, pickup-slot modal, all styled with inline `currentTheme.*` and hardcoded radii/paddings.

**Target:**
- Delivery method (`pickup` / `delivery`) and payment method (`mpesa` / `card`) toggles → `SegmentedControl` or `Chip` (selectable) from `components/ui/`, using `theme.colors.primary` for the selected state exactly as those components already implement it — don't hand-roll the `selected ? primary : textSecondary` conditional inline.
- Order summary card → `<Surface variant="elevated">` with `Text` typography roles (`title`, `body`, `bodySmall`) instead of raw `styles.summaryValue` etc.
- Pickup time-slot modal and map modal → `<Modal>` (glass level 4), slot rows → `ListItem` with a `StatusPill`/check icon for the selected slot instead of the manual `borderLeftColor` highlight.
- Primary CTA ("Place order" / pay button) → `<Button variant="primary" fullWidth loading={...}>`.

### 4. `client/app/awaiting-pickup.tsx`
**Current state:** `Theme` type import, custom QR display, manual `TextInput` fields, raw success icon treatment.

**Target:**
- QR/verification card → `Surface variant="glass" glassLevel={2}` (matches the reference file's tracking-card treatment).
- Success state (`CheckCircle` + text) → follow the same "celebration" pattern as `account-created` / `password-changed` in `auth.tsx`: horizon-gradient background + centered glass card, per the reference file's "Where the horizon gradient belongs" section (auth, onboarding, celebration states only).
- Replace manual `TextInput`s with `Input`.

### 5. `client/app/wallet/history.tsx`
**Current state:** `Theme` type import; transaction rows are raw `View`s with manual `ArrowDownLeft`/`ArrowUpRight` icon + `currentTheme.success`/`error` + `'20'` opacity-suffix background hack.

**Target:**
- Transaction rows → `ListItem` with a leading icon-in-circle using `theme.colors.successMuted`/`dangerMuted` as the circle background (not the `+ '20'` string hack) and `theme.colors.success`/`error` for the icon/amount text — mirrors the reference file's "Wallet & Payments" card exactly (credit rows in success green, debit rows muted).
- Balance header → the gradient card style from the reference file (`primary → secondary` diagonal gradient, white text) if wallet has a balance header; otherwise a `Surface variant="elevated"`.
- Empty state (no transactions) → `EmptyState` component.

### 6. `client/app/rider.tsx`
**Current state:** entirely custom `StyleSheet.create`, no glass, no `Card`/`Button`/`Badge` usage at all — the least-migrated screen.

**Target:**
- Order cards → `Card` (`components/ui/Surface.tsx`) with `StatusPill` for order status.
- "Go online/offline" toggle + the offline overlay → `GlassSurface level={2}` overlay (matches `GlassTabBar`'s floating-chrome treatment) instead of `currentTheme.surface + 'F0'`.
- Location card → `Surface variant="elevated"`.
- Action buttons (call, navigate) → `IconButton` instead of raw `circleButton` Views.
- Primary "Go Online" button → `<Button variant="primary" fullWidth>`.

## Interactions & behavior (apply everywhere, per `client/design/tokens/motion.ts`)
- Button/card press → `pressScale` (0.97) via `withTiming(duration.fast)`, already implemented in `Button.tsx` — reuse it, don't reinvent per-screen press animations.
- List/skeleton loading states → `SkeletonOrderRow` / `SkeletonProductCard` / `SkeletonList` instead of a bare spinner, for admin lists, checkout summary, wallet history, rider order list.
- Respect `getReducedMotion()` / `subscribeReducedMotion()` already in `motion.ts` for any new animated element.

## Design tokens (reference only — already correct in repo, do not redefine)
- Brand ramp: `jade.50 #F2F9F4 → jade.950 #081A15`, anchors 200 `#B7E5BA`, 400 `#5CA87C`, 500 `#288760`, 700 `#1A5140`
- Neutrals are green-tinted, never pure black/white (`neutral.0 #FFFFFF` → `neutral.1000 #060D0A`)
- Type: Manrope (display/h1/h2/h3/title, weights 600–800) / Inter (body/label/button/caption, weights 400–600)
- Spacing scale: 0,2,4,8,12,16,20,24,32,40,48,64,80,96 (indices 0–13)
- Radius: xs 6 · sm 10 · md 14 · lg 20 · xl 28 · 2xl 36 · pill/circle 9999
- Glass levels 0–5: blur 0/12/24/36/48/64, tint + border + top highlight per `themes.ts`'s `makeGlassRecipes()` — level 2 for tab bars/inline chrome, level 3 for buttons/modals-lite, level 4 for full modals
- Elevation elv100–elv900: dark mode uses surface-contrast + lower-opacity shadow, not heavier shadow — never hand-write `shadowOpacity` on new code

## Assets
- `reference/jade-horizon-dark.png` — the token/component style guide (dark mode) for visual comparison while migrating.
- Existing repo mood images at `images/` (`jadehorizon.jpeg`, `darkmode glassmorphism.jpeg`, `tracking.jpeg`) are the original inspiration references, already in the repo.

## Files in this package
- `README.md` — this file
- `reference/jade-horizon-dark.png` — style guide screenshot (dark mode)

## Suggested order of work
1. `auth.tsx` (smallest surface area, highest visual impact — login is the first thing every user sees)
2. `wallet/history.tsx` and `awaiting-pickup.tsx` (small, quick wins)
3. `rider.tsx` (medium, no prior migration at all)
4. `checkout.tsx`
5. `admin.tsx` last (largest file — do it in sections, verify against the reference screenshots as you go)
