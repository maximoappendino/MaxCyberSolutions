Make the necessary changes on the dashboard

# Dashboard

## Sections

- Add Colour tweaks for every section (Use current Design colours as default): Background, Foreground, title, body, price, mouse hover, accent.
- Remove the pencil icon to edit. If I click on the box is fine

### HEADER: (NEW)
┌────────────────────────────┐
│ Announcement / Utility Bar │
├────────────────────────────┤
│ Main Header                │
│ Logo | Search | Actions    │
├────────────────────────────┤
│ Navigation / Mega Menu     │
└────────────────────────────┘
#### Announcement Bar / Utility Bar can be:
- Disabled
- Top Bar
- Promo Bar
- Notification Bar

| Setting           | Technical Name                    | Description                     |
| ----------------- | --------------------------------- | ------------------------------- |
| Show/hide         | Visibility Toggle                 | Enables or disables the bar     |
| Rotating messages | Announcement Slider / Carousel    | Cycles promotional messages     |
| Sticky behavior   | Sticky Utility Bar                | Remains visible while scrolling |
| Dismiss button    | Dismissible Banner                | User can close it               |
| Background color  | Theme Token / Background Variable | Bar color                       |
| Text color        | Foreground Token                  | Typography color                |
| Height            | Utility Bar Height                | Usually 30–50px                 |
| Countdown         | Countdown Timer Component         | Limited-time sales              |

#### Main Header

The primary navigation/control region.

Logo
Search
Account
Wishlist
Cart
Mobile menu trigger
Language
Currency

Typical layout systems:

| Layout Type             | Description                  |
| ----------------------- | ---------------------------- |
| Centered Logo           | Logo centered, nav split     |
| Left-Aligned Logo       | Most common                  |
| Split Navigation        | Menu split around logo       |
| Minimal Header          | Reduced controls             |
| Commerce-Focused Header | Large search + cart emphasis |

Setting:

| Variant          | Description                                |
| ---------------- | ------------------------------------------ |
| Always Sticky    | Never leaves viewport                      |
| Smart Sticky     | Hides on scroll down, appears on scroll up |
| Shrinking Sticky | Header height decreases after scrolling    |
| Partial Sticky   | Only nav sticks                            |
| Floating Sticky  | Detached header with shadow/backdrop       |
| Unfocused        | Transparent, Blur, Solid

#### Mega menu (Do not implement yet)

### Hero Banner:
┌─────────────────────────────┐
│ Header                      │
├─────────────────────────────┤
│ Hero Banner                 │
│                             │
│  Headline                   │
│  Subheadline                │
│  CTA Buttons                │
│                             │
│         Image / Video       │
│                             │
└─────────────────────────────┘

| Component       | Technical Name               | Description          |
| --------------- | ---------------------------- | -------------------- |
| Main title      | Hero Heading                 | Primary message      |
| Supporting text | Subheading / Supporting Copy | Additional context   |
| Buttons         | CTA (Call-To-Action)         | User actions         |
| Background      | Hero Media                   | Image/video/canvas   |
| Overlay         | Scrim / Overlay Layer        | Improves readability |
| Container       | Hero Wrapper                 | Layout boundary      |

Layouts:
1. Centered Hero
2. Split Hero
3. Fullscreen Hero
4. Carousel Hero
5. Video Hero

Hero Behavior Settings
Height Modes
| Mode            | Description        |
| --------------- | ------------------ |
| Auto Height     | Content-based      |
| Fixed Height    | Specific px/rem    |
| Fullscreen      | 100vh              |
| Adaptive Height | Responsive scaling |

Content Alignment
| Setting              | Description         |
| -------------------- | ------------------- |
| Horizontal alignment | Left/center/right   |
| Vertical alignment   | Top/middle/bottom   |
| Text max-width       | Readability control |

Background Media Settings
Image Hero
Common settings:
| Setting          | Technical Name         |
| ---------------- | ---------------------- |
| Background image | Hero Background        |
| Position         | Object Position        |
| Scaling          | Object Fit             |
| Overlay darkness | Overlay Opacity        |
| Lazy loading     | Deferred Media Loading |

Video Hero
| Setting                | Description      |
| ---------------------- | ---------------- |
| Pause on mobile        | Performance      |
| Reduced motion support | Accessibility    |
| Bandwidth optimization | Adaptive loading |

