# UI Understanding: Comprehensive Visual & Interaction Guide

**Generated:** 2026-02-12  
**Last Updated:** 2026-02-12 (Producer Dashboard 2.0: Revenue page, MetricCard, GrowthSignalCard)  
**Scope:** In-depth analysis of The Local Yield's current UI/UX, design system, component patterns, user flows, and visual hierarchy.

---

## 1. Design System

### Color Palette

The app uses a warm, earthy color scheme that reflects the local marketplace and agricultural theme:

- **Brand Primary (`#5D4524`)**: Deep earthy brown — used for primary text, buttons, borders, and brand elements
- **Brand Light (`#F5F1E8`)**: Parchment/cream — used as the main background color (`bg-brand-light`)
- **Brand Accent (`#8EAF62`)**: Plant green — used for CTAs, links, badges, and highlights

**Usage Patterns:**
- Background: `bg-brand-light` (parchment) for page backgrounds
- Text: `text-brand` (brown) for primary text, `text-brand/80` for secondary, `text-brand/70` for tertiary
- Links/CTAs: `text-brand-accent` (green) for interactive elements
- Borders: `border-brand/20` or `border-brand/30` for subtle dividers
- Buttons: `bg-brand` (brown) for primary, `bg-brand-accent` for accent actions
- Badges/Alerts: `bg-brand-accent` for notification badges, status indicators

### Typography

**Font Families:**
- **Display Font**: `Playfair Display` (serif) — used for headings (`font-display`)
- **Body Font**: `Inter` (sans-serif) — used for body text (`font-body`)

**Type Scale:**
- **Hero Headings**: `text-4xl` to `text-6xl` (responsive: `sm:text-5xl md:text-6xl`)
- **Page Titles**: `text-3xl font-semibold`
- **Section Headings**: `text-xl` to `text-2xl font-semibold`
- **Card Titles**: `text-lg font-semibold`
- **Body Text**: Default (`text-base`) with variants `text-sm`, `text-xs` for secondary info
- **Labels**: `text-sm font-medium`

**Font Weight Patterns:**
- Headings: `font-semibold` or `font-bold`
- Body: Default weight
- Labels/Buttons: `font-medium`
- Secondary text: Default weight with opacity (`text-brand/80`)

### Spacing & Layout

**Container Patterns:**
- **Max Widths**: `max-w-3xl`, `max-w-4xl`, `max-w-5xl`, `max-w-6xl` depending on content density
- **Padding**: `px-4` (mobile) with responsive `sm:px-6`, `py-8` or `py-12` for sections
- **Gaps**: `gap-4`, `gap-6`, `gap-8` for grid/flex spacing

