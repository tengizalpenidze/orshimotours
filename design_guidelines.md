# Orshimo Tours - Design Guidelines

## Design Approach
**Reference-Based Approach** inspired by Airbnb's visual-first travel aesthetic combined with Booking.com's booking confidence patterns. The design prioritizes emotional engagement through stunning tour imagery while maintaining booking functionality clarity.

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- Brand Primary: 240 65% 25% (Deep Georgian Wine/Purple - evokes heritage and luxury)
- Brand Secondary: 195 85% 45% (Turquoise - represents Georgia's Black Sea coast)

**Dark Mode:**
- Background: 240 15% 8%
- Surface: 240 12% 12%
- Card: 240 10% 15%
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 70%

**Light Mode:**
- Background: 0 0% 99%
- Surface: 0 0% 100%
- Card: 0 0% 97%
- Text Primary: 240 15% 15%
- Text Secondary: 240 8% 45%

**Functional:**
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 84% 60%

### B. Typography

**Font Stack:**
- Headings: 'Playfair Display' (serif) - elegant, travel-magazine feel
- Body: 'Inter' (sans-serif) - clean readability
- Accent/CTAs: 'Inter' medium/semibold

**Hierarchy:**
- Hero Title: text-5xl md:text-7xl, font-bold
- Section Headings: text-3xl md:text-5xl
- Tour Card Titles: text-xl md:text-2xl
- Body Text: text-base md:text-lg
- Captions: text-sm

### C. Layout System

**Spacing Primitives:** Tailwind units 4, 6, 8, 12, 16, 20, 24
- Micro spacing (elements): 4, 6
- Component spacing: 8, 12
- Section spacing: 16, 20, 24

**Container Strategy:**
- Max-width: max-w-7xl
- Padding: px-4 md:px-8 lg:px-12

### D. Component Library

**Hero Section (Full Viewport):**
- Dynamic carousel background with tour cover images (h-screen)
- Gradient overlay: from-black/60 via-black/40 to-transparent
- Centered content with search functionality
- Glass-morphism search card (backdrop-blur-xl, bg-white/10 dark:bg-black/20)
- Animated text reveal on load

**Navigation:**
- Sticky header with blur background (backdrop-blur-md)
- Logo left, menu center, booking CTA right
- Mobile: hamburger menu with slide-in drawer
- Shadow on scroll: shadow-lg transition

**Tour Cards (Grid Layout):**
- 1 column mobile, 2 tablet, 3 desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
- Aspect ratio 4:3 images with rounded-2xl
- Overlay gradient on hover: from-transparent to-black/50
- Price badge: absolute top-4 right-4, glass-morphism
- Quick info icons: duration, group size, difficulty

**Featured Tours Section:**
- Asymmetric layout: Large featured card (2/3 width) + 2 stacked smaller cards (1/3 width)
- Parallax scroll effect on images
- "Best Seller" and "New" badges with subtle animations

**Booking Flow:**
- Stepped progress indicator (4 steps: Tour > Date > Travelers > Payment)
- Sticky summary sidebar on desktop
- Floating CTA button on mobile
- Calendar with price indicators per date

**Testimonials:**
- Carousel with customer photos
- Star ratings with animated fill
- 2-column layout on desktop, single on mobile
- Profile images circular with border-4 border-primary

**Footer:**
- 4-column layout (desktop): About, Tours, Support, Newsletter
- Social media icons with hover scale effect
- Newsletter signup with gradient button
- Trust badges: secure payment, verified reviews

**Filters & Search:**
- Sidebar on desktop (sticky), bottom sheet on mobile
- Multi-select tags with active state glow
- Price range slider with dual handles
- "Apply Filters" button fixed at bottom

### E. Animations & Interactions

**Page Transitions:**
- Fade-in on scroll (intersection observer pattern)
- Stagger children animation for card grids (50ms delay each)

**Micro-interactions:**
- Button: scale-95 on active, subtle shadow lift on hover
- Cards: scale-102 transform on hover, shadow-2xl
- Images: ken-burns zoom effect (scale-110 over 10s)

**Scroll Effects:**
- Parallax backgrounds at 0.5x scroll speed
- Sticky section headers with fade-in titles
- Progress bar at top showing scroll percentage

## Images Section

**Hero Image:**
- Large full-screen carousel (1920x1080 minimum)
- 4-6 rotating tour cover images: Kazbegi mountains, Tbilisi old town, wine regions, Black Sea coast, Svaneti towers, Georgian feast
- Auto-rotate every 6 seconds with crossfade transition
- Touch/swipe enabled on mobile

**Tour Cards:**
- 800x600 aspect ratio images
- Categories: Mountain Adventures, Cultural Tours, Wine & Gastronomy, Coastal Escapes
- Mix of landscape and activity photos

**Featured Section:**
- 1200x800 large feature image (top-rated tour)
- 600x800 portrait images for secondary features

**Testimonial Photos:**
- Circular customer photos (200x200)
- Authentic travel moments, diverse international guests

**Trust Section:**
- Georgia landscapes as subtle backgrounds (30% opacity)
- Georgian cultural elements (traditional patterns) as decorative accents

**Category Icons:**
- Use Heroicons for: map-pin, calendar, users, clock, star, shield-check, camera, hiking

## Mobile-First Considerations

**Touch Targets:** Minimum 48px height for all interactive elements
**Typography Scale:** Base 16px mobile, 18px desktop
**Images:** Lazy load with blur placeholder, webp format with fallbacks
**Navigation:** Bottom tab bar for main actions on mobile
**Cards:** Full-bleed images on mobile, contained with padding on desktop
**Spacing:** Reduce by 25% on mobile (if section is py-20, mobile is py-12)

## Accessibility & Performance

- Maintain 4.5:1 contrast ratios in both modes
- Focus rings: ring-4 ring-primary/50
- Image alt texts for all tour photos
- Skeleton loaders during content fetch
- Reduced motion respect: prefers-reduced-motion query