CTA (Call-To-Action) Systems
Critical for conversion.
Common CTA types:
| Type               | Purpose           |
| ------------------ | ----------------- |
| Shop Now           | Direct purchase   |
| Explore Collection | Category browsing |
| Learn More         | Informational     |
| Limited Offer      | Promotion         |

CTA Variants
| Variant          | Description        |
| ---------------- | ------------------ |
| Primary button   | Main action        |
| Secondary button | Alternative action |
| Ghost button     | Transparent style  |
| Text link        | Minimal CTA        |

Performance Considerations
Professional stores optimize hero heavily.
Common Optimizations
| Optimization       | Purpose            |
| ------------------ | ------------------ |
| Responsive images  | Reduce bandwidth   |
| WebP/AVIF          | Better compression |
| Lazy media         | Faster loading     |
| Preload hero image | Improve LCP        |
| CDN delivery       | Global performance |

Accessibility Features
| Feature                  | Description         |
| ------------------------ | ------------------- |
| Contrast compliance      | Readable text       |
| Alt text                 | Image accessibility |
| Reduced motion mode      | Animation safety    |
| Keyboard-accessible CTAs | Navigation          |



### Grid:
┌─────────────────────────────┐
│ Filters / Sorting           │
├─────────────────────────────┤
│ Grid                        │
│ ┌────┐ ┌────┐ ┌────┐        │
│ │Card│ │Card│ │Card│        │
│ └────┘ └────┘ └────┘        │
│ ┌────┐ ┌────┐ ┌────┐        │
│ │Card│ │Card│ │Card│        │
│ └────┘ └────┘ └────┘        │
└─────────────────────────────┘
| Component         | Technical Name         | Description           |
| ----------------- | ---------------------- | --------------------- |
| Product container | Product Card           | Individual item       |
| Grid wrapper      | Product Grid Container | Layout system         |
| Image             | Product Thumbnail      | Primary visual        |
| Product title     | Product Name           | Product label         |
| Price             | Pricing Block          | Cost display          |
| CTA               | Add-to-Cart Action     | Purchase interaction  |
| Badges            | Product Labels         | Sale/new/out-of-stock |
| Hover actions     | Quick Actions          | Wishlist/preview      |

Grid Layout Systems
1. CSS Grid Layout
Advantages:

Clean responsiveness
Consistent spacing
Easy scaling

2. Masonry Grid

Pinterest-like layout.

Technical names:

Masonry Layout
Staggered Grid

Use cases:

Fashion
Lifestyle
Editorial commerce

Advantages:

Dynamic visual rhythm
Better mixed image ratios

3. Flexbox Grid

Older/common alternative.

Useful for:

Simpler layouts
Dynamic row behavior


Grid Density Modes
| Mode           | Description                |
| -------------- | -------------------------- |
| Compact Grid   | Small cards, more products |
| Standard Grid  | Balanced density           |
| Spacious Grid  | Large premium cards        |
| Editorial Grid | Magazine-style layout      |

Product Card Anatomy

Typical structure:
┌─────────────────┐
│ Product Image   │
│ Badge           │
├─────────────────┤
│ Product Title   │
│ Category        │
│ Price           │
│ Rating          │
│ CTA             │
└─────────────────┘

Product Card Settings
Image Settings
| Setting          | Technical Name        |
| ---------------- | --------------------- |
| Aspect ratio     | Media Ratio           |
| Hover image swap | Secondary Hover Image |
| Zoom effect      | Hover Scale           |
| Cropping mode    | Object Fit            |
| Lazy loading     | Deferred Loading      |

Card Interaction
| Interaction     | Description             |
| --------------- | ----------------------- |
| Hover elevation | Shadow increase         |
| Quick add       | Add without opening PDP |
| Quick view      | Modal preview           |
| Wishlist toggle | Save product            |
| Compare toggle  | Comparison list         |

Responsive Grid Settings
Column Control

Typical breakpoints:
| Device     | Columns |
| ---------- | ------- |
| Mobile     | 1–2     |
| Tablet     | 2–3     |
| Desktop    | 4–6     |
| Ultra-wide | 6–8     |

Adaptive Grid

Technical names:

Auto-fit Grid
Auto-fill Grid

Product Media Variants
Single Image Cards

Simplest setup.

Advantages:

Faster loading
Cleaner UI
Dual Image Hover

