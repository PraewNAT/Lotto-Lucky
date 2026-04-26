# Lotto Lucky — DESIGN.md

Linear-inspired light theme adapted for a Thai lottery prediction app.
Ultra-minimal, precise, purple accent. Reading-optimized, information-dense.

---

## 1. Visual Theme & Atmosphere

- **Mood**: Calm, focused, trustworthy. Numbers and predictions as the hero.
- **Density**: Medium-high. Tight type, narrow gutters, small components.
- **Philosophy**: Subtraction over decoration. Every pixel earns its place.
- **Personality**: Modern Thai consumer fintech — minimalist but warm enough to feel approachable.

---

## 2. Color Palette & Roles

### Surfaces
| Token | Hex | Role |
|-------|-----|------|
| `bg` | `#FBFBFD` | Page background — soft off-white, never pure white |
| `surface` | `#FFFFFF` | Cards, panels, raised surfaces |
| `surface-2` | `#F4F5F8` | Inset blocks, code, muted rows |
| `surface-3` | `#EDEEF1` | Hover for muted rows |

### Text
| Token | Hex | Role |
|-------|-----|------|
| `text` | `#08090A` | Primary headings, numbers |
| `text-secondary` | `#3C3F44` | Body copy |
| `text-muted` | `#6B6F76` | Captions, helper text |
| `text-subtle` | `#9094A0` | Disabled, placeholder |

### Borders
| Token | Hex | Role |
|-------|-----|------|
| `border` | `#E6E7EB` | Default 1px borders |
| `border-strong` | `#D0D2D8` | Inputs, dividers needing emphasis |
| `border-subtle` | `#EFF0F3` | Internal dividers in cards |

### Accent (Linear-purple)
| Token | Hex | Role |
|-------|-----|------|
| `accent` | `#5E6AD2` | Primary buttons, links, active states |
| `accent-hover` | `#4F5BC4` | Hover for accent |
| `accent-soft` | `#EEF0FB` | Tinted backgrounds, selected chips |
| `accent-text` | `#3D47A6` | Text on accent-soft |

### Semantic
| Token | Hex | Role |
|-------|-----|------|
| `success` | `#22A06B` | Win, hit, correct |
| `success-soft` | `#E6F5EE` | Success backdrop |
| `warning` | `#D9851A` | Disclaimers |
| `warning-soft` | `#FCF0DC` | Warning backdrop |
| `danger` | `#D24A56` | Errors |
| `danger-soft` | `#FBE9EB` | Error backdrop |

### Heatmap scale (used in stats)
- 0% → `#F4F5F8`
- 50% → `#C8CCE6`
- 100% → `#5E6AD2`

---

## 3. Typography Rules

- **Body / UI font**: `"Inter", "Prompt", system-ui, sans-serif` (Inter for Latin, Prompt for Thai — Next.js loads both)
- **Numeric font**: `"Geist Mono", "JetBrains Mono", ui-monospace, monospace` for lottery numbers
- **Letter-spacing**: tight (-0.01em on body, -0.02em on display)
- **Weights used**: 400, 500, 600. Never 700+ (Linear avoids heavy weights)

| Style | Size | Weight | LH | Tracking | Use |
|-------|------|--------|----|----------|-----|
| Display | 32–40px | 600 | 1.1 | -0.02em | Page H1 |
| Title | 20–24px | 600 | 1.2 | -0.015em | Section H2 |
| Subtitle | 16–18px | 500 | 1.3 | -0.01em | Card H3 |
| Body | 14px | 400 | 1.5 | -0.005em | Default |
| Small | 13px | 400 | 1.45 | 0 | Helper text |
| Caption | 12px | 500 | 1.4 | 0 | Labels, eyebrows |
| Eyebrow | 11px | 500 | 1.3 | 0.04em uppercase | Section eyebrow |
| Lottery (lg) | 40–48px | 500 mono | 1 | 0.18em | 6-digit hero |
| Lottery (md) | 22–26px | 500 mono | 1 | 0.16em | 3/2-digit chips |

---

## 4. Component Stylings

### Buttons
- **Primary**: bg `accent`, text white, 36–40px tall, radius 8px, font-weight 500, font-size 14px, padding 0 14px. Hover → `accent-hover`. Active → 0.96 scale. No gradient, no shadow.
- **Secondary**: bg `surface`, border 1px `border`, text `text`, same dimensions. Hover → bg `surface-2`.
- **Ghost**: bg transparent, text `text-secondary`, no border. Hover → bg `surface-2`.
- **Sizes**: sm (28px), md (36px default), lg (44px).
- **Disabled**: opacity 0.5, cursor not-allowed.

