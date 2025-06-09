# SPACE Terminal - Design Aesthetic Principles

## Core Visual Identity

### Color Palette
**Primary Colors:**
- **Matrix Green**: `#00ff00` - Primary accent, buttons, highlights
- **Terminal Green**: `#22c55e` (green-500), `#16a34a` (green-600) - Secondary actions
- **Black Background**: `#000000` - Primary background for terminal aesthetic

**Theme Support:**
- **Dark Mode**: Black backgrounds with green accents
- **Light Mode**: Cream backgrounds (`#f5f0e8`, `#f0e6d2`) with green accents
- **Gray Scale**: `#1a1a1a`, `#374151`, `#6b7280` for borders and secondary text

### Typography
**Primary Font:** Vollkorn (serif) - Imported via `@fontsource/vollkorn`
- Provides sophisticated, readable text
- Used for main content and messaging
- Maintains terminal feel while being approachable

**System Fonts:** Fallback to system monospace for code/terminal elements

### Visual Language

#### Terminal Aesthetic
- **Monospace elements** for actual terminal interactions
- **Border styling**: `border-green-400`, `border-green-600` for primary containers
- **Rounded corners**: `rounded-lg` for modals, `rounded-full` for buttons
- **Matrix-inspired**: Green-on-black color scheme as primary theme

#### Modern Interface Elements
- **Glass morphism**: Subtle `bg-opacity` layers in modals
- **Transitions**: Smooth `transition-colors` on interactive elements
- **Hover states**: Green highlights on buttons and links
- **Focus states**: Green borders for accessibility

#### Layout Principles
- **Fixed positioning**: Bottom corners for persistent UI (settings, info)
- **Flexbox layouts**: For responsive, centered content
- **Z-index layering**: `z-50` for modals, `z-40` for overlays
- **Responsive spacing**: `p-4`, `p-6`, `mx-4` for consistent padding

## Component Patterns

### Buttons
**Primary Action:**
```css
bg-green-400 text-black hover:bg-green-300
```

**Secondary Action:**
```css
border border-green-400 text-green-400 hover:bg-green-400 hover:text-black
```

**Icon Buttons:**
```css
w-8 h-8 rounded-full bg-black border border-green-400 text-green-400
```

### Modals
**Structure:**
- `fixed inset-0` overlay with backdrop blur
- `max-w-*` containers with `mx-4` margins
- `border border-green-600` with `rounded-lg`
- `max-h-[90vh] overflow-hidden flex flex-col` for scrollable content

**Headers:**
- Green accent titles (`text-green-400`)
- Close buttons in top-right
- Optional back navigation for sub-views

### Typography Hierarchy
- **H1**: `text-green-400 text-xl font-semibold` - Primary headings
- **H2**: `text-green-400 text-lg font-semibold` - Section headings  
- **H3**: `text-green-400 font-medium` - Subsection headings
- **Body**: `text-gray-600 dark:text-gray-300` - Primary content
- **Small**: `text-xs text-gray-500` - Supporting information

### Lists and Content
- **Bullet points**: Use `•` character with green accent
- **Code blocks**: `bg-gray-200 dark:bg-gray-800` backgrounds
- **Links**: `text-green-600 dark:text-green-400 hover:underline`
- **Borders**: `border-gray-300 dark:border-gray-600` for content separation

## Animation and Interaction

### Micro-interactions
- **Button hovers**: Color inversion (green background ↔ green text)
- **Icon animations**: Subtle scale or color changes
- **Modal entrances**: Fade-in overlays
- **Form feedback**: Color changes for validation states

### Accessibility
- **High contrast**: Green-on-black meets WCAG guidelines
- **Focus indicators**: Clear green borders on interactive elements
- **Semantic markup**: Proper heading hierarchy and ARIA labels
- **Keyboard navigation**: Tab order and escape key handling

## Layout Philosophy

### Information Hierarchy
1. **Primary actions** - Prominent green buttons
2. **Secondary navigation** - Subtle borders and text
3. **Content organization** - Clear section breaks with borders
4. **Supporting information** - Smaller gray text

### Spatial Relationships
- **Generous whitespace** - `space-y-4`, `space-y-6` for breathing room
- **Consistent margins** - `p-4`, `p-6` standard container padding
- **Logical grouping** - Related elements visually connected
- **Clear separation** - Borders between distinct content areas

### Responsive Behavior
- **Mobile-first** - `max-w-*` constraints with `mx-4` margins
- **Flexible containers** - `flex-1` for content areas
- **Scrollable areas** - `overflow-y-auto` for long content
- **Fixed UI elements** - Bottom corner positioning for persistent access

## Brand Personality

### Terminal Heritage
- **Authentic**: Real terminal aesthetics, not pastiche
- **Professional**: Clean, functional interface design
- **Accessible**: Modern UX while maintaining character

### AI-Forward
- **Intelligent**: Sophisticated color choices and typography
- **Conversational**: Warm, approachable despite technical aesthetic
- **Progressive**: Modern web standards with classic terminal feel

### User-Centric
- **Discoverable**: Clear visual hierarchy and navigation
- **Consistent**: Predictable interaction patterns
- **Delightful**: Smooth animations and thoughtful details

---

## Implementation Notes

### CSS Framework
- **Tailwind CSS** - Utility-first approach
- **Custom properties** - For theme switching
- **Component composition** - Reusable pattern library

### Code Standards
- **Semantic HTML** - Proper element usage
- **Component architecture** - React functional components
- **Accessibility first** - ARIA attributes and keyboard support
- **Performance conscious** - Minimal CSS, efficient renders

This aesthetic creates a unique position: sophisticated enough for professional use, familiar enough for casual exploration, and technically authentic while remaining broadly accessible.