Behavior:
Second image appears on hover.

Common in fashion.

Implementation:

Opacity transitions
Crossfade animation
Video Product Cards

Hover video preview.

Technical names:

Motion Commerce
Inline Video Preview

Common for:

Apparel
Footwear
Gadgets
Pricing Systems
Common Pricing States
| State                | Description                |
| -------------------- | -------------------------- |
| Regular price        | Standard price             |
| Sale price           | Discounted                 |
| Compare-at price     | Original crossed-out price |
| Dynamic pricing      | Variable prices            |
| Subscription pricing | Recurring payment          |

Product Badges

Technical names:

Product Labels
Merchandising Badges

Common badges:
| Badge        | Purpose          |
| ------------ | ---------------- |
| Sale         | Discount         |
| New          | Recently added   |
| Bestseller   | High sales       |
| Limited      | Scarcity         |
| Out of Stock | Inventory status |

Filtering Systems

Usually attached to product grids.

Filter Types
| Filter   | Technical Name  |
| -------- | --------------- |
| TAG      | Taxonomy Filter |
| Price    | Range Filter    |
| Color    | Swatch Filter   |
| Size     | Variant Filter  |
| Brand    | Vendor Filter   |
| Rating   | Review Filter   |

Sorting Systems

Common sorts:
| Sort           | Description            |
| -------------- | ---------------------- |
| Featured       | Merchandising priority |
| Best Selling   | Sales rank             |
| Newest         | Recent products        |
| Price Low-High | Ascending              |
| Price High-Low | Descending             |
| Most Reviewed  | Social proof           |

Pagination Systems
Traditional Pagination
Infinite Scroll (LAZY LOADING)

Technical names:

Endless Scroll
Auto Pagination

Advantages:

Continuous browsing

Disadvantages:

Footer accessibility
Performance
Load More

Hybrid approach.

Often best UX compromise.

Search & Discovery Features
Predictive Grid Updates

Technical names:

Live Filtering
AJAX Filtering

Behavior:
Products update without page reload.

Faceted Navigation

Advanced filtering architecture.

Allows:

Multiple simultaneous filters
Dynamic filter counts
Smart availability logic
Visual Merchandising Features
Featured Products

Larger cards inserted into grid.

Technical names:

Promotional Tiles
Featured Placement
Collection Banners

Interstitial marketing blocks.

Used for:

Promotions
Editorial content
Campaigns
Advanced Commerce Features
Variant Swatches

Examples:

Color circles
Fabric options
Size previews

Behavior:
Hovering changes product image.

Inventory Indicators

Examples:

Low stock warning
Stock bars
Delivery estimate
Personalization

Dynamic product ranking based on:

User behavior
Purchase history



Performance Optimizations

Very important for large catalogs.

| Technique             | Purpose                |
| --------------------- | ---------------------- |
| Image lazy loading    | Faster initial load    |
| Virtualized rendering | Large grids            |
| CDN images            | Faster delivery        |
| Skeleton loaders      | Better perceived speed |
| Responsive image sets | Device optimization    |

Accessibility Features

| Feature             | Description          |
| ------------------- | -------------------- |
| Keyboard navigation | Card focus support   |
| Alt text            | Screen readers       |
| Proper headings     | Semantic structure   |
| Focus indicators    | Visual accessibility |
| Accessible filters  | ARIA controls        |


Common Product Grid Variants
Minimal Grid

Characteristics:

Large whitespace
Minimal metadata
Luxury aesthetic

Seen in:

Apple
COS
Dense Marketplace Grid

Characteristics:

High information density
Ratings
Discounts
Multiple CTAs

Seen in:

Amazon
AliExpress
Editorial Grid

Characteristics:

Mixed content
Campaign imagery
Storytelling focus

Seen in:

Nike
Zara

### Text Banner

Text Banner

A Text Banner is a lightweight promotional or informational content block used throughout e-commerce websites.

Unlike a Hero Banner, it is usually:

Smaller
Text-focused
Utility-driven
Reusable across pages

It is often used for:

Promotions
Shipping information
Trust messaging
Brand statements
Limited-time offers

┌─────────────────────────────┐
│ FREE SHIPPING ON ORDERS $50 │
│        [Shop Now]           │
└─────────────────────────────┘

┌──────┬──────┬───────┐
│Fast  │Easy  │24/7   │
│Ship  │Return│Support│
└──────┴──────┴───────┘