**Common Layout Patterns:**
- Full-width hero sections with rounded bottom corners (`rounded-b-3xl`)
- Centered content containers (`mx-auto max-w-*`)
- Card-based layouts with `rounded-xl` or `rounded-2xl` borders
- Grid layouts: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`

### Shadows & Borders

- **Cards**: `border border-brand/20` with `shadow-sm` or `shadow-xl` for elevated cards
- **Hover States**: `hover:border-brand` and `hover:shadow-md` for interactive cards
- **Subtle Dividers**: `border-brand/10` or `border-brand/20`

---

## 2. Layout Architecture

### Root Layout (`app/layout.tsx`)

- Wraps entire app in `CartProvider` (React Context)
- Renders `Navbar` at top (sticky header)
- Optional `ClerkProvider` when Clerk env vars are set
- Global styles via `globals.css` with Tailwind + custom brand tokens
- Body uses `bg-brand-light` background

### Page Structure Patterns

**Landing Pages (Home, Market, Care):**
1. **Hero Section**: Full-width gradient (`bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80`) with rounded bottom (`rounded-b-3xl`)
   - Centered text with white text and drop shadows
   - Logo/image at top
   - Large display font heading
   - Subheading text
   - Minimum height: `min-h-[40vh]` to `min-h-[50vh]`

2. **Overlapping Card**: Content card positioned with negative margin (`-mt-12`) to overlap hero
   - White background (`bg-white`)
   - Rounded corners (`rounded-2xl`)
   - Shadow (`shadow-xl`)
   - Contains primary CTA or search form

3. **Content Sections**: Below hero, standard content sections with `max-w-*` containers

**Dashboard Pages:**
- Uses `DashboardLayout` wrapper
- Shows `DashboardNav` tab navigation for producers/admins (Revenue, Customers, Sales Analytics, Orders, Messages; secondary: Profile, Products, Events, Reviews, Records)
- Content area with `max-w-5xl` or `max-w-6xl` (e.g. Revenue page) container
- Alert badges in nav for pending orders, reviews, messages
- Revenue page uses client tabs (Overview, Orders, Customers) and a 30-day revenue bar chart

**Browse/List Pages:**
- Page title and description at top
- Search/filter section in card
- Results grid below (responsive: 1 col mobile, 2-3 cols desktop)

**Detail Pages (Shop, Caregiver Profile):**
- Back link at top (`← Back to browse`)
- Header section with key info
- Main content area (2/3 width on desktop)
- Sidebar (1/3 width) for actions/booking forms

---

## 3. Component Patterns

### Navigation (`Navbar.tsx`)

**Desktop:**
- Logo + "The Local Yield" text on left
- Mode switcher (Market/Sell/Care) in center when user has multiple roles
- Context-aware nav links (Browse, Care, About, Cart, Dashboard)
- Account section on right (Sign in/Sign up or Dashboard/Admin/Sign out)

**Mobile:**
- Hamburger menu button
- Cart icon visible
- Slide-down menu with all links

**Mode Switcher:**
- Pill-shaped tabs (`rounded-lg`)
- Active tab: `bg-white text-brand shadow-sm`
- Inactive: `text-brand/80 hover:text-brand`
- Shows Market, Sell (if producer), Care (if caregiver or homestead owner)

**Context Detection:**
- Different nav links shown based on:
  - User role (buyer-only, producer-only, caregiver-only, multi-role)
  - Current path (`/dashboard`, `/market`, `/care`)
  - Cart hidden for producer-only users

### Cards

**Search Cards (`MarketSearchCard`, `CareSearchCard`):**
- White background with border
- Rounded corners (`rounded-xl`)
- Padding: `p-6` or `sm:p-8`
- Contains form inputs (ZIP, radius, filters)
- Primary CTA button

**Product/Caregiver Cards:**
- Border: `border-brand/20`
- Background: `bg-white`
- Hover: `hover:border-brand hover:shadow-md transition`
- Grid layout: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- Image (if present), title, description, price/rate, badges

**Info Cards (Dashboard):**
- Stats cards: `rounded-xl border border-brand/20 bg-white p-4`
- **MetricCard** (`components/dashboard/MetricCard.tsx`): Label, value (large display font), optional subtitle, optional `href` for click-through
- **GrowthSignalCard** (`components/dashboard/GrowthSignalCard.tsx`): Label, value, optional `trend` (up/down/neutral) with color (accent/red/neutral) and arrow, optional subtitle
- Alert cards: `border-2 border-brand-accent/50` with badge counts
- Quick action cards: Smaller, `rounded-lg` with hover states

### Forms

**Input Fields:**
- Border: `border border-brand/30`
- Padding: `px-3 py-2`
- Rounded: `rounded`
- Text color: `text-brand`
- Placeholder: `placeholder:text-brand/50`
- Focus: Default browser focus ring

**Select Dropdowns:**
- Same styling as inputs
- Options styled with brand colors

**Textareas:**
- Same as inputs with `rows={4}` or `rows={6}`
- `whitespace-pre-line` for multi-line display

**Form Layout:**
- Grid: `grid gap-4 sm:grid-cols-2` for side-by-side fields
- Labels: `block text-sm font-medium text-brand`
- Required indicators: `<span className="text-red-500">*</span>`
- Error messages: `bg-red-50 p-3 text-sm text-red-700`

**Buttons:**
- Primary: `bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90 rounded`
- Accent: `bg-brand-accent` with white text
- Secondary: `border border-brand/30 bg-white text-brand hover:border-brand hover:bg-brand-light/50`
- Disabled: `disabled:opacity-50`
- Full width: `w-full`

### Badges & Status Indicators

**Status Badges:**
- Order status: Color-coded (`bg-green-100 text-green-800`, `bg-blue-100 text-blue-800`, `bg-yellow-100 text-yellow-800`)
- Rounded: `rounded-full px-2.5 py-1 text-xs font-medium`

**Notification Badges:**
- Count badges: `bg-brand-accent px-1.5 text-xs font-semibold text-white rounded-full`
- Positioned inline with labels
- Shows "99+" for counts > 99

**Delivery/Pickup Badges:**
- `DeliveryBadge` component: Shows delivery/pickup availability
- Small pill-shaped badges with icons

### Lists & Tables

**Order Lists:**
- Card-based list items
- Hover states for clickable rows
- Status badge on right
- Date and price info below title

**Product Grids:**
- Responsive grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- Each product in card with image, title, price, add-to-cart button

**Caregiver Lists:**
- Grid layout similar to products
- Shows distance, experience, services preview
- Species tags as small badges

---

## 4. User Flows & Page Types

### Landing Flow

**Home Page (`/`):**
1. Hero section with logo and "Choose your path" messaging
2. Two-path card: Market vs Care (shared backbone)
3. Producer value proposition section
4. Link to About page

**Market Landing (`/market`):**
1. Hero: "Local goods from producers near you"
2. Overlapping `MarketSearchCard` with ZIP/radius search
3. "Request an item" section with form

**Care Landing (`/care`):**
1. Hero: "Trusted animal care in your neighborhood"
2. Overlapping `CareSearchCard`
3. "Become a caregiver" CTA

### Browse Flow

**Market Browse (`/market/browse`):**
1. Page title and description
2. `BrowseClient` component:
   - `LocationInput` for ZIP/radius
   - Search query input
   - Results: `ListingRow` components showing producer, distance, products
   - Click → producer shop page

**Care Browse (`/care/browse`):**
1. Page title and description
2. `CareBrowseClient` component:
   - `LocationInput` for ZIP/radius
   - Species filter dropdown
   - Service type filter dropdown
   - Results: Caregiver cards in grid
   - Click → caregiver profile page

### Shopping Flow

**Producer Shop (`/market/shop/[id]`):**
1. Back link to browse
2. `ProducerHeader`: Name, bio, distance, delivery/pickup info, profile image, about/story, upcoming events, contact info
3. `ProducerProductGrid`: Products with images, titles, prices, delivery badges, add-to-cart buttons
4. Click product → add to cart (updates `CartContext`)

**Cart (`/market/cart`):**
1. `CartPageClient` reads from `useCart()` hook
2. List of `CartItemRow` components
3. Each row: Image, title, quantity controls, price, remove button
4. Total at bottom
5. "Proceed to checkout" button

**Checkout (`/market/checkout`):**
1. `CheckoutClient` component
2. Cart summary
3. `FulfillmentSelector`: Pickup vs Delivery options
4. Form for pickup details or delivery address
5. Submit → POST `/api/orders` → redirect to confirmation

**Order Confirmation (`/market/order-confirmation/[orderId]`):**
1. Order details: Items, total, fulfillment method
2. Pickup code (if pickup)
3. Producer contact info
4. Link to dashboard orders

### Care Booking Flow

**Caregiver Profile (`/care/caregiver/[id]`):**
1. Header: Name, location
2. Main content (2/3 width):
   - Trust signals: Experience, background, species comfort, tasks, intro video/audio, references, bio
   - Service listings: Title, type, species, rate, description
   - Reviews: Reviewer name, rating (stars), comment, date
3. Sidebar (1/3 width, sticky):
   - `BookingForm` (if logged in) or "Sign in" CTA
   - Form fields: Start/end date/time, location ZIP, species, service type, notes
   - Submit → POST `/api/care/bookings` → redirect to messages thread

### Dashboard Flow

**Dashboard Home (`/dashboard`):**
- **Buyer-only**: Simple dashboard with links to orders and browse
- **Producer/Admin**:
  1. Welcome message
  2. Alert cards (if pending orders/reviews/messages)
  3. **Snapshot Metrics** (4 cards via `MetricCard`): This Week Revenue (→ Revenue page), Orders Pending (→ Orders), Repeat Customers (→ Customers), Active Listings (→ Products)
  4. **Growth Signals** (4 cards via `GrowthSignalCard`): Revenue (7d), Revenue (30d), Top Selling Product, New Customers (this month) — with optional trend up/neutral/down
  5. **Repeat Behavior** section: repeat customer count + link to customers
  6. Quick actions: Add Product, Add Event, Update Profile, View Storefront
  7. Recent orders preview (or `ExampleOrderPreview` if none)
  8. Admin links (if admin)
  9. "Demand near you" section with item requests

**Dashboard Navigation (`DashboardNav`):**
- Primary tabs: **Revenue**, Customers, Sales Analytics, Orders, Messages
- Secondary links: Profile, Products, Events, Reviews, Records
- Badge counts on Orders, Messages, Reviews tabs
- Active tab: `bg-brand text-white`
- Inactive: `text-brand hover:bg-brand-light`

**Revenue Page (`/dashboard/revenue`):**
- Page title "Revenue" and description
- Client tabs: **Overview** | Orders | Customers
- **Overview tab**: Key metrics (Revenue 7d, Revenue 30d, Total Orders); **Revenue Last 30 Days** bar chart (daily bars, tooltip with date/revenue/order count); date range label and total; Top Selling Product card when present
- **Orders tab**: List of producer orders (from initial server data)
- **Customers tab**: List of customers (from initial server data)
- Data from `getProducerMetrics`, `getOrdersForProducer`, `getCustomersForProducer`; 30-day revenue series built server-side for chart

**Orders Page (`/dashboard/orders`):**
- Different views for buyers vs producers
- `ProducerOrdersClient`: Filter by status, mark fulfilled, view order details
- `BuyerOrdersClient`: View order history, status, leave reviews

**Products Page (`/dashboard/products`):**
- `ProductsClient`: List products, add/edit/delete
- Form for creating/editing products
- Uses `/api/products` endpoints

**Messages Page (`/dashboard/messages`):**
- `DashboardMessagesClient`: List conversations
- Thread view for each conversation
- Linked to orders or care bookings

**Care Bookings (`/dashboard/care-bookings`):**
- `CareBookingsClient`: List bookings (as seeker or caregiver)
- Status management: Accept/decline (caregiver), cancel (seeker)
- Link to conversation thread

**Sales Analytics (`/dashboard/analytics`):**
- Server-rendered; uses `getProducerMetrics` and `getPaidOrdersForProducer`
- Metric cards: Total revenue, Orders (paid/fulfilled), Average order, Revenue (30d)
- Sales history list: recent paid/fulfilled orders (buyer, date, status, total)
- Link to "View all orders"

---

## 5. Visual Hierarchy

### Page-Level Hierarchy

1. **Hero Section** (if present): Largest visual element, gradient background, white text
2. **Overlapping Card**: Elevated above hero, contains primary action
3. **Page Title**: Large display font, `text-3xl font-semibold`
4. **Section Headings**: `text-xl font-semibold` or `text-lg font-semibold`
5. **Content**: Body text, cards, lists

### Card Hierarchy

1. **Card Title**: `text-lg font-semibold` or `text-xl font-semibold`
2. **Subtitle/Meta**: `text-sm text-brand/70` or `text-xs text-brand/60`
3. **Body Content**: Default text size
4. **Actions**: Buttons at bottom or right-aligned

### Information Density

- **Landing Pages**: Low density, lots of whitespace, large hero
- **Browse Pages**: Medium density, grid of cards
- **Dashboard**: Higher density, stats cards, lists, tables
- **Detail Pages**: Balanced, main content + sidebar

---

## 6. Responsive Design Patterns

### Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First Approach

**Navigation:**
- Desktop: Horizontal nav bar
- Mobile: Hamburger menu, slide-down panel

**Grids:**
- Mobile: Single column (`grid-cols-1`)
- Tablet: 2 columns (`sm:grid-cols-2`)
- Desktop: 3 columns (`lg:grid-cols-3`)

**Typography:**
- Responsive text sizes: `text-4xl sm:text-5xl md:text-6xl`
- Mobile: Smaller padding (`px-4`)
- Desktop: Larger padding (`sm:px-6`)

**Forms:**
- Mobile: Stacked fields
- Desktop: Side-by-side (`sm:grid-cols-2`)

**Hero Sections:**
- Mobile: `min-h-[40vh]`
- Desktop: `min-h-[50vh]` or larger

---

## 7. Interaction Patterns

### Hover States

- **Cards**: `hover:border-brand hover:shadow-md transition`
- **Links**: `hover:text-brand-accent` or `hover:underline`
- **Buttons**: `hover:bg-brand/90` (darker on hover)
- **Nav Items**: `hover:bg-brand-light`

### Loading States

- Loading text: `text-brand/70` with "Loading..." or "Searching..."
- Disabled buttons: `disabled:opacity-50`
- No explicit loading spinners observed (may use text-based loading)

### Error States

- Error messages: `bg-red-50 p-3 text-sm text-red-700`
- Form validation: Red asterisk for required fields
- Inline error messages below inputs

### Empty States

- "No results" messages: `text-brand/70`
- Example previews: `ExampleOrderPreview` component for empty order states
- Helpful messaging: "Try expanding your search radius" or similar

### Success States

- Order confirmation page shows success
- Status badges show completed states (green)
- No explicit toast notifications observed

---

## 8. Accessibility Considerations

### Current Patterns

- **Semantic HTML**: Uses proper headings (`h1`, `h2`, etc.)
- **ARIA Labels**: `aria-label` on icon buttons (hamburger menu)
- **Form Labels**: Proper `label` elements with `htmlFor`
- **Alt Text**: Images have alt attributes (some empty `alt=""` for decorative)
- **Focus States**: Default browser focus rings (may need enhancement)

### Areas for Improvement

- Color contrast: Ensure text meets WCAG AA standards
- Keyboard navigation: Ensure all interactive elements are keyboard accessible
- Screen reader announcements: Consider adding for dynamic updates (cart, orders)
- Skip links: Not observed for main content

---

## 9. Component-Specific Patterns

### `ProducerHeader`
- Large header with name, bio
- Distance badge
- Delivery/pickup badges
- Profile image (if available)
- About/story sections
- Upcoming events list
- Contact info

### `ProducerProductGrid`
- Responsive grid layout
- Each product card:
  - Image (if available)
  - Title
  - Description
  - Price
  - Delivery badge
  - Add to cart button

### `BrowseClient` / `CareBrowseClient`
- Location input at top
- Filters below (search query, species, service type)
- Results grid
- Loading/error/empty states

### `CartItemRow`
- Image thumbnail
- Title and producer name
- Quantity controls (+/-)
- Price per unit
- Total price
- Remove button

### `BookingForm`
- Date/time pickers
- ZIP input
- Dropdowns for species/service type
- Notes textarea
- Submit button
- Error handling

### `DashboardNav`
- Tab navigation for primary sections (Revenue, Customers, Sales Analytics, Orders, Messages)
- Secondary links on right (Profile, Products, Events, Reviews, Records)
- Badge counts for alerts (orders, messages, reviews)
- Active state highlighting

### `MetricCard`
- Label (small, brand/70), value (large display font), optional subtitle
- Optional `href`: wraps content in `<a>` with hover opacity
- Used for snapshot metrics on dashboard home

### `GrowthSignalCard`
- Label, value, optional `trend` ("up" | "down" | "neutral") — green/red/neutral text and ↑/↓/→
- Optional subtitle
- Used for revenue 7d/30d, top selling product, new customers on dashboard home

### `RevenuePageClient`
- Tabs: Overview, Orders, Customers (border-b-2 active state with brand-accent)
- Overview: 3-column metric cards; bar chart (flex items-end, height by revenue ratio); date range and total below chart; top selling product card
- Orders/Customers: Lists from server-passed initial data

---

## 10. Design Language Summary

**Overall Aesthetic:**
- Warm, earthy, agricultural theme
- Clean, modern interface
- Card-based layouts
- Generous whitespace
- Clear typography hierarchy

**Key Visual Elements:**
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Subtle borders (`border-brand/20`)
- Soft shadows (`shadow-sm`, `shadow-xl`)
- Gradient heroes
- Badge-based status indicators

**Interaction Style:**
- Subtle hover effects
- Smooth transitions
- Clear CTAs
- Context-aware navigation
- Mobile-responsive

**Brand Personality:**
- Local, community-focused
- Trustworthy (warm colors, clear information)
- Approachable (friendly copy, simple flows)
- Professional (clean design, organized information)

---

## 11. Current State Assessment

### Strengths

1. **Consistent Design System**: Clear color palette and typography
2. **Responsive Design**: Mobile-first approach with good breakpoints
3. **Clear Information Hierarchy**: Hero → Card → Content flow
4. **Context-Aware Navigation**: Navbar adapts to user role and location
5. **Card-Based Layouts**: Consistent card patterns throughout
6. **Good Empty States**: Helpful messaging when no results

### Areas for Enhancement

1. **Loading States**: Could add spinners or skeletons for better UX
2. **Toast Notifications**: No visible success/error toasts for actions
3. **Image Handling**: Some images may need better fallbacks/placeholders
4. **Accessibility**: Could enhance keyboard navigation and screen reader support
5. **Animation**: Minimal animations (could add subtle transitions)
6. **Dark Mode**: Not implemented (has dark mode CSS variables but not used)
7. **Error Boundaries**: No visible error boundaries for graceful failures

---

## 12. File Organization

**Component Locations:**
- Shared components: `components/`
- Dashboard-specific shared components: `components/dashboard/` (e.g. `MetricCard.tsx`, `GrowthSignalCard.tsx`)
- Page-specific clients: Next to page files (e.g., `app/dashboard/orders/ProducerOrdersClient.tsx`, `app/dashboard/revenue/RevenuePageClient.tsx`)
- Layout components: `app/dashboard/DashboardNav.tsx`

**Styling:**
- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Brand tokens: Defined in `globals.css` and Tailwind config

**Assets:**
- Logo: `/local-yield-logo.png` (referenced in pages)
- Images: Product/caregiver images stored in database (URLs)

---

This document provides a comprehensive understanding of The Local Yield's current UI implementation, design patterns, and user experience flows. Use it as a reference for maintaining consistency, planning enhancements, and onboarding new developers or designers.