### Cards
- bg `surface`, border 1px `border`, radius 12px, padding 20–24px.
- No shadow by default. On interactive cards: hover → border `border-strong`, transform translateY(-1px).
- Inner divider: 1px `border-subtle`, no margin gutters wider than 16px.

### Inputs
- 36–40px tall, radius 8px, border 1px `border-strong`, bg `surface`, padding 0 12px.
- Focus → border `accent`, box-shadow `0 0 0 3px rgba(94, 106, 210, 0.18)`.
- Placeholder color `text-subtle`.

### Chips / Pills (selectable)
- 28–32px tall, radius 9999px, border 1px `border`, padding 0 12px, font-size 13px.
- Selected: bg `accent-soft`, border `accent`, text `accent-text`.
- Unselected: bg `surface`, text `text-secondary`. Hover → bg `surface-2`.

### Tables / Rows
- Row height 40–44px, border-bottom 1px `border-subtle`.
- Header text: `eyebrow` style, color `text-muted`.

### Lottery number block (custom, hero)
- bg `surface`, border 1px `border`, radius 12px, padding 24px.
- Number: lottery-lg style, color `text`, kerning 0.18em, character grouping `XX XX XX`.
- 3/2-digit subblocks: 3-column grid, radius 8px, bg `surface-2`, padding 12px, mono font.

### Score bar
- 4–6px tall, radius 9999px, track `surface-2`, fill solid `accent`.
- No gradient. Numeric label right-aligned in `text-muted`.

### Heatmap cell
- 28–32px square, radius 4px, color from heatmap scale, mono 11px label.
- Active cell: ring 2px `accent`, scale 1.05.

### Navigation
- Header: 56px tall, bg `surface` with `backdrop-filter: blur(8px)` at 80% opacity, border-bottom 1px `border`.
- Logo: text-only or simple mark + wordmark. 14px / weight 600.
- Nav items: 13px / weight 500, padding 6–10px, radius 6px. Active → bg `accent-soft`, text `accent-text`.

---

## 5. Layout Principles

- **Spacing scale**: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80 (px). Avoid arbitrary values.
- **Grid**: Max content width 1120px (`max-w-6xl` ≈ 1152, close enough). 16px gutter mobile, 24px desktop.
- **Card gap**: 16px standard. Section gap: 32–40px.
- **Whitespace**: generous around hero, tight inside dense components (heatmap, tables).
- **Alignment**: left-aligned by default. Center only for hero numbers.

---

## 6. Depth & Elevation

Linear avoids heavy shadows. Use border + subtle shadow:

- **Flat (default)**: border 1px `border`, no shadow.
- **Raised** (sticky header, modals): `0 1px 2px rgba(8, 9, 10, 0.04), 0 4px 12px rgba(8, 9, 10, 0.04)`.
- **Floating** (popover, toast): `0 8px 24px rgba(8, 9, 10, 0.08)`.

Never use colored glows. Never use blur > 24px.

---

## 7. Do's and Don'ts

**Do:**
- Use 1px borders to separate, not shadows.
- Use the single accent color sparingly — only for primary action and current state.
- Keep numbers monospaced and tracked, so columns align visually.
- Show loading with a 1px shimmer on `surface-2`, never spinners over content.
- Use `text-muted` for everything secondary; let primary text breathe.

**Don't:**
- ❌ Don't use gradients on buttons or surfaces (Linear is flat).
- ❌ Don't use rounded-full on buttons (only on chips and avatars).
- ❌ Don't use bold weights > 600.
- ❌ Don't add emoji decoration to UI chrome (✅ for status only).
- ❌ Don't introduce a second accent color for variety — use opacity/value instead.
- ❌ Don't use pure white `#FFFFFF` for the page bg — always slightly off.

---

## 8. Responsive Behavior

- **Breakpoints**: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Match Tailwind defaults.
- **Touch targets**: 40px minimum on mobile.
- **Header**: collapses to scrollable horizontal pill nav on mobile (already implemented).
- **Cards**: stack to single column < 768px, 2 columns 768–1024, up to 3 columns above.
- **Tables**: become card-stack lists < 640px.
- **Heatmap**: keep 10×10 even on mobile, cell size shrinks to 24px.

---

## 9. Agent Prompt Guide

**Quick color reference:**
- bg `#FBFBFD` · surface `#FFFFFF` · text `#08090A` · accent `#5E6AD2` · border `#E6E7EB`

**Prompt template for new feature:**
> Build a [feature] page for Lotto Lucky. Use the Linear-inspired light theme:
> off-white page background, white cards with 1px `#E6E7EB` borders, no shadows.
> Primary action uses purple `#5E6AD2`. Numbers use monospace, 0.18em tracking.
> Headings 20–24px / weight 600 / tight tracking. Body 14px / weight 400.
> Spacing in 4-8-12-16-24-32 increments. Max content width 1120px.

---