| Name                | Usage                          |
| ------------------- | ------------------------------ |
| Promo Banner        | Sales/promotions               |
| Marketing Banner    | Campaign messaging             |
| Announcement Banner | Informational                  |
| Utility Banner      | Functional/store info          |
| Trust Bar           | Trust signals                  |
| Info Strip          | Small informational section    |
| USP Bar             | Unique Selling Proposition bar |

Common Banner Types
1. Promotional Banner

Purpose:
Drive sales or urgency.

Examples:

“20% OFF TODAY”
“BUY 1 GET 1”
“FLASH SALE”

Common features:

CTA button
Countdown timer
Animated emphasis
2. Trust Banner

Purpose:
Reduce purchase hesitation.

Examples:

Free shipping
Secure checkout
Money-back guarantee

Usually icon-based.

3. Brand Statement Banner

Purpose:
Communicate identity or values.

Examples:

Sustainable materials
Handmade products
Ethical sourcing

Common in premium brands.

4. Informational Banner

Purpose:
Operational notices.

Examples:

Shipping delays
Holiday schedules
Policy updates
Layout Variants

- Single-Line Banner
- Multi-Column Banner
- Split Banner

Scrolling Marquee Banner

Technical names:

Infinite Ticker
Marquee Strip

Behavior:
Text continuously scrolls horizontally.

Common in:

Fashion brands
Streetwear
Trend-focused stores
Visual Settings
Background Styles

| Style            | Technical Name   |
| ---------------- | ---------------- |
| Solid color      | Flat Background  |
| Gradient         | Gradient Fill    |
| Transparent      | Overlay Mode     |
| Image background | Background Media |
| Glass effect     | Frosted Glass    |

Typography Controls
| Setting        | Description         |
| -------------- | ------------------- |
| Font size      | Text scale          |
| Weight         | Boldness            |
| Letter spacing | Tracking            |
| Text transform | Uppercase/lowercase |
| Line height    | Vertical rhythm     |

Alignment Settings
| Setting              | Options              |
| -------------------- | -------------------- |
| Horizontal alignment | Left/center/right    |
| Vertical alignment   | Top/middle/bottom    |
| Content width        | Full-width/contained |


CTA Systems
CTA Types
| Type        | Description         |
| ----------- | ------------------- |
| Button CTA  | Primary action      |
| Inline link | Minimal interaction |
| Icon CTA    | Compact interface   |

CTA Variants
| Variant        | Description     |
| -------------- | --------------- |
| Filled button  | Strong emphasis |
| Outline button | Secondary       |
| Ghost button   | Transparent     |
| Text-only      | Minimal         |

Behavior Settings
Sticky Banner

Technical names:

Sticky Promo Bar
Fixed Announcement

Behavior:
Remains visible during scrolling.

Common for:

Sales campaigns
Shipping offers
Dismissible Banner

Behavior:
User can close it.

Implementation:

Cookie/localStorage persistence
Session-based visibility
Rotating Messages

Technical names:

Banner Slider
Announcement Carousel

Behavior:
Cycles messages automatically.

Common toggles:
| Setting          | Description         |
| ---------------- | ------------------- |
| Autoplay         | Automatic cycling   |
| Transition speed | Animation timing    |
| Pause on hover   | Interaction support |
| Manual controls  | Navigation arrows   |

Responsive Settings
Mobile Adaptations
| Setting             | Description        |
| ------------------- | ------------------ |
| Stack columns       | Vertical layout    |
| Reduce font size    | Smaller typography |
| Hide secondary text | Simplification     |
| Swipe carousel      | Touch interaction  |

Accessibility Features
| Feature                | Description      |
| ---------------------- | ---------------- |
| Sufficient contrast    | Readability      |
| Keyboard-focusable CTA | Accessibility    |
| Reduced motion support | Animation safety |
| Semantic structure     | Proper markup    |

### Text Block

Text Block

A Text Block is a modular content component used to display structured textual information inside a webpage layout.

In e-commerce, it is commonly used for:

Brand storytelling
Product explanations
Marketing copy
Informational sections
SEO content
Editorial content

Unlike banners, text blocks are usually:

Content-heavy
Layout-flexible
Section-oriented
Rich-text capable

