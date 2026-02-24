# Glass / Liquid Surface Architecture — Debug Checklist

## Why Aurora Might Not Be Visible

Use this checklist whenever the Aurora background (Layer 0) isn't showing through.

---

### 1. Root Element Has Opaque Background

**Check:** Does `<html>`, `<body>`, or the outermost `<div>` have a **solid** `background-color`?

```css
/* ✗ BAD — blocks Aurora */
body { background-color: #000; }
body { background: #0f172a; }
.root { @apply bg-background-default; }  /* if variable resolves to opaque */

/* ✓ GOOD */
body { background: transparent; }
```

**Fix:** Ensure `body` has `background: transparent` (set in `index.css` and `index.html`).

---

### 2. Layout Wrapper Uses Opaque Tailwind Class

**Check:** The Layout root `<div>` must NOT use `bg-background-default` or any opaque colour.

```tsx
/* ✗ BAD */
<div className="bg-background-default ...">

/* ✓ GOOD */
<div className="bg-transparent ...">
```

**Fix:** In [Layout.tsx](../src/components/layout/Layout.tsx), the root uses `bg-transparent`.

---

### 3. Aurora Is Not Rendered or Has Zero Blend

**Check:** The `<Aurora>` component must be mounted with `blend > 0`.

```tsx
<Aurora colorStops={colorStops} blend={0.18} ... />
```

**Fix:** Verify `blend` prop is > 0 (typically 0.12 light / 0.18 dark).

---

### 4. Aurora Is Behind a Stacking Context That Blocks It

**Check:** Aurora should be `position: fixed; inset: 0; z-index: 0`.
Content wrapper should be `position: relative; z-index: 10`.

```tsx
{/* Layer 0 */}
<div className="fixed inset-0 z-0 pointer-events-none">
  <Aurora ... />
</div>

{/* Layers 1+2 */}
<div className="relative z-10 ...">
  ...content...
</div>
```

**Fix:** Confirm both z-index values in Layout.tsx.

---

### 5. Glass Surfaces Have Too-High Opacity

**Check:** Glass backgrounds must use low alpha values, not opaque fills.

| Mode  | Correct α range | Example                       |
|-------|----------------|-------------------------------|
| Dark  | 0.04 – 0.12   | `rgba(255,255,255,0.06)`      |
| Light | 0.40 – 0.60   | `rgba(255,255,255,0.55)`      |

```css
/* ✗ BAD */
background: rgba(0,0,0,0.9);
background: #1e293b;

/* ✓ GOOD */
background: rgba(255,255,255,0.06);  /* dark */
background: rgba(255,255,255,0.55);  /* light */
```

**Fix:** Review `.glass-surface`, `.glass-navbar`, `.glass-sidebar` in `index.css`.

---

### 6. A Parent Has `overflow: hidden` Clipping Aurora

**Check:** No ancestor between Aurora and viewport should clip it.

**Fix:** Aurora's parent uses `fixed inset-0` so it escapes normal flow. But if a parent has `transform`, `filter`, or `will-change`, it creates a new stacking context. Remove those from Aurora's ancestors.

---

### 7. Dark Mode Not Activated

**Check:** The `<html>` element needs `class="dark"` for dark-mode styles.

**Fix:** Confirm ThemeContext adds/removes the class, and the inline `<script>` in `index.html` handles flash prevention.

---

### 8. CSS Variables Not Being Set

**Check:** Open DevTools → Elements → `<html>` → inspect `style` attribute. You should see:

```
--color-primary: 25 95% 53%;
--color-primary-rgb: 249, 115, 22;
--color-primary-light: ...
--color-primary-dark: ...
```

**Fix:** Ensure `ThemeProvider` is wrapping the Layout and `generateCSSVariables()` runs on mount.

---

## Layer Architecture Quick Reference

| Layer | Z-Index | Purpose                     | Transparency         |
|-------|---------|-----------------------------|----------------------|
| 0     | 0       | Aurora background           | Visible, always      |
| 1     | 10      | Layout containers           | Mostly solid (α 0.04–0.12 dark) |
| 2     | 10+     | Interactive glass elements  | Semi-transparent + blur |

## Primary Colour Rules

✅ **Use for:** focus ring, active glow, outline border, gradient highlight, selection  
❌ **Never use for:** large opaque backgrounds, page backgrounds, sidebar solid fill

---

## Tailwind Config Key Points

- `darkMode: "class"` — controlled via `<html class="dark">`
- Colours use HSL triplets: `hsl(var(--color-primary) / <alpha-value>)`
- `--color-primary-rgb` exposed for `rgba()` in glass box-shadows
- `tailwindcss-animate` plugin for shadcn enter/exit animations
- `--radius: 0.75rem` for shadcn border-radius tokens
