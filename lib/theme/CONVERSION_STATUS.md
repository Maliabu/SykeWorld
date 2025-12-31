# Light Theme Conversion Status

## ✅ Converted Files
1. **web/app/Home/page.tsx** - Homepage (✅ Complete)
2. **web/app/Home/Hero.tsx** - Hero section (✅ Complete)
3. **web/app/Home/Navbar.tsx** - Navigation bar (✅ Complete - may need sidebar close button check)
4. **web/app/Home/Footer.tsx** - Footer (✅ Complete - footer cards converted)
5. **web/app/Home/Rooms.tsx** - Rooms section (✅ Complete)
6. **web/app/(forms)/BookingForm.tsx** - Booking form (✅ Complete)

## ⏳ Remaining Files to Convert
1. **web/app/about/page.tsx** - About page
2. **web/app/rooms/page.tsx** - Rooms listing page
3. **web/app/booking/page.tsx** - Booking page
4. **web/app/gallery/page.tsx** - Gallery page
5. **web/app/kitchen/page.tsx** - Kitchen/Restaurant page
6. **web/app/roomservice/page.tsx** - Room services page
7. **web/app/visit/page.tsx** - Visit Paidha page

## Conversion Pattern

Use these search/replace patterns:

### Background Colors
- `bg-[#212326]` → `bg-[#fafafa]`
- `bg-white/5` → `bg-black/2`
- `bg-white/10` → `bg-black/5`
- `bg-black/70` → `bg-white/90`

### Text Colors
- `text-white` → `text-[#1a1c1e]`
- `text-stone-300` → `text-gray-600`
- `text-stone-400` → `text-gray-500`
- `text-white/70` → `text-black/60`
- `text-white/50` → `text-black/50` (for decorative elements)

### Border Colors
- `border-white/20` → `border-black/10`
- `border-white/50` → `border-black/20`
- `border-white/70` → `border-black/30`
- `border-stone-700/50` → `border-gray-300/50`

### Decorative Elements
- `bg-white/50` (decorative lines) → `bg-black/20`
- `bg-white/70` (labels) → `bg-black/60`

### Placeholder Colors
- `placeholder-stone-400` → `placeholder-gray-500`

## Notes
- Accent colors (amber-600, amber-700) remain unchanged
- Font families remain unchanged
- Layout and structure remain unchanged - only colors change