┌─────────────────────────────┐
│ Heading                     │
│                             │
│ Paragraph text explaining   │
│ the product or brand.       │
│                             │
│ [CTA Button]                │
└─────────────────────────────┘

Common Technical Names
| Name                   | Usage                 |
| ---------------------- | --------------------- |
| Rich Text Section      | CMS terminology       |
| Content Block          | Generic               |
| Editorial Section      | Storytelling          |
| Copy Block             | Marketing copy        |
| Information Panel      | Informational         |
| WYSIWYG Block          | Visual editor content |
| Static Content Section | Persistent content    |

Core Components
| Component  | Technical Name    | Description          |
| ---------- | ----------------- | -------------------- |
| Main title | Heading           | Section title        |
| Body text  | Body Copy         | Main content         |
| CTA        | Action Element    | Button/link          |
| Wrapper    | Content Container | Layout boundary      |
| Media      | Supporting Asset  | Optional image/video |
| Divider    | Section Separator | Visual spacing       |

Text Hierarchy System

Professional text blocks use typography hierarchy.

Heading Levels
| Level   | Technical Name     | Typical Use       |
| ------- | ------------------ | ----------------- |
| H1      | Primary Heading    | Main page title   |
| H2      | Section Heading    | Major sections    |
| H3      | Subsection Heading | Smaller divisions |
| Eyebrow | Kicker Label       | Small intro text  |

Text Block Variants
1. Simple Text Block

Only:

Heading
Paragraph

Used for:

Policies
Descriptions
Introductions

2. CTA Text Block

3. Media + Text Block

Technical names:

Split Content Block
Media Object
Content Row

Very common in modern commerce.

4. Centered Editorial Block

Luxury/minimal style.

Characteristics:

Narrow text width
Large whitespace
Centered alignment

Common in:

Fashion
Premium brands
Lifestyle stores

5. Multi-Column Text Block

Examples:

Feature grids
Service descriptions
Benefits sections



Layout Systems
Container Width
| Mode        | Description        |
| ----------- | ------------------ |
| Full-width  | Edge-to-edge       |
| Contained   | Max-width centered |
| Narrow      | Reading-focused    |
| Split-width | Two-column         |


Alignment Options
| Setting               | Options           |
| --------------------- | ----------------- |
| Text alignment        | Left/center/right |
| Vertical alignment    | Top/middle/bottom |
| Content justification | Start/center/end  |


Typography Settings
Common Controls
| Setting     | Technical Name   |
| ----------- | ---------------- |
| Font family | Typeface         |
| Font size   | Typography Scale |
| Weight      | Font Weight      |
| Spacing     | Letter Tracking  |
| Line height | Leading          |
| Max width   | Measure          |


Rich Text Features

Professional CMS text blocks often support:
| Feature        | Description        |
| -------------- | ------------------ |
| Bold/italic    | Inline formatting  |
| Lists          | Ordered/unordered  |
| Links          | Hyperlinks         |
| Embedded media | Images/videos      |
| Tables         | Structured content |
| Quotes         | Pull quotes        |

CTA Systems
CTA Types
| Type             | Description           |
| ---------------- | --------------------- |
| Primary button   | Main action           |
| Secondary button | Alternative action    |
| Text link        | Minimal               |
| Inline CTA       | Embedded in paragraph |


Background & Styling Options
Background Types
| Type        | Technical Name      |
| ----------- | ------------------- |
| Solid color | Flat Fill           |
| Gradient    | Gradient Background |
| Image       | Background Media    |
| Texture     | Pattern Layer       |
| Transparent | Overlay Mode        |


Container Styling
| Setting       | Description      |
| ------------- | ---------------- |
| Padding       | Internal spacing |
| Margin        | External spacing |
| Border radius | Rounded corners  |
| Shadow        | Elevation        |
| Border        | Outline styling  |


Content Density Variants
Minimal Block

Characteristics:

Large whitespace
Short copy
Premium feel
Dense Informational Block

Characteristics:

Long-form text
Technical/product detail
SEO-oriented
SEO-Oriented Text Blocks

Very important in e-commerce.

Purpose:

Improve search indexing
Add keyword-rich content
Explain categories/products

Common placement:

Below product grid
Collection descriptions
FAQ sections
Advanced Commerce Variants
Storytelling Section

Narrative-driven content.

Usually includes:

Large typography
Imagery
Emotional messaging

Common in:

Luxury commerce
Sustainable brands
DTC brands

