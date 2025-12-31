# Light Theme Color Mapping

This document maps the dark theme colors to their light theme equivalents.

## Color Mappings

### Backgrounds
- `bg-[#212326]` (dark) → `bg-[#fafafa]` (light)
- `bg-white/5` (dark) → `bg-black/2` (light)
- `bg-white/10` (dark) → `bg-black/5` (light)
- `bg-black/70` (dark) → `bg-white/90` (light)

### Text Colors
- `text-white` (dark) → `text-[#1a1c1e]` (light)
- `text-stone-300` (dark) → `text-gray-600` (light)
- `text-stone-400` (dark) → `text-gray-500` (light)
- `text-stone-500` (dark) → `text-gray-400` (light)
- `text-white/70` (dark) → `text-black/60` (light)

### Borders
- `border-white/20` (dark) → `border-black/10` (light)
- `border-white/50` (dark) → `border-black/20` (light)
- `border-white/70` (dark) → `border-black/30` (light)
- `border-stone-700/50` (dark) → `border-gray-300/50` (light)

### Accent Colors (Same for both themes)
- `bg-amber-600` → `bg-amber-600` (unchanged)
- `hover:bg-amber-700` → `hover:bg-amber-700` (unchanged)
- `text-amber-600` → `text-amber-600` (unchanged)

### Form Elements
- `border-white/20` (dark) → `border-black/20` (light)
- `border-gray-400/50` (dark) → `border-gray-400/50` (light) (can stay same or use `border-black/20`)
- `placeholder-stone-400` (dark) → `placeholder-gray-500` (light)
- `bg-transparent` → `bg-transparent` (unchanged)

### Decorative Elements
- `bg-white/50` (decorative lines) → `bg-black/20` (light)
- `text-white/70` (labels) → `text-black/60` (light)

## Implementation Notes

1. All amber/orange accent colors remain the same in both themes
2. Background and text colors are inverted
3. Border opacities are adjusted but maintain similar visual weight
4. Card backgrounds use subtle shadows in light theme instead of light overlays
