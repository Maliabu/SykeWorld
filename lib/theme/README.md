# Syke World Hotel Theme System

This directory contains the theme configuration for the Syke World Hotel website.

## Current Theme

The website currently uses a **custom dark theme** with the following characteristics:

- **Background**: `#212326` (dark gray)
- **Text**: White and stone shades (stone-300, stone-400)
- **Accent**: Amber/Orange (amber-600, amber-700)
- **Borders**: White with opacity (white/20, white/50, white/70)

## Theme Files

- `colors.ts` - Theme color definitions for both dark and light themes
- `light-theme-mapping.md` - Detailed color mapping guide
- `README.md` - This file

## Color Mappings

### Quick Reference

| Dark Theme | Light Theme |
|------------|-------------|
| `bg-[#212326]` | `bg-[#fafafa]` |
| `text-white` | `text-[#1a1c1e]` |
| `text-stone-300` | `text-gray-600` |
| `text-stone-400` | `text-gray-500` |
| `border-white/20` | `border-black/10` |
| `border-white/50` | `border-black/20` |
| `bg-white/5` | `bg-black/2` |
| `bg-white/10` | `bg-black/5` |
| `bg-black/70` | `bg-white/90` |

### Accent Colors (Unchanged)

- `bg-amber-600` → `bg-amber-600`
- `hover:bg-amber-700` → `hover:bg-amber-700`
- `text-amber-600` → `text-amber-600`

## Converting Pages to Light Theme

### Step 1: Background Colors
Replace all instances of:
- `bg-[#212326]` → `bg-[#fafafa]`
- `bg-white/5` → `bg-black/2`
- `bg-white/10` → `bg-black/5`
- `bg-black/70` → `bg-white/90`

### Step 2: Text Colors
Replace all instances of:
- `text-white` → `text-[#1a1c1e]`
- `text-stone-300` → `text-gray-600`
- `text-stone-400` → `text-gray-500`
- `text-white/70` → `text-black/60`

### Step 3: Border Colors
Replace all instances of:
- `border-white/20` → `border-black/10`
- `border-white/50` → `border-black/20`
- `border-white/70` → `border-black/30`
- `border-stone-700/50` → `border-gray-300/50`

### Step 4: Decorative Elements
Replace all instances of:
- `bg-white/50` (decorative lines) → `bg-black/20`
- `text-white/70` (labels) → `text-black/60`

### Step 5: Form Elements
- `border-white/20` → `border-black/20`
- `placeholder-stone-400` → `placeholder-gray-500`
- `border-gray-400/50` → Keep same or use `border-black/20`

## Example Conversion

### Dark Theme (Original)
```tsx
<section className="py-24 md:py-32 bg-[#212326]">
  <div className="text-center mb-16">
    <div className="flex items-center justify-center gap-3 mb-4">
      <div className="h-px w-12 bg-white/50"></div>
      <p className="text-xs uppercase tracking-widest text-white/70 font-medium">
        Our Amenities
      </p>
      <div className="h-px w-12 bg-white/50"></div>
    </div>
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
      Experience Luxury
    </h2>
    <p className="text-sm md:text-base text-stone-300 max-w-2xl mx-auto">
      Discover our elegant spaces
    </p>
  </div>
</section>
```

### Light Theme (Converted)
```tsx
<section className="py-24 md:py-32 bg-[#fafafa]">
  <div className="text-center mb-16">
    <div className="flex items-center justify-center gap-3 mb-4">
      <div className="h-px w-12 bg-black/20"></div>
      <p className="text-xs uppercase tracking-widest text-black/60 font-medium">
        Our Amenities
      </p>
      <div className="h-px w-12 bg-black/20"></div>
    </div>
    <h2 className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4">
      Experience Luxury
    </h2>
    <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
      Discover our elegant spaces
    </p>
  </div>
</section>
```

## Pages to Convert

The following pages use the dark theme and would need conversion:

1. `web/app/Home/page.tsx` - Homepage
2. `web/app/Home/Hero.tsx` - Hero section
3. `web/app/Home/Navbar.tsx` - Navigation bar
4. `web/app/Home/Footer.tsx` - Footer
5. `web/app/Home/Rooms.tsx` - Rooms section
6. `web/app/about/page.tsx` - About page
7. `web/app/rooms/page.tsx` - Rooms listing page
8. `web/app/booking/page.tsx` - Booking page
9. `web/app/gallery/page.tsx` - Gallery page
10. `web/app/kitchen/page.tsx` - Kitchen/Restaurant page
11. `web/app/roomservice/page.tsx` - Room services page
12. `web/app/visit/page.tsx` - Visit Paidha page

## Notes

- **Accent colors remain the same** in both themes (amber-600, amber-700)
- **Font families remain the same** (Cal Sans for headings, Inter for body)
- **Layout and structure remain the same** - only colors change
- **Images and content remain the same** - no content changes needed

## Implementation Strategy

1. **Option 1: Create separate light theme files** (e.g., `page.light.tsx`)
   - Pros: Easy to compare, can switch between themes
   - Cons: Code duplication, maintenance overhead

2. **Option 2: Use CSS variables and theme classes**
   - Pros: Single source of truth, easy theme switching
   - Cons: Requires refactoring all components

3. **Option 3: Use Tailwind's dark mode with custom classes**
   - Pros: Built-in support, conditional rendering
   - Cons: Requires configuration changes

## Current Status

- ✅ Dark theme colors documented
- ✅ Light theme colors defined
- ✅ Color mapping guide created
- ⏳ Light theme example page created (`web/app/Home/page.light.tsx`)
- ⏳ Full light theme conversion pending