Responsive Behavior
Mobile Adaptations
| Setting              | Description           |
| -------------------- | --------------------- |
| Stack columns        | Vertical layout       |
| Reduce max-width     | Smaller screens       |
| Resize typography    | Responsive type scale |
| Hide secondary media | Simplification        |


Accessibility Features
| Feature              | Description      |
| -------------------- | ---------------- |
| Semantic headings    | Proper hierarchy |
| Readable line length | Accessibility    |
| Contrast compliance  | Visibility       |
| Focusable CTAs       | Keyboard support |

Performance Considerations

Professional implementations optimize:

Web fonts
CLS prevention
Lazy-loaded media
Minimal animation overhead

### Image Gallery

Image Gallery

An Image Gallery is a visual content module used to display multiple images in a structured, interactive layout.

In e-commerce, galleries are used for:

Product presentation
Lifestyle imagery
Lookbooks
Brand storytelling
Social proof
Collection showcases

The gallery system is usually both:

A layout component
A media interaction system

┌─────────────────────────────┐
│ Main Gallery                │
│ ┌────┐ ┌────┐ ┌────┐        │
│ │Img │ │Img │ │Img │        │
│ └────┘ └────┘ └────┘        │
│ ┌────┐ ┌────┐ ┌────┐        │
│ │Img │ │Img │ │Img │        │
│ └────┘ └────┘ └────┘        │
└─────────────────────────────┘

Common Technical Names
| Name             | Usage             |
| ---------------- | ----------------- |
| Image Grid       | Standard gallery  |
| Media Gallery    | Mixed media       |
| Lookbook Gallery | Fashion/editorial |
| Product Gallery  | PDP media         |
| Masonry Gallery  | Dynamic layout    |
| Carousel Gallery | Horizontal slider |
| Lightbox Gallery | Modal expansion   |

Common Gallery Types
1. Grid Gallery

Most common.

Uses:

Collection pages
Lifestyle imagery
Brand content

2. Masonry Gallery

Pinterest-style staggered layout.

Technical names:

Masonry Layout
Dynamic Height Grid

Advantages:

Organic visual flow
Better for mixed image sizes

Common in:

Fashion
Art
Editorial commerce
3. Carousel Gallery

Horizontal scrolling gallery.

Technical names:

Slider
Media Carousel
Swiper Gallery

Common settings:
| Setting        | Description         |
| -------------- | ------------------- |
| Autoplay       | Automatic movement  |
| Loop           | Infinite scrolling  |
| Pagination     | Dots/navigation     |
| Swipe gestures | Touch support       |
| Snap scrolling | Controlled movement |

4. Product Media Gallery

Used on Product Detail Pages (PDPs).

Contains:

Product images
Zoom
Variants
Videos
360 views
5. Lookbook Gallery

Editorial-focused.

Usually:

Large imagery
Overlaid CTAs
Interactive hotspots

Common in fashion brands.

Gallery Layout Systems
Fixed Grid

Equal-sized items.

Advantages:

Predictable layout
Easy scanning
Asymmetrical Grid

Mixed sizing for visual hierarchy.

Examples:

Large featured image
Smaller secondary images
Collage Layout

Editorial/art-direction approach.

Characteristics:

Intentional imbalance
Storytelling focus
Image Ratio Settings

Very important for consistency.

Common Ratios
| Ratio | Usage               |
| ----- | ------------------- |
| 1:1   | Product thumbnails  |
| 4:5   | Fashion photography |
| 16:9  | Hero/lifestyle      |
| Auto  | Editorial masonry   |

Image Behavior Settings
Hover Effects
| Effect     | Technical Name        |
| ---------- | --------------------- |
| Zoom       | Scale Transform       |
| Fade       | Opacity Transition    |
| Image swap | Secondary Media Hover |
| Overlay    | Hover Overlay         |
| Blur       | Backdrop Blur         |

Click Interactions
| Interaction  | Description       |
| ------------ | ----------------- |
| Lightbox     | Fullscreen modal  |
| Zoom viewer  | Magnification     |
| Quick shop   | Embedded commerce |
| Expand image | Detailed viewing  |

Lightbox Systems

Technical names:

Modal Viewer
Image Overlay Viewer

Common features:
| Feature             | Description       |
| ------------------- | ----------------- |
| Keyboard navigation | Arrow controls    |
| Pinch zoom          | Mobile gestures   |
| Thumbnail strip     | Media navigation  |
| Fullscreen mode     | Immersive viewing |

Product Gallery Features
Variant-Aware Media

Behavior:
Changing color/size updates gallery images.

Very common in apparel.

Zoom Systems
| Type       | Description            |
| ---------- | ---------------------- |
| Hover zoom | Desktop magnifier      |
| Click zoom | Enlarged modal         |
| Lens zoom  | Magnifying glass       |
| Deep zoom  | High-resolution viewer |

360° Product Viewer

Interactive rotational product preview.

Common for:

Sneakers
Electronics
Luxury products
Physical store location

Advanced Media Types
Video Integration

Gallery supports:

Product videos
Lifestyle clips
Tutorials

Technical names:

Mixed Media Gallery
Rich Media Gallery
AR/3D Models

Advanced commerce systems include:

WebGL viewers
Augmented reality
Interactive 3D products

Common in:

Furniture
Tech
Luxury retail

Pagination Controls
| Control      | Description      |
| ------------ | ---------------- |
| Arrows       | Previous/next    |
| Dots         | Slide indicators |
| Progress bar | Scroll progress  |
| Drag/swipe   | Gesture control  |

Responsive Gallery Settings
Mobile Adaptations
| Setting                  | Description          |
| ------------------------ | -------------------- |
| Swipe navigation         | Touch gestures       |
| Reduced columns          | Fewer grid items     |
| Lazy media loading       | Performance          |
| Simplified hover effects | Mobile compatibility |

Performance Optimization

Critical because galleries are media-heavy.

Common Techniques
| Technique         | Purpose                |
| ----------------- | ---------------------- |
| Lazy loading      | Faster initial load    |
| Responsive images | Device optimization    |
| WebP/AVIF         | Compression            |
| CDN delivery      | Faster global access   |
| Skeleton loaders  | Better perceived speed |


Accessibility Features
| Feature             | Description         |
| ------------------- | ------------------- |
| Alt text            | Screen readers      |
| Keyboard navigation | Accessibility       |
| Focus states        | Interactive clarity |
| Reduced motion      | Animation safety    |


Common E-Commerce Use Cases
Product Showcase Gallery

Purpose:
Highlight products visually.

Lifestyle Gallery

Purpose:
Show products in real-world usage.

Very common in:

Apparel
Home decor
Outdoor brands
Instagram/Social Gallery

Technical names:

Social Feed Integration
UGC Gallery

UGC = User Generated Content.

Often used for:

Social proof
Community branding

### FOOTER (NEW)

Footer

The Footer is the terminal navigation and utility section of a website.
In e-commerce, it serves as:

Secondary navigation
Trust reinforcement
Support access
Legal/compliance area
Conversion support
SEO/internal linking structure

A professional footer is usually highly modular and content-dense.

Typical Footer Structure
┌─────────────────────────────┐
│ Newsletter Signup           │
├─────────────────────────────┤
│ Footer Navigation Columns   │
│ Links | Links | Links       │
├─────────────────────────────┤
│ Socials / Payments / Legal  │
└─────────────────────────────┘

Common Technical Names
| Name           | Usage                     |
| -------------- | ------------------------- |
| Global Footer  | Site-wide footer          |
| Utility Footer | Functional links          |
| Fat Footer     | Large multi-column footer |
| Minimal Footer | Reduced content           |
| Mega Footer    | Enterprise-scale footer   |


Core Footer Components
| Component        | Technical Name    | Description         |
| ---------------- | ----------------- | ------------------- |
| Navigation links | Footer Navigation | Secondary menus     |
| Newsletter form  | Email Capture     | Lead generation     |
| Social icons     | Social Links      | External platforms  |
| Legal section    | Compliance Block  | Terms/privacy       |
| Payment icons    | Payment Methods   | Trust indicators    |
| Contact info     | Support Section   | Customer assistance |

Common Footer Layout Types
1. Multi-Column Footer

Most common.
Usually contains:

Shop links
Company info
Support
Policies
2. Minimal Footer

Characteristics:

Few links
Clean whitespace
Reduced clutter

Common in:

Luxury brands
Portfolio commerce
Minimalist stores
3. Fat Footer

Technical names:

Expanded Footer
Mega Footer

Characteristics:

Many navigation groups
Large internal link structure
SEO-heavy

Common in:

Marketplaces
Large catalogs
Enterprise commerce
4. Accordion Footer (Mobile)

Behavior:
Footer sections collapse/expand.

Very common on mobile.

Footer Navigation Systems
Common Navigation Groups
Usually contains:

Shop links
Company info
Support
Policies
2. Minimal Footer

Characteristics:

Few links
Clean whitespace
Reduced clutter

Common in:

Luxury brands
Portfolio commerce
Minimalist stores
3. Fat Footer

Technical names:

Expanded Footer
Mega Footer

Characteristics:

Many navigation groups
Large internal link structure
SEO-heavy

Common in:

Marketplaces
Large catalogs
Enterprise commerce
4. Accordion Footer (Mobile)

Behavior:
Footer sections collapse/expand.

Very common on mobile.

Footer Navigation Systems
Common Navigation Groups
| Group   | Typical Content        |
| ------- | ---------------------- |
| Shop    | Categories/collections |
| Support | FAQ/contact/shipping   |
| Company | About/careers          |
| Legal   | Privacy/terms          |
| Account | Login/orders           |

Link Behaviors
| Feature             | Description            |
| ------------------- | ---------------------- |
| Hover underline     | Interaction feedback   |
| Active states       | Current section        |
| External indicators | Outbound links         |
| Nested menus        | Multi-level footer nav |

Social Media Section

Technical names:

Social Bar
Social Links Module

Common platforms:

Instagram
TikTok
YouTube
Pinterest
Facebook
Payment & Trust Section

Usually near the bottom.

Common Elements
| Element             | Purpose               |
| ------------------- | --------------------- |
| Payment icons       | Accepted payments     |
| SSL/security badges | Trust                 |
| Certifications      | Compliance            |
| Shipping partners   | Logistics reassurance |


Legal/Compliance Area

Very important in e-commerce.

Common Links
| Link             | Purpose               |
| ---------------- | --------------------- |
| Privacy Policy   | Data compliance       |
| Terms of Service | Legal protection      |
| Refund Policy    | Commerce transparency |
| Cookie Policy    | Tracking disclosure   |

Footer Styling Systems
Background Variants
| Style              | Technical Name    |
| ------------------ | ----------------- |
| Dark footer        | Inverse Footer    |
| Light footer       | Standard Footer   |
| Gradient footer    | Decorative Footer |
| Transparent footer | Overlay Footer    |

Typography Settings
| Setting        | Description            |
| -------------- | ---------------------- |
| Link size      | Navigation readability |
| Heading weight | Section emphasis       |
| Line spacing   | Vertical rhythm        |
| Hover states   | Interaction feedback   |

Responsive Footer Behavior
Mobile Footer Patterns
| Pattern              | Description        |
| -------------------- | ------------------ |
| Stacked columns      | Vertical layout    |
| Accordion groups     | Expand/collapse    |
| Reduced link density | Simplified nav     |
| Sticky mobile CTA    | Persistent actions |

Advanced Footer Features
Store Locator Integration

Embedded:

Maps
Region selectors
Physical stores
Region & Currency Selection

Technical names:

Localization Selector
Geo Switcher

Common in international commerce.

Dynamic Footer Content

Changes based on:

Country
User type
Campaign
Logged-in state
SEO Functions

Footers are important for:

Internal linking
Crawl depth reduction
Category discoverability

Large stores often use:

Extensive footer navigation
Structured data
Semantic markup
Accessibility Features
| Feature             | Description            |
| ------------------- | ---------------------- |
| Semantic landmarks  | `<footer>` element     |
| Keyboard navigation | Accessible links       |
| Focus states        | Interaction visibility |
| Contrast compliance | Readability            |

Performance Considerations

Professional implementations optimize:

SVG icons
Minimal JS
Lazy-loaded embeds
Efficient link rendering

Common E-Commerce Footer Variants
Luxury Footer

Characteristics:

Minimal links
Large spacing
Editorial typography

Seen in:

Apple
Aesop
Marketplace Footer

Characteristics:

Massive navigation
Dense links
Utility-heavy

Seen in:

Amazon
eBay
Fashion Commerce Footer

Characteristics:

Newsletter emphasis
Social-heavy
Visual branding

Seen in:

Zara
Nike
ASOS


## Config

Remove countdown timer. HEADER in Section will take care of it.
