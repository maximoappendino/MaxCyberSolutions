/* MaxCyberSolutions — Dashboard SPA v2 */

// ── Translations ──────────────────────────────────────────────────────────────
const I18N = {
  en: { design:'Design', sections:'Sections', items:'Items', config:'Config',
        newItem:'+ New item', saveDraft:'Save Draft', pushLive:'🚀 Push Live',
        discard:'Discard', noItems:'No items yet.', noSections:'No sections yet. Add one below.' },
  es: { design:'Diseño', sections:'Secciones', items:'Artículos', config:'Config',
        newItem:'+ Nuevo artículo', saveDraft:'Guardar borrador', pushLive:'🚀 Publicar',
        discard:'Descartar', noItems:'Sin artículos todavía.', noSections:'Sin secciones aún. Añade una.' },
  it: { design:'Design', sections:'Sezioni', items:'Articoli', config:'Config',
        newItem:'+ Nuovo articolo', saveDraft:'Salva bozza', pushLive:'🚀 Pubblica',
        discard:'Annulla', noItems:'Nessun articolo ancora.', noSections:'Nessuna sezione. Aggiungine una.' },
  pt: { design:'Design', sections:'Seções', items:'Itens', config:'Config',
        newItem:'+ Novo item', saveDraft:'Salvar rascunho', pushLive:'🚀 Publicar',
        discard:'Descartar', noItems:'Sem itens ainda.', noSections:'Sem seções. Adicione uma.' },
};
function t(key) { return (I18N[dashConfig.lang] || I18N.en)[key] || key; }

// ── Dashboard config (localStorage, UI only) ──────────────────────────────────
let dashConfig = { lang: 'en', size: 'medium', preview: 'desktop', autoRefresh: true, dashStyle: 'warm-linen' };

function loadDashConfig() {
  try { Object.assign(dashConfig, JSON.parse(localStorage.getItem('dash_config') || '{}')); } catch {}
  if (dashConfig.autoRefresh === undefined) dashConfig.autoRefresh = true;
}
function saveDashConfig() {
  localStorage.setItem('dash_config', JSON.stringify(dashConfig));
}

// ── Font catalog ──────────────────────────────────────────────────────────────
const FONT_CATALOG = {
  'System Default':     '',
  'Cormorant Garamond': 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap',
  'Playfair Display':   'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap',
  'EB Garamond':        'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  'Libre Baskerville':  'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
  'Merriweather':       'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;1,300&display=swap',
  'Lora':               'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&display=swap',
  'DM Sans':            'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap',
  'Inter':              'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap',
  'Nunito':             'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap',
  'Poppins':            'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500&display=swap',
  'Raleway':            'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500&display=swap',
  'Outfit':             'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap',
  'Barlow':             'https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,300;0,400;0,500;1,400&display=swap',
  'Josefin Sans':       'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600&display=swap',
  'JetBrains Mono':     'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
  'IBM Plex Mono':      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap',
  'Space Mono':         'https://fonts.googleapis.com/css2?family=Space+Mono&display=swap',
  'Bebas Neue':         'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
  'Pacifico':           'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  'Oswald':             'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500&display=swap',
  'Orbitron':           'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap',
};

// ── Section type definitions ──────────────────────────────────────────────────
const SECTION_TYPES = {
  header: {
    label: 'Header', icon: '⊤',
    defaults: {
      announcementEnabled: false, announcementType: 'top-bar',
      announcementText: 'Free shipping on orders over $50',
      announcementSticky: true, announcementDismissible: true,
      announcementBg: '#1c1a16', announcementColor: '#e2a14a', announcementHeight: 40,
      countdownEnabled: false, countdownEnd: '',
      layout: 'left-aligned', sticky: 'smart', stickyStyle: 'solid',
      showSearch: true, showAccount: true, showWishlist: false, showCart: true,
      showLanguage: true, showCurrency: false, showBorderBottom: true,
    },
  },
  hero: {
    label: 'Hero Banner', icon: '◈',
    defaults: {
      headline: 'Welcome', subline: '', layout: 'static', image: '', images: [],
      overlay: 0.45, align: 'left', verticalAlign: 'middle',
      heightMode: 'auto', fixedHeight: 600,
      imgPosition: 'center', imgFit: 'cover',
      cta: { label: 'Shop now', url: '#products', style: 'solid' },
      cta2: { label: '', url: '', style: 'outline' },
      videoUrl: '',
    },
  },
  'product-grid': {
    label: 'Product Grid', icon: '⊞',
    defaults: {
      title: 'All products.', tag: '§ Catalogue',
      layout: 'classic',
      columns: 3, colsMobile: 1,
      showOutOfStock: true, maxProducts: 0,
      imgRatio: '4/3', hoverEffect: 'zoom',
      cardShowImage: true, cardShowBadge: true, cardShowTitle: true,
      cardShowDescription: true, cardShowCategory: false, cardShowPrice: true, cardShowRating: false, cardShowCTA: true,
      showFilters: false, showSort: false,
      selectedProducts: [],
    },
  },
  'text-banner': {
    label: 'Text Banner', icon: '▬',
    defaults: {
      bannerType: 'promo', layout: 'single',
      text: 'Announcement text', subtitle: '',
      bg: '#1c1a16', color: '#e2a14a', align: 'center',
      ctaLabel: '', ctaUrl: '', ctaStyle: 'outline',
      sticky: false, dismissible: false,
    },
  },
  'image-gallery': {
    label: 'Image Gallery', icon: '⊟',
    defaults: {
      title: '', layout: 'classic', columns: 3,
      ratio: '1/1', hoverEffect: 'zoom', clickAction: 'lightbox',
      bg: '', color: '', images: [],
    },
  },
  'floating-cta': {
    label: 'Floating Button', icon: '◎',
    defaults: {
      icon: 'whatsapp', label: 'Chat with us', url: '',
      position: 'bottom-right', color: '#25D366',
      size: 'medium', pulse: false,
    },
  },
  'rich-text': {
    label: 'Text Block', icon: '¶',
    defaults: {
      heading: '', headingLevel: 'h2', subheading: '',
      body: '', content: '',
      ctaLabel: '', ctaUrl: '', ctaStyle: 'solid',
      align: 'left', layout: 'simple', maxWidth: 'normal',
      bgColor: '', padding: 'normal',
    },
  },
  footer: {
    label: 'Footer', icon: '⊥',
    defaults: {
      layout: 'multi-column',
      newsletterEnabled: true,
      newsletterTitle: 'Stay in the loop.',
      newsletterText: 'New arrivals, exclusive drops.',
      socialInstagram: '', socialTiktok: '', socialYoutube: '',
      socialFacebook: '', socialPinterest: '',
      contactEmail: '', contactPhone: '', contactAddress: '',
      nav1Title: 'Shop', nav1Links: '',
      nav2Title: 'Company', nav2Links: '',
      nav3Title: 'Support', nav3Links: '',
      showPaymentIcons: true, copyrightText: '',
      privacyUrl: '', termsUrl: '', refundUrl: '',
    },
  },
};

const PANEL_SIZES = { small: '280px', medium: '360px', large: '440px' };

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'max', name: 'Max', icon: '◈',
    desc: 'Editorial e-commerce. Clean hero, product grid, rich text.',
    palette: 'max', style: 'max',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Crafted for the few.', subline: 'Minimal store. Maximum impact.',
        align: 'left', cta: { label: 'Shop now', url: '#products', style: 'solid' } },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'All products.', tag: '§ Catalogue', layout: 'classic', columns: 3 },
      { id: uid(), type: 'rich-text', ...SECTION_TYPES['rich-text'].defaults,
        heading: 'About this store.', body: 'Tell your story here.', align: 'left' },
    ],
  },
  {
    id: 'alexis', name: 'Alexis', icon: '▪',
    desc: 'Brutalist industrial. Hard edges, marquee banner, list layout.',
    palette: 'alexis', style: 'alexis',
    sections: () => [
      { id: uid(), type: 'text-banner', ...SECTION_TYPES['text-banner'].defaults,
        layout: 'marquee', text: 'NEW DROP — NOW LIVE — SHOP NOW — NO HOLDS —',
        bg: '#FF3E00', color: '#000000', sticky: false },
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Built to last.', subline: 'No compromises. No excess.',
        align: 'left', cta: { label: 'View catalogue', url: '#products', style: 'solid' } },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Catalogue.', tag: '▪ STOCK', layout: 'list', columns: 1 },
    ],
  },
  {
    id: 'alicia', name: 'Alicia', icon: '◎',
    desc: 'Elegant dark. Image hero, gallery portfolio, featured grid.',
    palette: 'alicia', style: 'alicia',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Portfolio.', subline: 'Selected work.',
        align: 'center', overlay: 0.6,
        cta: { label: 'Explore', url: '#products', style: 'outline' } },
      { id: uid(), type: 'image-gallery', ...SECTION_TYPES['image-gallery'].defaults,
        layout: 'featured', columns: 3 },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Services.', tag: '◎ Work', layout: 'alicia', columns: 3,
        imgRatio: '4/5', hoverEffect: 'none' },
    ],
  },
  {
    id: 'ciro', name: 'Ciro', icon: '◌',
    desc: 'Smooth & minimal. Centered hero, intro text, clean grid.',
    palette: 'ciro', style: 'ciro',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Welcome.', subline: 'Discover what we do best.',
        align: 'center', cta: { label: 'Get started', url: '#products', style: 'solid' } },
      { id: uid(), type: 'rich-text', ...SECTION_TYPES['rich-text'].defaults,
        heading: 'What we offer.', body: 'A short intro about your products or services.',
        align: 'center', maxWidth: 'narrow' },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Our catalogue.', tag: '◌ Services', layout: 'classic', columns: 3 },
    ],
  },
  {
    id: 'emilse', name: 'Emilse', icon: '◍',
    desc: 'Elegant & eventful. Announce banner, image hero, featured grid, gallery.',
    palette: 'emilse', style: 'emilse',
    sections: () => [
      { id: uid(), type: 'text-banner', ...SECTION_TYPES['text-banner'].defaults,
        text: 'New arrivals every week.', bg: '#b94e5e', color: '#ffffff', align: 'center' },
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Every moment counts.', subline: 'Curated experiences for every occasion.',
        align: 'center', overlay: 0.5,
        cta: { label: 'Shop now', url: '#products', style: 'solid' } },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Latest arrivals.', tag: '◍ New in', layout: 'emilse', columns: 3,
        imgRatio: '4/3', hoverEffect: 'zoom' },
      { id: uid(), type: 'image-gallery', ...SECTION_TYPES['image-gallery'].defaults,
        title: 'Inspiration.', layout: 'classic', columns: 3 },
    ],
  },
  {
    id: 'frank', name: 'Frank', icon: '⬡',
    desc: 'Futuristic tech. Hero, marquee, minimal grid, rich text.',
    palette: 'frank', style: 'frank',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Next level.', subline: 'Technology that works for you.',
        align: 'left', overlay: 0.6,
        cta: { label: 'Explore →', url: '#products', style: 'solid' } },
      { id: uid(), type: 'text-banner', ...SECTION_TYPES['text-banner'].defaults,
        layout: 'marquee', text: 'FAST — RELIABLE — INNOVATIVE — SECURE — SCALABLE —',
        bg: '#0a0a0f', color: '#00f0ff', sticky: false },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Products.', tag: '⬡ Catalogue', layout: 'frank', columns: 4,
        imgRatio: '4/3', hoverEffect: 'zoom' },
      { id: uid(), type: 'rich-text', ...SECTION_TYPES['rich-text'].defaults,
        heading: 'Why us.', body: 'Built different. Engineered to perform.',
        align: 'center', maxWidth: 'narrow' },
    ],
  },
  {
    id: 'gaspar', name: 'Gaspar', icon: '⊞',
    desc: 'Gaming platform. Full-image hero, dense filtered grid, announce banner.',
    palette: 'gaspar', style: 'gaspar',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Play different.', subline: 'The ultimate collection.',
        align: 'center', overlay: 0.55,
        cta: { label: 'Browse all', url: '#products', style: 'solid' } },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Most popular.', tag: '⊞ Top picks', layout: 'gaspar', columns: 4,
        showFilters: true, showSort: true },
      { id: uid(), type: 'text-banner', ...SECTION_TYPES['text-banner'].defaults,
        text: 'Free shipping on orders over $50', bg: '#e75e8d', color: '#ffffff', align: 'center' },
    ],
  },
  {
    id: 'nani', name: 'Nani', icon: '◈',
    desc: 'Luxury boutique. Transparent header, editorial hero, gallery, spacious grid.',
    palette: 'nani', style: 'nani',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'Timeless.', subline: 'Handcrafted for those who know.',
        align: 'center', overlay: 0.35,
        cta: { label: 'Discover the collection', url: '#products', style: 'outline' } },
      { id: uid(), type: 'image-gallery', ...SECTION_TYPES['image-gallery'].defaults,
        title: 'The collection.', layout: 'minimal', columns: 2 },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Shop.', tag: '◈ New arrivals', layout: 'nani', columns: 3,
        imgRatio: '4/5', cardShowDescription: false },
      { id: uid(), type: 'rich-text', ...SECTION_TYPES['rich-text'].defaults,
        heading: 'The craft.', subheading: 'Every detail, intentional.',
        body: 'Share your story here.', align: 'center', maxWidth: 'narrow', padding: 'lg' },
    ],
  },
  {
    id: 'saira', name: 'Saira', icon: '◉',
    desc: 'Photography & creative. Full-width hero, featured gallery, services grid.',
    palette: 'saira', style: 'saira',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'See the world differently.', subline: 'Visual stories worth telling.',
        align: 'center', overlay: 0.4,
        cta: { label: 'View work', url: '#products', style: 'solid' } },
      { id: uid(), type: 'image-gallery', ...SECTION_TYPES['image-gallery'].defaults,
        layout: 'featured', columns: 3, hoverEffect: 'zoom' },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Services.', tag: '◉ Packages', layout: 'saira', columns: 3, imgRatio: '4/3' },
    ],
  },
  {
    id: 'vivi', name: 'Vivi', icon: '◫',
    desc: 'Fashion e-commerce. Banner, hero, full filtered grid, lookbook gallery.',
    palette: 'vivi', style: 'vivi',
    sections: () => [
      { id: uid(), type: 'text-banner', ...SECTION_TYPES['text-banner'].defaults,
        text: '✦ Free returns ✦ New season now live ✦ Worldwide shipping',
        bg: '#1a1a1a', color: '#C9A96E', align: 'center' },
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults,
        headline: 'New season.', subline: 'Fresh styles, curated for you.',
        align: 'left', overlay: 0.35,
        cta: { label: 'Shop the collection', url: '#products', style: 'solid' } },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults,
        title: 'Latest drops.', tag: '◫ New in', layout: 'vivi', columns: 4,
        imgRatio: '4/5', showFilters: false, showSort: false },
      { id: uid(), type: 'image-gallery', ...SECTION_TYPES['image-gallery'].defaults,
        title: 'Lookbook.', layout: 'classic', columns: 3, hoverEffect: 'overlay', ratio: '4/5' },
      { id: uid(), type: 'floating-cta', ...SECTION_TYPES['floating-cta'].defaults,
        icon: 'whatsapp', label: 'Chat', url: '', color: '#25D366' },
    ],
  },
];

// ── Visual styles (shapes, borders, shadows — no colours) ─────────────────────
const VISUAL_STYLES = [
  {
    id: 'max', name: 'Max', icon: '—',
    desc: 'Editorial flat. Sharp edges, hairline borders, no shadow.',
    preview: ['—', '□', '▭'],
    vars: { '--s-radius': '0px', '--s-radius-btn': '0px', '--s-radius-sm': '0px', '--s-border-w': '1px', '--s-shadow': 'none', '--s-shadow-card': 'none' },
  },
  {
    id: 'alexis', name: 'Alexis', icon: '▪',
    desc: 'Brutalist industrial. 4px borders, hard offset drop shadow.',
    preview: ['▪', '▬', '◼'],
    vars: { '--s-radius': '0px', '--s-radius-btn': '0px', '--s-radius-sm': '0px', '--s-border-w': '4px', '--s-shadow': '4px 4px 0 var(--ink)', '--s-shadow-card': '8px 8px 0 var(--ink)' },
  },
  {
    id: 'alicia', name: 'Alicia', icon: '◎',
    desc: 'Dark modern. Subtle radius, layered soft shadow.',
    preview: ['◎', '▢', '⬭'],
    vars: { '--s-radius': '6px', '--s-radius-btn': '6px', '--s-radius-sm': '4px', '--s-border-w': '1px', '--s-shadow': '0 2px 16px rgba(0,0,0,.45)', '--s-shadow-card': '0 4px 28px rgba(0,0,0,.55)' },
  },
  {
    id: 'ciro', name: 'Ciro', icon: '◌',
    desc: 'Smooth & pill. Generous radius, pill buttons, gentle depth.',
    preview: ['◌', '⬮', '⬭'],
    vars: { '--s-radius': '12px', '--s-radius-btn': '48px', '--s-radius-sm': '8px', '--s-border-w': '1px', '--s-shadow': '0 2px 12px rgba(0,0,0,.06)', '--s-shadow-card': '0 4px 20px rgba(0,0,0,.09)' },
  },
  {
    id: 'emilse', name: 'Emilse', icon: '◍',
    desc: 'Elegant rounded. Soft corners, medium shadow, refined.',
    preview: ['◍', '▢', '●'],
    vars: { '--s-radius': '10px', '--s-radius-btn': '20px', '--s-radius-sm': '6px', '--s-border-w': '1px', '--s-shadow': '0 4px 20px rgba(0,0,0,.08)', '--s-shadow-card': '0 6px 28px rgba(0,0,0,.11)' },
  },
  {
    id: 'frank', name: 'Frank', icon: '⬡',
    desc: 'Futuristic tech. Tight radius, glow shadow, no heavy borders.',
    preview: ['⬡', '▭', '◻'],
    vars: { '--s-radius': '4px', '--s-radius-btn': '4px', '--s-radius-sm': '3px', '--s-border-w': '1px', '--s-shadow': '0 0 0 1px rgba(0,240,255,.12)', '--s-shadow-card': '0 0 24px rgba(0,240,255,.08)' },
  },
  {
    id: 'gaspar', name: 'Gaspar', icon: '⊞',
    desc: 'Gaming platform. Very rounded containers, thick 2px border.',
    preview: ['⊞', '◍', '●'],
    vars: { '--s-radius': '20px', '--s-radius-btn': '20px', '--s-radius-sm': '12px', '--s-border-w': '2px', '--s-shadow': 'none', '--s-shadow-card': 'none' },
  },
  {
    id: 'nani', name: 'Nani', icon: '◈',
    desc: 'Luxury hairline. Zero radius, whisper-thin borders, micro shadow.',
    preview: ['◈', '□', '▭'],
    vars: { '--s-radius': '0px', '--s-radius-btn': '0px', '--s-radius-sm': '0px', '--s-border-w': '1px', '--s-shadow': '0 1px 8px rgba(0,0,0,.04)', '--s-shadow-card': '0 2px 16px rgba(0,0,0,.06)' },
  },
  {
    id: 'saira', name: 'Saira', icon: '◉',
    desc: 'Photo card. Rounded cards, borderless, generous shadow.',
    preview: ['◉', '▢', '◍'],
    vars: { '--s-radius': '8px', '--s-radius-btn': '8px', '--s-radius-sm': '6px', '--s-border-w': '0px', '--s-shadow': '0 8px 32px rgba(0,0,0,.12)', '--s-shadow-card': '0 12px 40px rgba(0,0,0,.15)' },
  },
  {
    id: 'vivi', name: 'Vivi', icon: '◫',
    desc: 'Fashion clean. Sharp edges, hairline borders, card micro shadow.',
    preview: ['◫', '□', '▭'],
    vars: { '--s-radius': '0px', '--s-radius-btn': '2px', '--s-radius-sm': '0px', '--s-border-w': '1px', '--s-shadow': 'none', '--s-shadow-card': '0 2px 8px rgba(0,0,0,.07)' },
  },
];

// ── Colour palettes ───────────────────────────────────────────────────────────
const PALETTES = [
  {
    id: 'max', name: 'Max', icon: '◈',
    desc: 'Warm cream, golden amber, dark editorial ink.',
    swatches: ['#efeae0', '#e2a14a', '#1c1a16'],
    theme: { bg: '#efeae0', accent: '#e2a14a', fg: '#1c1a16' },
  },
  {
    id: 'alexis', name: 'Alexis', icon: '▪',
    desc: 'Off-white canvas, neon red-orange, solid black.',
    swatches: ['#F5F5F0', '#FF3E00', '#000000'],
    theme: { bg: '#F5F5F0', accent: '#FF3E00', fg: '#000000' },
  },
  {
    id: 'alicia', name: 'Alicia', icon: '◎',
    desc: 'Deep black, warm amber gold, bright white.',
    swatches: ['#0d0d0d', '#f39c12', '#f5f5f5'],
    theme: { bg: '#0d0d0d', accent: '#f39c12', fg: '#f5f5f5' },
  },
  {
    id: 'ciro', name: 'Ciro', icon: '◌',
    desc: 'Pure white, vibrant orange, near-black.',
    swatches: ['#ffffff', '#ff7d27', '#1a1a1a'],
    theme: { bg: '#ffffff', accent: '#ff7d27', fg: '#1a1a1a' },
  },
  {
    id: 'emilse', name: 'Emilse', icon: '◍',
    desc: 'Blush white, mauve rose, deep plum.',
    swatches: ['#fdf8f8', '#b94e5e', '#2a1a1f'],
    theme: { bg: '#fdf8f8', accent: '#b94e5e', fg: '#2a1a1f' },
  },
  {
    id: 'frank', name: 'Frank', icon: '⬡',
    desc: 'Void black, electric cyan, ghost white.',
    swatches: ['#0a0a0f', '#00f0ff', '#e8e8ed'],
    theme: { bg: '#0a0a0f', accent: '#00f0ff', fg: '#e8e8ed' },
  },
  {
    id: 'gaspar', name: 'Gaspar', icon: '⊞',
    desc: 'Dark charcoal, hot pink, bright white.',
    swatches: ['#1e1e1e', '#e75e8d', '#ffffff'],
    theme: { bg: '#1e1e1e', accent: '#e75e8d', fg: '#ffffff' },
  },
  {
    id: 'nani', name: 'Nani', icon: '◈',
    desc: 'Ivory cream, antique gold, soft charcoal.',
    swatches: ['#FFFBF5', '#B8860B', '#1C1C1C'],
    theme: { bg: '#FFFBF5', accent: '#B8860B', fg: '#1C1C1C' },
  },
  {
    id: 'saira', name: 'Saira', icon: '◉',
    desc: 'Clean white, coral red, dark graphite.',
    swatches: ['#ffffff', '#FF6B6B', '#333333'],
    theme: { bg: '#ffffff', accent: '#FF6B6B', fg: '#333333' },
  },
  {
    id: 'vivi', name: 'Vivi', icon: '◫',
    desc: 'Soft white, warm camel, dark ink.',
    swatches: ['#f9f9f9', '#C9A96E', '#1a1a1a'],
    theme: { bg: '#f9f9f9', accent: '#C9A96E', fg: '#1a1a1a' },
  },
];

// ── Dashboard styles (CSS vars applied to the dashboard UI itself) ─────────────
const DASH_STYLES = {
  max: {
    '--accent': '#e2a14a', '--accent-soft': 'rgba(226,161,74,.13)',
    '--cream':  '#efeae0', '--ink':         '#1c1a16',
    '--ink-soft': '#45403a', '--ink-faint': '#7a736a',
    '--rule':   '#d4cdbd', '--rule-soft':   '#e2dccd',
  },
  alexis: {
    '--accent': '#FF3E00', '--accent-soft': 'rgba(255,62,0,.13)',
    '--cream':  '#F5F5F0', '--ink':         '#000000',
    '--ink-soft': '#333333', '--ink-faint': '#777777',
    '--rule':   '#d5d5cc', '--rule-soft':   '#e5e5e0',
  },
  alicia: {
    '--accent': '#f39c12', '--accent-soft': 'rgba(243,156,18,.13)',
    '--cream':  '#0d0d0d', '--ink':         '#f5f5f5',
    '--ink-soft': '#c0c0c0', '--ink-faint': '#808080',
    '--rule':   '#1e1e1e', '--rule-soft':   '#1a1a1a',
  },
  ciro: {
    '--accent': '#ff7d27', '--accent-soft': 'rgba(255,125,39,.13)',
    '--cream':  '#ffffff', '--ink':         '#1a1a1a',
    '--ink-soft': '#4a4a4a', '--ink-faint': '#888888',
    '--rule':   '#e0e0e0', '--rule-soft':   '#f0f0f0',
  },
  emilse: {
    '--accent': '#b94e5e', '--accent-soft': 'rgba(185,78,94,.13)',
    '--cream':  '#fdf8f8', '--ink':         '#2a1a1f',
    '--ink-soft': '#5a3a44', '--ink-faint': '#907080',
    '--rule':   '#e8d8d8', '--rule-soft':   '#f5e8e8',
  },
  frank: {
    '--accent': '#00f0ff', '--accent-soft': 'rgba(0,240,255,.13)',
    '--cream':  '#0a0a0f', '--ink':         '#e8e8ed',
    '--ink-soft': '#a0a0b0', '--ink-faint': '#606080',
    '--rule':   '#1a1a2a', '--rule-soft':   '#141420',
  },
  gaspar: {
    '--accent': '#e75e8d', '--accent-soft': 'rgba(231,94,141,.13)',
    '--cream':  '#1e1e1e', '--ink':         '#ffffff',
    '--ink-soft': '#c0c0c0', '--ink-faint': '#808080',
    '--rule':   '#333333', '--rule-soft':   '#282828',
  },
  nani: {
    '--accent': '#B8860B', '--accent-soft': 'rgba(184,134,11,.13)',
    '--cream':  '#FFFBF5', '--ink':         '#1C1C1C',
    '--ink-soft': '#4a4040', '--ink-faint': '#8a7870',
    '--rule':   '#e8e0d0', '--rule-soft':   '#f0e8d8',
  },
  saira: {
    '--accent': '#FF6B6B', '--accent-soft': 'rgba(255,107,107,.13)',
    '--cream':  '#ffffff', '--ink':         '#333333',
    '--ink-soft': '#666666', '--ink-faint': '#999999',
    '--rule':   '#e0e0e0', '--rule-soft':   '#f0f0f0',
  },
  vivi: {
    '--accent': '#C9A96E', '--accent-soft': 'rgba(201,169,110,.13)',
    '--cream':  '#f9f9f9', '--ink':         '#1a1a1a',
    '--ink-soft': '#4a4a4a', '--ink-faint': '#888888',
    '--rule':   '#d8d8d8', '--rule-soft':   '#e8e8e8',
  },
};

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  owner:           null,
  stores:          [],
  activeStore:     null,
  draft:           null,
  products:        [],
  editingProduct:  null,
  editingSection:  null,
  isDirty:         false,
  previewTimer:    null,
  pushTimer:       null,
  imgUploadTarget: null,
  history:         [],
  future:          [],
  bulkSelected:    new Set(),
  allowEditIds:    false,
  variations:      [],
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadDashConfig();
  setupLoginTabs();
  setupLoginForm();
  setupNewStoreForm();
  setupEditorTabs();
  setupDesignListeners();
  setupSectionControls();
  setupProductModal();
  setupTopBarActions();
  setupConfigTab();
  setupTemplateGallery();
  setupStyleGallery();
  setupPaletteGallery();
  setupBulkBar();
  setupItemsTab();
  applyDashSize(dashConfig.size);
  applyDashStyle(dashConfig.dashStyle || 'max');
  document.addEventListener('keydown', handleKeyboardShortcuts);

  document.getElementById('d-logout').addEventListener('click', logout);
  await checkAuth();
});

// ── Keyboard shortcuts ─────────────────────────────────────────────────────────
function handleKeyboardShortcuts(e) {
  if (!state.activeStore) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  if (mod && e.key === 's') { e.preventDefault(); saveLocalDraft(); updateDirty(false); flash('btn-save-draft', 'Saved ✓'); }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await api('GET', '/api/me');
    if (res.ok) { state.owner = await res.json(); onAuthenticated(); }
    else showScreen('login');
  } catch { showScreen('login'); }
}

function onAuthenticated() {
  document.getElementById('d-bar').style.display    = '';
  document.getElementById('d-email').textContent    = state.owner.email;
  const adminLink = document.getElementById('d-admin-link');
  if (adminLink) adminLink.style.display = state.owner.is_admin ? '' : 'none';
  if (state.owner.onboarded === 0) {
    setupOnboarding();
    showScreen('onboard');
  } else {
    showStoresScreen();
  }
}

async function logout() {
  await api('POST', '/api/auth/logout');
  state.owner = null;
  document.getElementById('d-bar').style.display = 'none';
  showScreen('login');
}

// ── Login ─────────────────────────────────────────────────────────────────────
function setupLoginTabs() {
  const tabs = document.querySelectorAll('.login-tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isReg = tab.dataset.tab === 'register';
    document.getElementById('login-submit').textContent = isReg ? 'Create account →' : 'Sign in →';
    document.querySelector('input[autocomplete]')
      .setAttribute('autocomplete', isReg ? 'new-password' : 'current-password');
    setMsg('login-msg', '', '');
  }));
}

function setupLoginForm() {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const isReg    = document.querySelector('.login-tab.active').dataset.tab === 'register';
    const btn      = document.getElementById('login-submit');

    btn.disabled = true;
    setMsg('login-msg', '', '');

    try {
      const endpoint = isReg ? '/api/auth/register' : '/api/auth/login';
      const res  = await api('POST', endpoint, { email, password });
      const data = await safeJson(res);

      if (!res.ok) {
        setMsg('login-msg', data.error || `Server error (${res.status})`, 'error');
        btn.disabled = false; return;
      }

      if (isReg) {
        const lr = await api('POST', '/api/auth/login', { email, password });
        const ld = await safeJson(lr);
        if (lr.ok) { state.owner = ld; onAuthenticated(); }
        else {
          setMsg('login-msg', 'Account created — please sign in.', 'success');
          document.querySelector('.login-tab[data-tab="signin"]').click();
          btn.disabled = false;
        }
        return;
      }

      state.owner = data;
      onAuthenticated();
    } catch {
      setMsg('login-msg', 'Network error — is the dev server running?', 'error');
      btn.disabled = false;
    }
  });
}

// ── Stores screen ─────────────────────────────────────────────────────────────
async function showStoresScreen() {
  hideEditorBar();
  showScreen('stores');
  await loadStores();
}

async function loadStores() {
  const res = await api('GET', '/api/stores');
  if (!res.ok) return;
  state.stores = await res.json();
  renderStoresGrid();
}

function renderStoresGrid() {
  const grid = document.getElementById('stores-grid');
  if (!state.stores.length) {
    grid.innerHTML = '<p class="empty-msg">No stores yet — create one below.</p>';
    return;
  }
  grid.innerHTML = state.stores.map(s => `
    <div class="store-card">
      <div class="store-card__slug">/store/${esc(s.slug)}</div>
      <div class="store-card__name">${esc(s.name || s.slug)}</div>
      <div class="store-card__actions">
        <button class="btn-ghost btn-sm" onclick="openStore('${esc(s.id)}')">Edit →</button>
        ${state.owner?.is_admin ? `<button class="btn-ghost btn-sm btn-ghost--danger" onclick="deleteStore('${esc(s.id)}')">Delete</button>` : ''}
      </div>
    </div>`).join('');
}

function setupNewStoreForm() {
  const nsBtn = document.getElementById('ns-submit');
  if (!nsBtn) return;
  nsBtn.addEventListener('click', async () => {
    const slug = document.getElementById('ns-slug').value.trim().toLowerCase();
    const name = document.getElementById('ns-name').value.trim();
    const desc = document.getElementById('ns-desc').value.trim();
    if (!slug) { setMsg('ns-msg', 'Slug is required', 'error'); return; }

    nsBtn.disabled = true;
    const res  = await api('POST', '/api/stores', {
      slug, name, config: {
        sections: [],
        seo: { description: desc },
        features: { hasInventoryTracking: true },
      },
    });
    const data = await safeJson(res);

    if (res.ok) {
      ['ns-slug','ns-name','ns-desc'].forEach(id => document.getElementById(id).value = '');
      setMsg('ns-msg', `Store "${data.slug}" created!`, 'success');
      await loadStores();
    } else {
      setMsg('ns-msg', data.error || 'Failed', 'error');
    }
    nsBtn.disabled = false;
  });
}

window.deleteStore = async function(id) {
  const store = state.stores.find(s => s.id === id);
  if (!store || !confirm(`Delete store "${store.slug}"? This also removes all its products.`)) return;
  const res = await api('DELETE', `/api/stores/${id}`);
  if (res.ok) await loadStores();
};

// ── Open store → editor ───────────────────────────────────────────────────────
window.openStore = async function(storeId) {
  const res = await api('GET', `/api/stores/${storeId}`);
  if (!res.ok) return;
  state.activeStore = await res.json();

  const saved    = loadLocalDraft(storeId);
  state.draft    = saved || deepClone(state.activeStore.config || {});
  if (!Array.isArray(state.draft.sections)) state.draft.sections = [];

  state.isDirty        = !!saved;
  state.editingSection = null;
  state.history        = [];
  state.future         = [];
  state.bulkSelected   = new Set();

  await loadProducts();
  loadPaymentSettings(storeId);

  showScreen('editor');
  showEditorBar();
  renderDesignTab();
  renderSectionList();
  renderItemsList();
  renderGlance();
  renderConfigTab();
  updateDirty();
  updateUndoRedoBtns();
  updatePreview();
  document.getElementById('etab-design').scrollTop = 0;
};

// ── Editor tabs ───────────────────────────────────────────────────────────────
function setupEditorTabs() {
  document.querySelectorAll('.etab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.etab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.etab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`etab-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'orders') loadOrders();
    });
  });
}

// ── Top bar actions ────────────────────────────────────────────────────────────
function setupTopBarActions() {
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-discard').addEventListener('click', discardChanges);

  document.getElementById('btn-save-draft').addEventListener('click', () => {
    saveLocalDraft();
    updateDirty(false);
    flash('btn-save-draft', 'Saved ✓');
  });

  document.getElementById('btn-export').addEventListener('click', exportDraft);

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!confirm('Replace current draft with imported config?')) return;
        pushUndo();
        state.draft = imported;
        if (!Array.isArray(state.draft.sections)) state.draft.sections = [];
        state.isDirty        = true;
        state.editingSection = null;
        renderDesignTab();
        renderSectionList();
        closeSectionEditor();
        schedulePreviewSave();
        updateDirty();
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-push-live').addEventListener('click', pushLive);
  document.getElementById('btn-preview-refresh').addEventListener('click', updatePreview);
  document.getElementById('btn-preview-open').addEventListener('click', () => {
    window.open(`/store/${state.activeStore.slug}`, '_blank');
  });
  document.getElementById('btn-preview-desktop').addEventListener('click', () => setPreviewMode('desktop'));
  document.getElementById('btn-preview-mobile').addEventListener('click', ()  => setPreviewMode('mobile'));
}

function showEditorBar() {
  document.getElementById('d-bar-sep').style.display    = '';
  document.getElementById('d-bar-store').textContent    = state.activeStore.name || state.activeStore.slug;
  document.getElementById('d-bar-actions').style.display = '';
  document.getElementById('d-bar-history').style.display = '';
  document.getElementById('btn-push-live').style.display = '';
}

function hideEditorBar() {
  document.getElementById('d-bar-sep').style.display    = 'none';
  document.getElementById('d-bar-store').textContent    = '';
  document.getElementById('d-bar-actions').style.display = 'none';
  document.getElementById('d-bar-history').style.display = 'none';
  document.getElementById('btn-push-live').style.display = 'none';
  document.getElementById('d-bar-dirty').textContent    = '';
}

function updateDirty(dirty) {
  if (dirty !== undefined) state.isDirty = dirty;
  document.getElementById('d-bar-dirty').textContent = state.isDirty ? '● unsaved' : '';
}

function markDirty() {
  state.isDirty = true;
  updateDirty();
  schedulePush();
  schedulePreviewSave();
}

// ── Undo / Redo ───────────────────────────────────────────────────────────────
function pushUndo() {
  state.history.push(deepClone(state.draft));
  if (state.history.length > 50) state.history.shift();
  state.future = [];
  updateUndoRedoBtns();
}

function schedulePush() {
  clearTimeout(state.pushTimer);
  state.pushTimer = setTimeout(() => {
    const last = state.history[state.history.length - 1];
    const cur  = JSON.stringify(state.draft);
    if (!last || JSON.stringify(last) !== cur) {
      state.history.push(deepClone(state.draft));
      if (state.history.length > 50) state.history.shift();
      state.future = [];
      updateUndoRedoBtns();
    }
  }, 600);
}

function undo() {
  if (!state.history.length) return;
  state.future.push(deepClone(state.draft));
  state.draft = state.history.pop();
  afterHistoryJump();
}

function redo() {
  if (!state.future.length) return;
  state.history.push(deepClone(state.draft));
  state.draft = state.future.pop();
  afterHistoryJump();
}

function afterHistoryJump() {
  if (!Array.isArray(state.draft.sections)) state.draft.sections = [];
  state.isDirty = true;
  renderDesignTab();
  renderSectionList();
  if (state.editingSection !== null && state.draft.sections[state.editingSection]) {
    openSectionEditor(state.editingSection);
  } else {
    closeSectionEditor();
  }
  schedulePreviewSave();
  updateDirty(true);
  updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = !state.history.length;
  if (btnRedo) btnRedo.disabled = !state.future.length;
}

// ── Discard changes ───────────────────────────────────────────────────────────
function discardChanges() {
  if (!confirm('Discard all unsaved changes and revert to the last published version?')) return;
  state.draft        = deepClone(state.activeStore.config || {});
  if (!Array.isArray(state.draft.sections)) state.draft.sections = [];
  state.history      = [];
  state.future       = [];
  state.isDirty      = false;
  state.editingSection = null;
  localStorage.removeItem(`draft_${state.activeStore.id}`);
  renderDesignTab();
  renderSectionList();
  closeSectionEditor();
  schedulePreviewSave();
  updateDirty(false);
  updateUndoRedoBtns();
}

// ── Local save / export / import ──────────────────────────────────────────────
function saveLocalDraft() {
  localStorage.setItem(`draft_${state.activeStore.id}`, JSON.stringify({
    draft:   state.draft,
    savedAt: new Date().toISOString(),
  }));
}

function loadLocalDraft(storeId) {
  try {
    const raw = localStorage.getItem(`draft_${storeId}`);
    if (!raw) return null;
    return JSON.parse(raw).draft;
  } catch { return null; }
}

function exportDraft() {
  download(JSON.stringify(state.draft, null, 2), `${state.activeStore.slug}-config.json`, 'application/json');
}

// ── Push live ─────────────────────────────────────────────────────────────────
async function pushLive() {
  if (!confirm('Push changes to the live site?\nThis updates the public storefront immediately.')) return;
  const btn = document.getElementById('btn-push-live');
  btn.disabled = true; btn.textContent = 'Publishing…';

  const res = await api('PUT', `/api/stores/${state.activeStore.id}`, {
    name:   state.draft.name || state.activeStore.name,
    config: state.draft,
  });

  if (res.ok) {
    state.activeStore.config = deepClone(state.draft);
    state.isDirty = false;
    state.history = []; state.future = [];
    updateDirty(false);
    updateUndoRedoBtns();
    localStorage.removeItem(`draft_${state.activeStore.id}`);
    btn.textContent = 'Published ✓';
    setTimeout(() => { btn.textContent = t('pushLive'); btn.disabled = false; }, 2500);
  } else {
    alert('Failed to publish. Check the console.');
    btn.textContent = t('pushLive');
    btn.disabled = false;
  }
}

// ── Preview ───────────────────────────────────────────────────────────────────
async function schedulePreviewSave() {
  clearTimeout(state.previewTimer);
  state.previewTimer = setTimeout(savePreviewDraft, 900);
}

async function savePreviewDraft() {
  if (!state.activeStore || !state.draft) return;
  await api('PUT', `/api/stores/${state.activeStore.id}`, {
    _draft: true,
    name:   state.draft.name || state.activeStore.name,
    config: state.draft,
  });
  if (dashConfig.autoRefresh !== false) updatePreview();
}

function updatePreview() {
  const iframe = document.getElementById('preview-iframe');
  const slug   = state.activeStore?.slug;
  if (!slug) return;
  iframe.src = `/store/${slug}?preview=1&t=${Date.now()}`;
}

function setPreviewMode(mode) {
  dashConfig.preview = mode;
  saveDashConfig();
  const wrap = document.getElementById('preview-frame-wrap');
  const label = document.getElementById('preview-label');
  wrap.className = `preview-frame-wrap${mode === 'mobile' ? ' preview-frame-wrap--mobile' : ''}`;
  label.textContent = mode === 'mobile' ? 'Mobile Preview' : 'Live Preview';
  document.getElementById('btn-preview-desktop').classList.toggle('active', mode === 'desktop');
  document.getElementById('btn-preview-mobile').classList.toggle('active',  mode === 'mobile');
}

// ── Store at a Glance ─────────────────────────────────────────────────────────
function renderGlance() {
  const total    = state.products.length;
  const oos      = state.products.filter(p => !p.in_stock).length;
  const tagCounts = {};
  state.products.forEach(p => {
    if (p.category) {
      p.category.split(',').forEach(t => {
        const s = t.trim();
        if (s) tagCounts[s] = (tagCounts[s] || 0) + 1;
      });
    }
  });
  const topTag = Object.entries(tagCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';

  document.getElementById('glance').innerHTML = `
    <div class="glance__stat">
      <div class="glance__val">${total}</div>
      <div class="glance__lbl">Items</div>
    </div>
    <div class="glance__stat">
      <div class="glance__val">${oos}</div>
      <div class="glance__lbl">Out of stock</div>
    </div>
    <div class="glance__stat">
      <div class="glance__val" style="font-size:13px;line-height:1.3">${esc(topTag)}</div>
      <div class="glance__lbl">Top tag</div>
    </div>`;
}

// ── Design tab ────────────────────────────────────────────────────────────────
function renderDesignTab() {
  const d     = state.draft;
  const theme = d.theme    || {};
  const seo   = d.seo      || {};
  const fonts = theme.fonts || {};

  document.getElementById('d-name').value      = d.name          || '';
  document.getElementById('d-seo-title').value = seo.title       || '';
  document.getElementById('d-seo-desc').value  = seo.description || '';

  setSelectVal('d-font-title-family',  fonts.titleFamily  || 'System Default');
  setSelectVal('d-font-body-family',   fonts.bodyFamily   || 'System Default');
  setSelectVal('d-font-accent-family', fonts.accentFamily || 'System Default');
  setSelectVal('d-font-slogan-family', fonts.sloganFamily || 'System Default');

  renderLogoPicker(d.logo || '');
  renderCustomBtnsList();
}

// ── Hex color helpers ─────────────────────────────────────────────────────────
function hexToColorInput(hex) {
  hex = (hex || '#000000').trim();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = '#' + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
  }
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : '#000000';
}

function isValidHex(hex) {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test((hex || '').trim());
}

function setupHexPair(swId, txtId, setter) {
  const sw  = document.getElementById(swId);
  const txt = document.getElementById(txtId);
  if (!sw || !txt) return;
  sw.addEventListener('input', () => {
    txt.value = sw.value.toUpperCase();
    setter(sw.value);
    markDirty();
  });
  txt.addEventListener('input', () => {
    const v = txt.value.trim();
    if (isValidHex(v)) {
      sw.value = hexToColorInput(v);
      setter(v);
      markDirty();
    }
  });
}

function setupDesignListeners() {
  const watch = (id, setter) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => { setter(e.target.value); markDirty(); });
  };
  watch('d-name',      v => { state.draft.name = v; });
  watch('d-seo-title', v => { ensureObj('seo'); state.draft.seo.title = v; });
  watch('d-seo-desc',  v => { ensureObj('seo'); state.draft.seo.description = v; });

  // Font dropdowns — each select auto-resolves the Google Fonts URL from FONT_CATALOG
  const fontSelects = [
    ['d-font-title-family',  'titleFamily',  'titleUrl'],
    ['d-font-body-family',   'bodyFamily',   'bodyUrl'],
    ['d-font-accent-family', 'accentFamily', 'accentUrl'],
    ['d-font-slogan-family', 'sloganFamily', 'sloganUrl'],
  ];
  fontSelects.forEach(([id, familyKey, urlKey]) => {
    document.getElementById(id)?.addEventListener('change', e => {
      const family = e.target.value;
      const url    = FONT_CATALOG[family] ?? '';
      ensureObj('theme'); ensureObj('theme.fonts');
      state.draft.theme.fonts[familyKey] = family === 'System Default' ? '' : family;
      state.draft.theme.fonts[urlKey]    = url;
      markDirty();
    });
  });

  // Logo upload
  document.getElementById('btn-logo-upload').addEventListener('click', () => {
    state.imgUploadTarget = { type: 'logo' };
    document.getElementById('img-upload-input').click();
  });
  document.getElementById('btn-logo-clear').addEventListener('click', () => {
    state.draft.logo = '';
    renderLogoPicker('');
    markDirty();
  });

  document.getElementById('img-upload-input').addEventListener('change', handleImgUpload);

  // Template gallery button
  document.getElementById('btn-change-tmpl').addEventListener('click', () => {
    document.getElementById('tmpl-overlay').classList.add('active');
  });

  document.getElementById('btn-change-style').addEventListener('click', () => {
    setupStyleGallery();
    document.getElementById('style-overlay').classList.add('active');
  });

  document.getElementById('btn-change-palette').addEventListener('click', () => {
    renderPaletteGallery();
    document.getElementById('palette-overlay').classList.add('active');
  });

  // Custom button add
  document.getElementById('btn-add-custom-btn').addEventListener('click', () => {
    if (!Array.isArray(state.draft.buttons)) state.draft.buttons = [];
    if (state.draft.buttons.length >= 3) { alert('Maximum 3 custom buttons.'); return; }
    state.draft.buttons.push({ text: 'Button', image: '', url: '#', sticky: false, color: '#e2a14a' });
    renderCustomBtnsList();
    markDirty();
  });
}

function renderLogoPicker(url) {
  const wrap  = document.getElementById('logo-preview-wrap');
  const clear = document.getElementById('btn-logo-clear');
  if (url) {
    wrap.innerHTML = `<img src="${esc(url)}" alt="Logo" class="logo-thumb" />`;
    clear.style.display = '';
  } else {
    wrap.innerHTML = `<div class="logo-placeholder">☰</div>`;
    clear.style.display = 'none';
  }
}

function renderCustomBtnsList() {
  const list = document.getElementById('custom-btns-list');
  const btns = Array.isArray(state.draft.buttons) ? state.draft.buttons : [];
  if (!btns.length) { list.innerHTML = ''; return; }

  list.innerHTML = btns.map((b, i) => `
    <div class="field-group" style="margin-bottom:6px">
      <div class="field-group__label">Button ${i+1}</div>
      <div class="form-row">
        <div class="form-field">
          <label>Text</label>
          <input type="text" value="${esc(b.text||'')}" data-cb="${i}" data-cb-key="text" />
        </div>
        <div class="form-field">
          <label>URL</label>
          <input type="text" value="${esc(b.url||'')}" data-cb="${i}" data-cb-key="url" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Color</label>
          <input type="color" value="${esc(b.color||'#e2a14a')}" data-cb="${i}" data-cb-key="color" style="height:32px;padding:2px 4px" />
        </div>
        <div class="form-field" style="justify-content:flex-end">
          <label>Sticky</label>
          <label class="toggle" style="margin-top:6px">
            <input type="checkbox" ${b.sticky?'checked':''} data-cb="${i}" data-cb-key="sticky" />
            <span class="toggle__track"></span><span class="toggle__thumb"></span>
          </label>
        </div>
      </div>
      <button type="button" class="btn-ghost btn-sm btn-ghost--danger" onclick="removeCustomBtn(${i})">Remove</button>
    </div>`).join('');

  list.querySelectorAll('[data-cb]').forEach(el => {
    const ev = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      const i   = parseInt(el.dataset.cb);
      const key = el.dataset.cbKey;
      if (!Array.isArray(state.draft.buttons)) state.draft.buttons = [];
      state.draft.buttons[i][key] = el.type === 'checkbox' ? el.checked : el.value;
      markDirty();
    });
  });
}

window.removeCustomBtn = function(i) {
  state.draft.buttons.splice(i, 1);
  renderCustomBtnsList();
  markDirty();
};

// ── Style gallery (visual styles — shapes, borders, shadows) ──────────────────
function setupStyleGallery() {
  document.getElementById('style-close').addEventListener('click', () => {
    document.getElementById('style-overlay').classList.remove('active');
  });
  document.getElementById('style-overlay').addEventListener('click', e => {
    if (e.target.id === 'style-overlay') document.getElementById('style-overlay').classList.remove('active');
  });

  const cur = state.draft?.style || 'max';
  document.getElementById('style-grid').innerHTML = VISUAL_STYLES.map(s => `
    <div class="gallery-card${s.id === cur ? ' active' : ''}" onclick="applyStyle('${esc(s.id)}')">
      <div class="style-shape-preview">
        <div class="style-shape-preview__btn" style="border-radius:${s.vars['--s-radius-btn']};border-width:${s.vars['--s-border-w']}"></div>
        <div class="style-shape-preview__card" style="border-radius:${s.vars['--s-radius']};border-width:${s.vars['--s-border-w']}"></div>
      </div>
      <div class="gallery-card__icon">${esc(s.icon)}</div>
      <div class="gallery-card__name">${esc(s.name)}</div>
      <div class="gallery-card__desc">${esc(s.desc)}</div>
    </div>`).join('');
}

window.applyStyle = function(id) {
  const style = VISUAL_STYLES.find(s => s.id === id);
  if (!style) return;
  pushUndo();
  state.draft.style = id;
  for (const [k, v] of Object.entries(style.vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  markDirty();
  document.getElementById('style-overlay').classList.remove('active');
  setupStyleGallery();
};

// ── Palette gallery ───────────────────────────────────────────────────────────
function setupPaletteGallery() {
  document.getElementById('palette-close').addEventListener('click', () => {
    document.getElementById('palette-overlay').classList.remove('active');
  });
  document.getElementById('palette-overlay').addEventListener('click', e => {
    if (e.target.id === 'palette-overlay') document.getElementById('palette-overlay').classList.remove('active');
  });

  setupHexPair('pal-bg-sw',     'pal-bg',     () => {});
  setupHexPair('pal-fg-sw',     'pal-fg',     () => {});
  setupHexPair('pal-accent-sw', 'pal-accent', () => {});

  document.getElementById('btn-apply-custom-pal').addEventListener('click', () => {
    const bg     = document.getElementById('pal-bg').value.trim();
    const fg     = document.getElementById('pal-fg').value.trim();
    const accent = document.getElementById('pal-accent').value.trim();
    if (!isValidHex(bg) || !isValidHex(fg) || !isValidHex(accent)) {
      alert('Please enter valid hex colours for all three fields.'); return;
    }
    pushUndo();
    ensureObj('theme');
    state.draft.theme.bg     = bg;
    state.draft.theme.fg     = fg;
    state.draft.theme.accent = accent;
    markDirty();
    document.getElementById('palette-overlay').classList.remove('active');
  });
}

function renderPaletteGallery() {
  document.getElementById('palette-grid').innerHTML = PALETTES.map(p => `
    <div class="gallery-card" onclick="applyPalette('${esc(p.id)}')">
      <div class="style-swatches">
        ${p.swatches.map(c => `<div class="style-swatch" style="background:${esc(c)}"></div>`).join('')}
      </div>
      <div class="gallery-card__name">${esc(p.name)}</div>
      <div class="gallery-card__desc">${esc(p.desc)}</div>
    </div>`).join('');

  const theme = state.draft?.theme || {};
  const setVal = (swId, txtId, val) => {
    const sw  = document.getElementById(swId);
    const txt = document.getElementById(txtId);
    if (sw)  sw.value  = hexToColorInput(val || '#000000');
    if (txt) txt.value = (val || '').toUpperCase();
  };
  setVal('pal-bg-sw',     'pal-bg',     theme.bg     || '#efeae0');
  setVal('pal-fg-sw',     'pal-fg',     theme.fg     || '#1c1a16');
  setVal('pal-accent-sw', 'pal-accent', theme.accent || '#e2a14a');
}

window.applyPalette = function(id) {
  const pal = PALETTES.find(p => p.id === id);
  if (!pal) return;
  pushUndo();
  ensureObj('theme');
  state.draft.theme.bg     = pal.theme.bg;
  state.draft.theme.fg     = pal.theme.fg;
  state.draft.theme.accent = pal.theme.accent;
  markDirty();
  document.getElementById('palette-overlay').classList.remove('active');
};

// ── Dashboard style ───────────────────────────────────────────────────────────
function applyDashStyle(id) {
  const vars = DASH_STYLES[id] || DASH_STYLES['max'];
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }
}

window.selectDashStyle = function(id) {
  dashConfig.dashStyle = id;
  saveDashConfig();
  applyDashStyle(id);
  renderDashStyleGrid();
};

function renderDashStyleGrid() {
  const grid = document.getElementById('dash-style-grid');
  if (!grid) return;
  const cur = dashConfig.dashStyle || 'max';
  grid.innerHTML = PALETTES.map(p => `
    <button class="dash-style-btn${p.id === cur ? ' active' : ''}" onclick="selectDashStyle('${esc(p.id)}')">
      <div class="dash-style-btn__swatch">
        ${p.swatches.map(c => `<div class="dash-style-btn__dot" style="background:${esc(c)}"></div>`).join('')}
      </div>
      <div class="dash-style-btn__name">${esc(p.name)}</div>
    </button>`).join('');
}

// ── Section list ──────────────────────────────────────────────────────────────
const FIXED_SECTION_TYPES = new Set(['header', 'footer']);

function renderSectionList() {
  const list     = document.getElementById('sec-list');
  const sections = state.draft.sections || [];

  if (!sections.length) {
    list.innerHTML = `<p style="padding:16px;font-size:12px;color:var(--fg-faint)">${t('noSections')}</p>`;
  } else {
    list.innerHTML = sections.map((s, i) => {
      const def      = SECTION_TYPES[s.type] || { label: s.type, icon: '?' };
      const isActive = state.editingSection === i;
      const isFixed  = FIXED_SECTION_TYPES.has(s.type);
      const isHidden = !!s.hidden;
      const controls = isFixed
        ? `<button class="sec-item__btn" onclick="event.stopPropagation();toggleSection(${i})" title="${isHidden ? 'Show' : 'Hide'}" style="opacity:${isHidden ? '.4' : '1'}">${isHidden ? '◎' : '●'}</button>`
        : `<button class="sec-item__btn sec-item__btn--del" onclick="event.stopPropagation();removeSection(${i})" title="Delete">✕</button>`;
      const drag = isFixed ? '' : `<span class="sec-item__drag" title="Drag to reorder" onclick="event.stopPropagation()">⠿</span>`;
      return `
<div class="sec-item${isActive ? ' active' : ''}${isFixed ? ' sec-item--fixed' : ''}${isHidden ? ' sec-item--hidden' : ''}" ${isFixed ? '' : `draggable="true"`} data-index="${i}" onclick="editSection(${i})">
  ${drag}
  <span class="sec-item__icon">${def.icon}</span>
  <span class="sec-item__label">${esc(sectionLabel(s, def))}</span>
  <span class="sec-item__btns">${controls}</span>
</div>`;
    }).join('');
    setupDragDrop();
  }

  const ADDABLE = Object.entries(SECTION_TYPES).filter(([type]) => !FIXED_SECTION_TYPES.has(type));
  document.getElementById('sec-add-menu').innerHTML = ADDABLE.map(([type, def]) =>
    `<div class="sec-add-menu__item" onclick="addSection('${type}')">
      <span class="sec-add-menu__icon">${def.icon}</span>
      <span>${esc(def.label)}</span>
    </div>`).join('');
}

window.toggleSection = function(i) {
  const s = state.draft.sections[i];
  if (!s) return;
  s.hidden = !s.hidden;
  markDirty();
  renderSectionList();
};

function sectionLabel(s, def) {
  return s.headline || s.title || s.text || s.label || def.label;
}

function setupSectionControls() {
  const trigger = document.getElementById('sec-add-trigger');
  const menu    = document.getElementById('sec-add-menu');

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? '' : 'none';
  });
  document.addEventListener('click', () => { menu.style.display = 'none'; });
  document.getElementById('sec-editor-close').addEventListener('click', closeSectionEditor);
}

window.addSection = function(type) {
  document.getElementById('sec-add-menu').style.display = 'none';
  const def = SECTION_TYPES[type];
  if (!def) return;
  pushUndo();
  const section = { id: uid(), type, ...deepClone(def.defaults) };
  state.draft.sections.push(section);
  state.editingSection = state.draft.sections.length - 1;
  renderSectionList();
  openSectionEditor(state.editingSection);
  markDirty();
};

window.removeSection = function(i) {
  if (!confirm('Remove this section?')) return;
  pushUndo();
  state.draft.sections.splice(i, 1);
  if (state.editingSection === i) closeSectionEditor();
  else if (state.editingSection > i) state.editingSection--;
  renderSectionList();
  markDirty();
};

window.editSection = function(i) {
  state.editingSection = i;
  renderSectionList();
  openSectionEditor(i);
};

// ── Drag & drop reorder ───────────────────────────────────────────────────────
function setupDragDrop() {
  let dragIdx = null;
  document.querySelectorAll('.sec-item').forEach(el => {
    el.addEventListener('dragstart', () => {
      dragIdx = parseInt(el.dataset.index);
      setTimeout(() => el.style.opacity = '0.4', 0);
    });
    el.addEventListener('dragend', () => {
      el.style.opacity = '';
      document.querySelectorAll('.sec-item').forEach(e => e.classList.remove('drag-over'));
    });
    el.addEventListener('dragover', e => {
      e.preventDefault();
      document.querySelectorAll('.sec-item').forEach(e => e.classList.remove('drag-over'));
      el.classList.add('drag-over');
    });
    el.addEventListener('drop', e => {
      e.preventDefault();
      const dropIdx = parseInt(el.dataset.index);
      if (dragIdx === null || dragIdx === dropIdx) return;
      const dropType = state.draft.sections[dropIdx]?.type;
      if (FIXED_SECTION_TYPES.has(dropType)) return;
      pushUndo();
      const sections = state.draft.sections;
      const [moved]  = sections.splice(dragIdx, 1);
      sections.splice(dropIdx, 0, moved);
      if (state.editingSection === dragIdx) state.editingSection = dropIdx;
      dragIdx = null;
      renderSectionList();
      if (state.editingSection !== null) openSectionEditor(state.editingSection);
      markDirty();
    });
  });
}

// ── Section editor ────────────────────────────────────────────────────────────
function openSectionEditor(i) {
  const section = state.draft.sections[i];
  if (!section) return;
  const def = SECTION_TYPES[section.type] || { label: section.type };

  document.getElementById('sec-editor').style.display       = '';
  document.getElementById('sec-editor-title').textContent   = def.label || section.type;
  document.getElementById('sec-editor-fields').innerHTML    = buildSectionFields(section, i);

  bindSectionFields(i);
}

function closeSectionEditor() {
  state.editingSection = null;
  document.getElementById('sec-editor').style.display = 'none';
  renderSectionList();
}

function buildSectionFields(s, i) {
  switch (s.type) {

    // ── HEADER ────────────────────────────────────────────────────────────────
    case 'header': return [
      fieldGroup('Announcement Bar', [
        fieldToggle('Enable', 'announcementEnabled', !!s.announcementEnabled),
        fieldSelect('Bar type', 'announcementType', s.announcementType || 'top-bar',
          ['top-bar','promo-bar','notification-bar'],
          ['Top Bar','Promo Bar','Notification Bar']),
        fieldTextarea('Message text', 'announcementText', esc(s.announcementText || '')),
        fieldToggle('Sticky bar', 'announcementSticky', s.announcementSticky !== false),
        fieldToggle('Dismissible', 'announcementDismissible', s.announcementDismissible !== false),
        `<div class="form-row">
          ${field('color',  'Bar background', 'announcementBg',    s.announcementBg    || '#1c1a16')}
          ${field('color',  'Bar text color', 'announcementColor', s.announcementColor || '#e2a14a')}
        </div>`,
        field('number', 'Height (px)', 'announcementHeight', s.announcementHeight || 40),
        fieldToggle('Countdown timer', 'countdownEnabled', !!s.countdownEnabled),
        field('text', 'Countdown end (YYYY-MM-DDTHH:MM)', 'countdownEnd', esc(s.countdownEnd || '')),
      ]),
      fieldGroup('Main Header', [
        fieldSelect('Layout', 'layout', s.layout || 'left-aligned',
          ['left-aligned','centered-logo','split-nav','minimal','commerce-focused'],
          ['Left-Aligned Logo','Centered Logo','Split Navigation','Minimal','Commerce-Focused']),
        fieldSelect('Sticky behavior', 'sticky', s.sticky || 'smart',
          ['always','smart','shrinking','partial','floating','none'],
          ['Always Sticky','Smart Sticky','Shrinking Sticky','Partial Sticky','Floating Sticky','None']),
        fieldSelect('Background style', 'stickyStyle', s.stickyStyle || 'solid',
          ['solid','transparent','blur'],
          ['Solid','Transparent','Blur / Glass']),
        fieldToggle('Border bottom',       'showBorderBottom', s.showBorderBottom !== false),
      ]),
      fieldGroup('Header Actions', [
        fieldToggle('Search',            'showSearch',   s.showSearch   !== false),
        fieldToggle('Account',           'showAccount',  s.showAccount  !== false),
        fieldToggle('Wishlist',          'showWishlist', !!s.showWishlist),
        fieldToggle('Cart',              'showCart',     s.showCart     !== false),
        fieldToggle('Language selector', 'showLanguage', s.showLanguage !== false),
        fieldToggle('Currency selector', 'showCurrency', !!s.showCurrency),
      ]),
    ].join('');

    // ── HERO BANNER ───────────────────────────────────────────────────────────
    case 'hero': {
      const isCarousel = s.layout === 'carousel';
      const isVideo    = s.layout === 'video';
      return [
        fieldTextarea('Headline', 'headline', esc(s.headline || '')),
        fieldTextarea('Subheadline', 'subline', esc(s.subline || '')),
        fieldSelect('Layout', 'layout', s.layout || 'static',
          ['static','carousel','video','fullscreen','split'],
          ['Static Image','Carousel','Video','Fullscreen','Split']),
        isCarousel
          ? buildCarouselImages(s.images || [], i)
          : isVideo
            ? field('text', 'Video URL (mp4 or YouTube embed)', 'videoUrl', esc(s.videoUrl || ''))
            : fieldImg('Background image', 'image', s.image, i),
        fieldGroup('Layout & Sizing', [
          fieldSelect('Height mode', 'heightMode', s.heightMode || 'auto',
            ['auto','fixed','fullscreen','adaptive'],
            ['Auto (content)','Fixed height','Fullscreen (100vh)','Adaptive']),
          field('number', 'Fixed height (px)', 'fixedHeight', s.fixedHeight || 600),
          `<div class="form-row">
            ${fieldSelect('H-Align', 'align', s.align || 'left',
              ['left','center','right'], ['Left','Center','Right'])}
            ${fieldSelect('V-Align', 'verticalAlign', s.verticalAlign || 'middle',
              ['top','middle','bottom'], ['Top','Middle','Bottom'])}
          </div>`,
          fieldSelect('Text max-width', 'maxWidth', s.maxWidth || 'normal',
            ['narrow','normal','wide','full'],
            ['Narrow','Normal','Wide','Full']),
        ]),
        fieldGroup('Image Settings', [
          field('text', 'Overlay opacity (0–1)', 'overlay', s.overlay ?? 0.45),
          `<div class="form-row">
            ${fieldSelect('Position', 'imgPosition', s.imgPosition || 'center',
              ['center','top','bottom','left','right'],
              ['Center','Top','Bottom','Left','Right'])}
            ${fieldSelect('Fit', 'imgFit', s.imgFit || 'cover',
              ['cover','contain'], ['Cover','Contain'])}
          </div>`,
        ]),
        fieldGroup('Primary CTA', [
          field('text', 'Button label', 'cta.label', esc((s.cta||{}).label || '')),
          field('text', 'Button URL',   'cta.url',   esc((s.cta||{}).url   || '')),
          fieldSelect('Style', 'cta.style', (s.cta||{}).style || 'solid',
            ['solid','outline','ghost','text'],
            ['Solid','Outline','Ghost','Text link']),
        ]),
        fieldGroup('Secondary CTA', [
          field('text', 'Label', 'cta2.label', esc((s.cta2||{}).label || '')),
          field('text', 'URL',   'cta2.url',   esc((s.cta2||{}).url   || '')),
          fieldSelect('Style', 'cta2.style', (s.cta2||{}).style || 'outline',
            ['solid','outline','ghost','text'],
            ['Solid','Outline','Ghost','Text link']),
        ]),
      ].join('');
    }

    // ── PRODUCT GRID ──────────────────────────────────────────────────────────
    case 'product-grid': return [
      fieldTextarea('Section title', 'title', esc(s.title || '')),
      field('text', 'Tag / label', 'tag', esc(s.tag || '')),
      fieldGroup('Layout', [
        fieldSelect('Grid layout', 'layout', s.layout || 'classic',
          ['classic','list','featured','minimal','nani','alicia','frank','vivi','emilse','gaspar','saira'],
          ['Classic','List','Featured — first item large','Minimal — spacious 2-col','Nani — magazine grid','Alicia — overlay cards','Frank — bento asymmetric','Vivi — horizontal carousel','Emilse — alternating rows','Gaspar — neon glow','Saira — clean + badge price']),
        `<div class="form-row">
          ${fieldSelect('Desktop cols', 'columns', String(s.columns||3),
            ['2','3','4','5','6'], ['2','3','4','5','6'])}
          ${fieldSelect('Mobile cols', 'colsMobile', String(s.colsMobile||1),
            ['1','2'], ['1','2'])}
        </div>`,
        `<div class="form-field">
          <label>Products shown</label>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--fg-soft)">${Array.isArray(s.selectedProducts) && s.selectedProducts.length ? `${s.selectedProducts.length} product${s.selectedProducts.length===1?'':'s'} selected` : 'All products'}</span>
            <button class="btn-ghost btn-sm" type="button" onclick="openProductPicker(${i})">Choose products…</button>
          </div>
        </div>`,
        fieldToggle('Show out-of-stock', 'showOutOfStock', s.showOutOfStock !== false),
      ]),
      fieldGroup('Card Structure', [
        fieldToggle('Image',       'cardShowImage',       s.cardShowImage       !== false),
        fieldToggle('Title',       'cardShowTitle',       s.cardShowTitle       !== false),
        fieldToggle('Description', 'cardShowDescription', s.cardShowDescription !== false),
        fieldToggle('Badges',      'cardShowBadge',       s.cardShowBadge       !== false),
        fieldToggle('Category',    'cardShowCategory',    !!s.cardShowCategory),
        fieldToggle('Price',       'cardShowPrice',       s.cardShowPrice       !== false),
        fieldToggle('Rating',      'cardShowRating',      !!s.cardShowRating),
        fieldToggle('CTA button',  'cardShowCTA',         s.cardShowCTA         !== false),
      ]),
      fieldGroup('Image & Hover', [
        fieldSelect('Image ratio', 'imgRatio', s.imgRatio || '4/3',
          ['1/1','4/3','4/5','16/9','auto'],
          ['Square (1:1)','Landscape (4:3)','Portrait (4:5)','Widescreen (16:9)','Auto']),
        fieldSelect('Hover effect', 'hoverEffect', s.hoverEffect || 'zoom',
          ['none','zoom','fade','overlay'],
          ['None','Zoom','Fade','Overlay']),
      ]),
      fieldGroup('Filters & Sorting', [
        fieldToggle('Show filters', 'showFilters', !!s.showFilters),
        fieldToggle('Show sort', 'showSort', !!s.showSort),
      ]),
    ].join('');

    // ── TEXT BANNER ───────────────────────────────────────────────────────────
    case 'text-banner': return [
      fieldSelect('Banner type', 'bannerType', s.bannerType || 'promo',
        ['promo','trust','brand','info'],
        ['Promotional','Trust / Reassurance','Brand Statement','Informational']),
      fieldSelect('Layout', 'layout', s.layout || 'single',
        ['single','multi-column','split','marquee'],
        ['Single Line','Multi-Column','Split','Scrolling Marquee']),
      fieldTextarea('Main text', 'text', esc(s.text || '')),
      fieldTextarea('Subtitle (optional)', 'subtitle', esc(s.subtitle || '')),
      `<div class="form-row">
        ${field('color', 'Background', 'bg',    s.bg    || '#1c1a16')}
        ${field('color', 'Text color', 'color', s.color || '#e2a14a')}
      </div>`,
      fieldSelect('Alignment', 'align', s.align || 'center', ['left','center','right']),
      fieldGroup('CTA Button', [
        field('text', 'Button label', 'ctaLabel', esc(s.ctaLabel || '')),
        field('text', 'Button URL',   'ctaUrl',   esc(s.ctaUrl   || '')),
        fieldSelect('Style', 'ctaStyle', s.ctaStyle || 'outline',
          ['solid','outline','ghost','text'],
          ['Solid','Outline','Ghost','Text link']),
      ]),
      fieldGroup('Behavior', [
        fieldToggle('Sticky banner', 'sticky', !!s.sticky),
        fieldToggle('Dismissible',   'dismissible', !!s.dismissible),
      ]),
    ].join('');

    // ── IMAGE GALLERY ─────────────────────────────────────────────────────────
    case 'image-gallery': return [
      fieldTextarea('Title (optional)', 'title', esc(s.title || '')),
      fieldSelect('Gallery layout', 'layout', s.layout || 'classic',
        ['classic','list','featured','minimal'],
        ['Classic Grid','List','Featured (first image large)','Minimal (2-col, spacious)']),
      `<div class="form-row">
        ${fieldSelect('Columns', 'columns', String(s.columns||3), ['2','3','4'], ['2','3','4'])}
        ${fieldSelect('Image ratio', 'ratio', s.ratio || '1/1',
          ['1/1','4/3','4/5','16/9'],
          ['Square (1:1)','Landscape (4:3)','Portrait (4:5)','Widescreen (16:9)'])}
      </div>`,
      fieldSelect('Hover effect', 'hoverEffect', s.hoverEffect || 'zoom',
        ['none','zoom','fade','overlay'],
        ['None','Zoom','Fade','Overlay']),
      fieldGroup('Colours', [
        field('color', 'Background', 'bg',    s.bg    || ''),
        field('color', 'Text',       'color', s.color || ''),
      ]),
      buildGalleryImages(s.images || [], i),
    ].join('');

    // ── FLOATING BUTTON ───────────────────────────────────────────────────────
    case 'floating-cta': return [
      fieldSelect('Icon', 'icon', s.icon || 'whatsapp',
        ['whatsapp','phone','email','link'],
        ['WhatsApp','Phone','Email','Custom link']),
      field('text', 'Button label', 'label', esc(s.label || '')),
      field('text', 'URL / link',   'url',   esc(s.url   || '')),
      `<div class="form-row">
        ${fieldSelect('Position', 'position', s.position || 'bottom-right',
          ['bottom-right','bottom-left','top-right','top-left'],
          ['Bottom right','Bottom left','Top right','Top left'])}
        ${fieldSelect('Size', 'size', s.size || 'medium',
          ['small','medium','large'], ['Small','Medium','Large'])}
      </div>`,
      field('color', 'Button color', 'color', s.color || '#25D366'),
      fieldToggle('Pulse animation', 'pulse', !!s.pulse),
    ].join('');

    // ── TEXT BLOCK ────────────────────────────────────────────────────────────
    case 'rich-text': return [
      fieldGroup('Content', [
        `<div class="form-row">
          ${fieldSelect('Heading level', 'headingLevel', s.headingLevel || 'h2',
            ['h1','h2','h3','h4'],['H1','H2','H3','H4'])}
          ${fieldSelect('Layout', 'layout', s.layout || 'simple',
            ['simple','centered','split','cta'],
            ['Simple','Centered','Split (text+image)','CTA focus'])}
        </div>`,
        fieldTextarea('Heading',    'heading',    esc(s.heading    || '')),
        fieldTextarea('Subheading', 'subheading', esc(s.subheading || '')),
        fieldTextarea('Body text',  'body',       esc(s.body       || ''), 4),
      ]),
      fieldGroup('CTA Button', [
        field('text', 'Button label', 'ctaLabel', esc(s.ctaLabel || '')),
        field('text', 'Button URL',   'ctaUrl',   esc(s.ctaUrl   || '')),
        fieldSelect('Style', 'ctaStyle', s.ctaStyle || 'solid',
          ['solid','outline','ghost','text'],
          ['Solid','Outline','Ghost','Text link']),
      ]),
      fieldGroup('Appearance', [
        `<div class="form-row">
          ${fieldSelect('Alignment', 'align', s.align || 'left', ['left','center','right'])}
          ${fieldSelect('Max width', 'maxWidth', s.maxWidth || 'normal',
            ['narrow','normal','wide','full'],
            ['Narrow','Normal','Wide','Full width'])}
        </div>`,
        fieldSelect('Padding', 'padding', s.padding || 'normal',
          ['small','normal','large'], ['Small','Normal','Large']),
        field('color', 'Background color (optional)', 'bgColor', s.bgColor || ''),
      ]),
      fieldGroup('Advanced (raw HTML)', [
        `<div class="form-field"><label>Custom HTML (overrides body above)</label>
          <textarea data-field="content" rows="4"
            style="resize:vertical;font-family:var(--mono);font-size:11px">${esc(s.content||'')}</textarea>
        </div>`,
      ]),
    ].join('');

    // ── FOOTER ────────────────────────────────────────────────────────────────
    case 'footer': return [
      fieldSelect('Footer layout', 'layout', s.layout || 'multi-column',
        ['multi-column','minimal','fat'],
        ['Multi-Column','Minimal','Fat Footer']),
      fieldGroup('Newsletter', [
        fieldToggle('Show newsletter signup', 'newsletterEnabled', s.newsletterEnabled !== false),
        fieldTextarea('Title',     'newsletterTitle', esc(s.newsletterTitle || '')),
        fieldTextarea('Body text', 'newsletterText',  esc(s.newsletterText  || '')),
      ]),
      fieldGroup('Navigation Columns', [
        `<div class="form-row">
          ${field('text', 'Column 1 title', 'nav1Title', esc(s.nav1Title || 'Shop'))}
          ${field('text', 'Column 2 title', 'nav2Title', esc(s.nav2Title || 'Company'))}
        </div>`,
        field('text', 'Column 3 title', 'nav3Title', esc(s.nav3Title || 'Support')),
        fieldTextarea('Column 1 links (Label|URL, one per line)', 'nav1Links', esc(s.nav1Links || ''), 3),
        fieldTextarea('Column 2 links (Label|URL, one per line)', 'nav2Links', esc(s.nav2Links || ''), 3),
        fieldTextarea('Column 3 links (Label|URL, one per line)', 'nav3Links', esc(s.nav3Links || ''), 3),
      ]),
      fieldGroup('Social Links', [
        field('text', 'Instagram', 'socialInstagram', esc(s.socialInstagram || '')),
        field('text', 'TikTok',    'socialTiktok',    esc(s.socialTiktok    || '')),
        field('text', 'YouTube',   'socialYoutube',   esc(s.socialYoutube   || '')),
        field('text', 'Facebook',  'socialFacebook',  esc(s.socialFacebook  || '')),
        field('text', 'Pinterest', 'socialPinterest', esc(s.socialPinterest || '')),
      ]),
      fieldGroup('Contact Info', [
        field('text', 'Email',   'contactEmail',   esc(s.contactEmail   || '')),
        field('text', 'Phone',   'contactPhone',   esc(s.contactPhone   || '')),
        fieldTextarea('Address', 'contactAddress', esc(s.contactAddress || '')),
      ]),
      fieldGroup('Legal & Compliance', [
        fieldToggle('Show payment icons', 'showPaymentIcons', s.showPaymentIcons !== false),
        fieldTextarea('Copyright text', 'copyrightText', esc(s.copyrightText || '')),
        field('text', 'Privacy Policy URL',   'privacyUrl', esc(s.privacyUrl || '')),
        field('text', 'Terms of Service URL', 'termsUrl',   esc(s.termsUrl   || '')),
        field('text', 'Refund Policy URL',    'refundUrl',  esc(s.refundUrl  || '')),
      ]),
    ].join('');

    default: return '<p style="padding:8px;color:var(--fg-faint)">No fields for this section type.</p>';
  }
}

// Field builders
function field(type, label, fieldPath, value) {
  const isColor   = type === 'color';
  const styleAttr = isColor ? ' style="height:38px;padding:3px 6px;"' : '';
  return `<div class="form-field">
    <label>${esc(label)}</label>
    <input type="${type}" data-field="${esc(fieldPath)}" value="${value}"${styleAttr} />
  </div>`;
}

function fieldTextarea(label, fieldPath, value, rows = 2) {
  return `<div class="form-field">
    <label>${esc(label)}</label>
    <textarea data-field="${esc(fieldPath)}" rows="${rows}" style="resize:vertical">${value}</textarea>
  </div>`;
}

function fieldToggle(label, fieldPath, checked) {
  return `<div class="flag-row">
    <span class="flag-row__name">${esc(label)}</span>
    <label class="toggle">
      <input type="checkbox" data-field="${esc(fieldPath)}" ${checked ? 'checked' : ''} />
      <span class="toggle__track"></span>
      <span class="toggle__thumb"></span>
    </label>
  </div>`;
}

function fieldSelect(label, fieldPath, selected, values, labels) {
  const opts = values.map((v, i) =>
    `<option value="${esc(v)}" ${selected === v ? 'selected' : ''}>${esc((labels||values)[i])}</option>`
  ).join('');
  return `<div class="form-field">
    <label>${esc(label)}</label>
    <select data-field="${esc(fieldPath)}">${opts}</select>
  </div>`;
}

function fieldImg(label, fieldPath, currentUrl, sectionIdx) {
  const hasImg = !!currentUrl;
  return `<div class="form-field">
    <label>${esc(label)}</label>
    <div class="img-field">
      <div class="img-field__row">
        ${hasImg
          ? `<img src="${esc(currentUrl)}" class="img-thumb" id="sec-img-thumb-${esc(fieldPath)}" />`
          : `<div class="img-placeholder" id="sec-img-thumb-${esc(fieldPath)}">🖼</div>`}
        <div style="display:flex;flex-direction:column;gap:5px">
          <button type="button" class="btn-ghost btn-sm"
            onclick="triggerSecImgUpload(${sectionIdx},'${esc(fieldPath)}')">Upload</button>
          ${hasImg ? `<button type="button" class="btn-ghost btn-sm"
            onclick="clearSecImg(${sectionIdx},'${esc(fieldPath)}')">Clear</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function fieldGroup(label, fieldsHtml) {
  return `<div class="field-group">
    <span class="field-group__label">${esc(label)}</span>
    ${Array.isArray(fieldsHtml) ? fieldsHtml.join('') : fieldsHtml}
  </div>`;
}

function buildGalleryImages(images, sectionIdx) {
  const rows = images.map((img, gi) => `
    <div class="gallery-row" data-gidx="${gi}">
      <img src="${esc(img.url)}" class="gallery-thumb" onerror="this.style.display='none'" />
      <input type="text" placeholder="Caption"
        value="${esc(img.caption||'')}"
        data-field="images[${gi}].caption" />
      <button type="button" class="btn-ghost btn-sm"
        onclick="removeGalleryImg(${sectionIdx},${gi})">✕</button>
    </div>`).join('');

  return `<div class="form-field">
    <label>Images (${images.length})</label>
    <div id="gallery-img-list">${rows}</div>
    <button type="button" class="btn-ghost btn-sm" style="margin-top:6px"
      onclick="triggerGalleryImgAdd(${sectionIdx})">+ Add image</button>
  </div>`;
}

function buildCarouselImages(images, sectionIdx) {
  const rows = images.map((url, ci) => `
    <div class="gallery-row">
      <img src="${esc(url)}" class="gallery-thumb" onerror="this.style.display='none'" />
      <span style="flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis">${esc(url)}</span>
      <button type="button" class="btn-ghost btn-sm"
        onclick="removeCarouselImg(${sectionIdx},${ci})">✕</button>
    </div>`).join('');

  return `<div class="form-field">
    <label>Carousel images (${images.length})</label>
    <div id="carousel-img-list">${rows}</div>
    <button type="button" class="btn-ghost btn-sm" style="margin-top:6px"
      onclick="triggerCarouselImgAdd(${sectionIdx})">+ Add image</button>
  </div>`;
}

function bindSectionFields(i) {
  const container = document.getElementById('sec-editor-fields');
  container.querySelectorAll('input[data-field], select[data-field], textarea[data-field]').forEach(el => {
    const isColor = el.type === 'color';
    el.addEventListener(isColor ? 'input' : 'change', () => {
      const value = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? parseFloat(el.value) || 0 : el.value);
      setNestedField(state.draft.sections[i], el.dataset.field, value);
      markDirty();
    });
    if ((el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'TEXTAREA') {
      el.addEventListener('input', () => {
        setNestedField(state.draft.sections[i], el.dataset.field, el.value);
        markDirty();
      });
    }
  });
}

// ── Gallery / carousel image actions ──────────────────────────────────────────
window.triggerGalleryImgAdd = function(sectionIdx) {
  state.imgUploadTarget = { type: 'gallery', sectionIdx };
  document.getElementById('img-upload-input').click();
};
window.removeGalleryImg = function(sectionIdx, imgIdx) {
  state.draft.sections[sectionIdx].images.splice(imgIdx, 1);
  openSectionEditor(sectionIdx);
  markDirty();
};
window.triggerCarouselImgAdd = function(sectionIdx) {
  state.imgUploadTarget = { type: 'carousel', sectionIdx };
  document.getElementById('img-upload-input').click();
};
window.removeCarouselImg = function(sectionIdx, imgIdx) {
  state.draft.sections[sectionIdx].images.splice(imgIdx, 1);
  openSectionEditor(sectionIdx);
  markDirty();
};
window.triggerSecImgUpload = function(sectionIdx, fld) {
  state.imgUploadTarget = { type: 'section', sectionIdx, field: fld };
  document.getElementById('img-upload-input').click();
};
window.clearSecImg = function(sectionIdx, fieldPath) {
  setNestedField(state.draft.sections[sectionIdx], fieldPath, '');
  openSectionEditor(sectionIdx);
  markDirty();
};

// ── Image upload handler ──────────────────────────────────────────────────────
async function handleImgUpload(e) {
  const file   = e.target.files[0];
  if (!file) return;
  e.target.value = '';

  const target = state.imgUploadTarget;
  if (!target) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('store_id', state.activeStore.id);

  try {
    const res  = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await safeJson(res);
    if (!res.ok) { alert(data.error || 'Upload failed'); return; }
    const url = data.url;

    if (target.type === 'logo') {
      state.draft.logo = url;
      renderLogoPicker(url);
      markDirty();
    } else if (target.type === 'section') {
      setNestedField(state.draft.sections[target.sectionIdx], target.field, url);
      openSectionEditor(target.sectionIdx);
      markDirty();
    } else if (target.type === 'gallery') {
      if (!Array.isArray(state.draft.sections[target.sectionIdx].images))
        state.draft.sections[target.sectionIdx].images = [];
      state.draft.sections[target.sectionIdx].images.push({ url, caption: '' });
      openSectionEditor(target.sectionIdx);
      markDirty();
    } else if (target.type === 'carousel') {
      if (!Array.isArray(state.draft.sections[target.sectionIdx].images))
        state.draft.sections[target.sectionIdx].images = [];
      state.draft.sections[target.sectionIdx].images.push(url);
      openSectionEditor(target.sectionIdx);
      markDirty();
    } else if (target.type === 'product') {
      document.getElementById('pm-image').value = url;
      renderProductImgPreview(url);
    }
  } finally {
    state.imgUploadTarget = null;
  }
}

// ── Items tab ─────────────────────────────────────────────────────────────────
async function loadProducts() {
  if (!state.activeStore) return;
  const res = await api('GET', `/api/products?store_id=${state.activeStore.id}`);
  if (!res.ok) return;
  state.products = await res.json();
}

function setupItemsTab() {
  document.getElementById('items-search').addEventListener('input', renderItemsList);
  document.getElementById('items-sort').addEventListener('change', renderItemsList);
  document.getElementById('items-filter-tag').addEventListener('change', renderItemsList);
  document.getElementById('items-filter-stock').addEventListener('change', renderItemsList);
  document.getElementById('select-all-items').addEventListener('change', toggleSelectAll);

  document.getElementById('btn-new-item').addEventListener('click', openNewProductModal);
  document.getElementById('btn-dl-template').addEventListener('click', downloadItemTemplate);
  document.getElementById('btn-export-csv').addEventListener('click', exportCsv);
  document.getElementById('btn-export-json-items').addEventListener('click', exportItemsJson);
  document.getElementById('btn-import-items').addEventListener('click', () => {
    document.getElementById('import-items-file').click();
  });
  document.getElementById('import-items-file').addEventListener('change', importItems);
  document.getElementById('btn-fetch-items').addEventListener('click', async () => {
    await loadProducts(); renderItemsList(); renderGlance();
    flash('btn-fetch-items', 'Done ✓');
  });
  document.getElementById('btn-check-links').addEventListener('click', checkBrokenLinks);
}

function allTags() {
  const tags = new Set();
  state.products.forEach(p => {
    if (p.category) {
      p.category.split(',').forEach(t => { const s = t.trim(); if (s) tags.add(s); });
    }
  });
  return [...tags].sort();
}

function renderItemsList() {
  const query      = document.getElementById('items-search').value.toLowerCase();
  const sortBy     = document.getElementById('items-sort').value;
  const filterTag  = document.getElementById('items-filter-tag').value;
  const filterStk  = document.getElementById('items-filter-stock').value;

  // Refresh tag filter options
  const tagSel = document.getElementById('items-filter-tag');
  const curTag = tagSel.value;
  tagSel.innerHTML = '<option value="">All tags</option>' +
    allTags().map(tag => `<option value="${esc(tag)}"${tag===curTag?' selected':''}>${esc(tag)}</option>`).join('');

  let items = [...state.products];
  if (query) items = items.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
  if (filterTag) items = items.filter(p => {
    if (!p.category) return false;
    return p.category.split(',').map(s => s.trim()).includes(filterTag);
  });
  if (filterStk === 'in')     items = items.filter(p => p.in_stock);
  if (filterStk === 'out')    items = items.filter(p => !p.in_stock);
  if (filterStk === 'hidden') items = items.filter(p => !p.visible);

  if (sortBy === 'name')           items.sort((a,b) => a.name.localeCompare(b.name));
  else if (sortBy === 'price-asc') items.sort((a,b) => a.price_cents - b.price_cents);
  else if (sortBy === 'price-desc')items.sort((a,b) => b.price_cents - a.price_cents);

  const list = document.getElementById('items-list');
  if (!items.length) {
    list.innerHTML = `<p class="empty-msg" style="padding:16px">${t('noItems')}</p>`;
    return;
  }

  list.innerHTML = items.map(p => {
    const isSel = state.bulkSelected.has(p.id);
    const draft = !p.visible;
    return `
<div class="item-row" onclick="editProduct('${esc(p.id)}')" style="cursor:pointer">
  <input type="checkbox" class="item-row__check" data-id="${esc(p.id)}" ${isSel?'checked':''} onchange="toggleItemSelect('${esc(p.id)}',this.checked)" onclick="event.stopPropagation()" />
  ${p.image
    ? `<img src="${esc(p.image)}" class="item-row__thumb" alt="" onerror="this.style.opacity=0.2" />`
    : `<div class="item-row__thumb"></div>`}
  <span class="item-row__name${draft?' item-row__name--draft':''}" title="${esc(p.name)}">${esc(p.name)}${draft?' [hidden]':''}</span>
  <span class="item-row__price">$${esc((p.price_cents/100).toFixed(2))}</span>
  <span class="item-row__btns">
    <button class="item-row__btn" onclick="event.stopPropagation();duplicateProduct('${esc(p.id)}')" title="Duplicate">⊕</button>
    <button class="item-row__btn item-row__btn--del" onclick="event.stopPropagation();deleteProduct('${esc(p.id)}')" title="Delete">✕</button>
  </span>
</div>`;
  }).join('');
}

// Bulk select
window.toggleItemSelect = function(id, checked) {
  if (checked) state.bulkSelected.add(id); else state.bulkSelected.delete(id);
  updateBulkBar();
};
function toggleSelectAll() {
  const checked = document.getElementById('select-all-items').checked;
  state.bulkSelected = checked ? new Set(state.products.map(p => p.id)) : new Set();
  renderItemsList();
  updateBulkBar();
}
function updateBulkBar() {
  const bar   = document.getElementById('bulk-bar');
  const count = state.bulkSelected.size;
  bar.classList.toggle('visible', count > 0);
  document.getElementById('bulk-count').textContent = `${count} selected`;
}

function setupBulkBar() {
  document.getElementById('btn-bulk-apply').addEventListener('click', bulkApply);
  document.getElementById('btn-bulk-clear').addEventListener('click', () => {
    state.bulkSelected = new Set();
    document.getElementById('select-all-items').checked = false;
    renderItemsList();
    updateBulkBar();
  });
}

async function bulkApply() {
  if (!state.bulkSelected.size) return;
  const tags   = document.getElementById('bulk-tag-input').value.trim();
  const priceS = document.getElementById('bulk-price-input').value;
  const visS   = document.getElementById('bulk-vis-input').value;
  if (!tags && !priceS && visS === '') return;

  if (!confirm(`Apply changes to ${state.bulkSelected.size} item(s)?`)) return;

  const payload = {};
  if (tags)   payload.category    = tags;
  if (priceS) payload.price_cents = Math.round(parseFloat(priceS) * 100);
  if (visS !== '') payload.visible = visS === '1';

  const ids = [...state.bulkSelected];
  await Promise.all(ids.map(id => api('PUT', `/api/products/${id}`, payload)));

  state.bulkSelected = new Set();
  document.getElementById('bulk-tag-input').value   = '';
  document.getElementById('bulk-price-input').value = '';
  document.getElementById('bulk-vis-input').value   = '';
  document.getElementById('select-all-items').checked = false;
  await loadProducts();
  renderItemsList();
  renderGlance();
  updateBulkBar();
}

// Duplicate product
window.duplicateProduct = async function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const newSku = p.sku + '-copy';
  const payload = { ...p, sku: newSku, name: p.name + ' -1', visible: false, store_id: state.activeStore.id };
  delete payload.id; delete payload.created_at;
  const res = await api('POST', '/api/products', payload);
  const data = await safeJson(res);
  if (res.ok) {
    await loadProducts(); renderItemsList(); renderGlance();
    setMsg('items-msg', `Duplicated as hidden draft "${data.name}".`, 'success');
    setTimeout(() => setMsg('items-msg', '', ''), 3500);
  } else {
    setMsg('items-msg', data.error || 'Duplicate failed', 'error');
  }
};

// Broken link checker
async function checkBrokenLinks() {
  const result = document.getElementById('broken-links-result');
  const images = state.products.filter(p => p.image).map(p => ({ name: p.name, url: p.image }));
  if (!images.length) { result.textContent = 'No product images to check.'; return; }

  result.textContent = 'Checking…';
  const broken = [];
  await Promise.all(images.map(async ({ name, url }) => {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (!r.ok) broken.push(name);
    } catch { broken.push(name); }
  }));

  result.textContent = broken.length
    ? `⚠ Broken image(s): ${broken.join(', ')}`
    : `✓ All ${images.length} image(s) OK`;
}

// CSV / JSON export
function exportCsv() {
  const headers = ['SKU','Name','Description','Price ($)','In Stock','Tags','Visible','Image'];
  const rows    = state.products.map(p => [
    p.sku, p.name, p.description || '', (p.price_cents/100).toFixed(2),
    p.in_stock ? '1' : '0', p.category || '', p.visible ? '1' : '0', p.image || '',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','))
    .join('\n');
  download(csv, `${state.activeStore.slug}-items.csv`, 'text/csv');
}

function exportItemsJson() {
  download(JSON.stringify(state.products, null, 2),
    `${state.activeStore.slug}-items.json`, 'application/json');
}

function downloadItemTemplate() {
  const csv = '"SKU","Name","Description","Price ($)","In Stock","Tags"\n"ITEM-01","Example Product","A short description","99.00","1","featured, summer"';
  download(csv, 'items-template.csv', 'text/csv');
}

async function importItems(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';

  if (!confirm('Import items? Existing items with the same SKU will not be overwritten.')) return;

  const text = await file.text();
  let items  = [];

  if (file.name.endsWith('.json')) {
    try { items = JSON.parse(text); } catch { alert('Invalid JSON file.'); return; }
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const hdr   = parseCsvRow(lines[0]);
    items = lines.slice(1).map(l => {
      const vals = parseCsvRow(l);
      const obj  = {};
      hdr.forEach((h, i) => obj[h.toLowerCase().replace(/ /g,'_')] = vals[i] || '');
      return {
        sku:         obj.sku,
        name:        obj.name,
        description: obj.description || '',
        price_cents: Math.round(parseFloat(obj['price_($)'] || obj.price || 0) * 100),
        in_stock:    obj.in_stock !== '0',
        category:    obj.tags || obj.category || '',
        visible:     obj.visible !== '0',
      };
    }).filter(p => p.sku && p.name);
  }

  if (!items.length) { alert('No valid items found.'); return; }
  let added = 0, skipped = 0;
  for (const item of items) {
    const res = await api('POST', '/api/products', { ...item, store_id: state.activeStore.id });
    const d   = await safeJson(res);
    if (res.ok) added++;
    else if (d.error?.includes('SKU')) skipped++;
  }
  await loadProducts(); renderItemsList(); renderGlance();
  setMsg('items-msg', `Import done: ${added} added, ${skipped} skipped (dup SKU).`, 'success');
  setTimeout(() => setMsg('items-msg','',''), 5000);
}

function parseCsvRow(row) {
  const result = []; let cur = ''; let inQ = false;
  for (const ch of row) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result.map(s => s.trim());
}

// ── Product modal ─────────────────────────────────────────────────────────────
function setupProductModal() {
  document.getElementById('btn-new-item').addEventListener('click', openNewProductModal);
  document.getElementById('pm-close').addEventListener('click',  closeProductModal);
  document.getElementById('pm-cancel').addEventListener('click', closeProductModal);
  document.getElementById('product-modal').addEventListener('click', e => {
    if (e.target.id === 'product-modal') closeProductModal();
  });
  document.getElementById('pm-form').addEventListener('submit', saveProduct);

  document.getElementById('pm-img-upload').addEventListener('click', () => {
    state.imgUploadTarget = { type: 'product' };
    document.getElementById('pm-img-input').click();
  });
  document.getElementById('pm-img-input').addEventListener('change', handleImgUpload);
  document.getElementById('pm-img-clear').addEventListener('click', () => {
    document.getElementById('pm-image').value = '';
    renderProductImgPreview('');
  });

  // Collapsible modal sections
  document.querySelectorAll('.modal-section__head').forEach(h => {
    h.addEventListener('click', () => {
      const body = h.nextElementSibling;
      body.style.display = body.style.display === 'none' ? 'flex' : 'none';
    });
  });

  // Badge selector
  document.getElementById('badge-opts').addEventListener('click', e => {
    const btn = e.target.closest('.badge-opt');
    if (!btn) return;
    document.querySelectorAll('.badge-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isCustom = btn.dataset.badge === 'custom';
    const customIn = document.getElementById('pm-badge-custom');
    customIn.style.display = isCustom ? '' : 'none';
  });

  // Variation add
  document.getElementById('btn-add-variation').addEventListener('click', addVariation);
}

function renderProductImgPreview(url) {
  const wrap  = document.getElementById('pm-img-placeholder');
  const clear = document.getElementById('pm-img-clear');
  if (url) {
    if (wrap.tagName !== 'IMG') {
      const img = document.createElement('img');
      img.className = 'img-thumb'; img.id = 'pm-img-placeholder'; img.alt = '';
      wrap.replaceWith(img);
    }
    document.getElementById('pm-img-placeholder').src = url;
    clear.style.display = '';
  } else {
    if (wrap.tagName === 'IMG') {
      const div = document.createElement('div');
      div.className = 'img-placeholder'; div.id = 'pm-img-placeholder'; div.textContent = '🖼';
      wrap.replaceWith(div);
    }
    clear.style.display = 'none';
  }
}

function openNewProductModal() {
  state.editingProduct = null;
  state.variations     = [];
  document.getElementById('pm-title').textContent = 'New item';
  ['pm-sku','pm-name','pm-desc','pm-meta','pm-tags','pm-weight','pm-width','pm-height','pm-depth'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('pm-price').value    = '';
  document.getElementById('pm-stock').checked  = true;
  document.getElementById('pm-visible').checked = true;
  document.getElementById('pm-image').value    = '';
  document.getElementById('pm-disc-type').value   = 'none';
  document.getElementById('pm-disc-amount').value  = '';
  document.getElementById('pm-badge-custom').value = '';
  document.getElementById('pm-badge-custom').style.display = 'none';
  document.querySelectorAll('.badge-opt').forEach((b,i) => b.classList.toggle('active', i===0));
  renderVariationsList();
  renderProductImgPreview('');
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
  const skuEl = document.getElementById('pm-sku');
  if (!state.allowEditIds) {
    skuEl.value    = 'SKU-' + Date.now().toString(36).toUpperCase();
    skuEl.readOnly = true;
  } else {
    skuEl.value    = '';
    skuEl.readOnly = false;
  }
}

window.editProduct = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  state.editingProduct = p;
  state.variations     = [];
  document.getElementById('pm-title').textContent      = 'Edit item';
  document.getElementById('pm-sku').value              = p.sku;
  document.getElementById('pm-name').value             = p.name;
  document.getElementById('pm-desc').value             = p.description || '';
  document.getElementById('pm-price').value            = p.price_cents;
  document.getElementById('pm-stock').checked          = !!p.in_stock;
  document.getElementById('pm-visible').checked        = p.visible !== false;
  document.getElementById('pm-tags').value             = p.category || '';
  document.getElementById('pm-image').value            = p.image || '';
  document.getElementById('pm-meta').value             =
    p.metadata && Object.keys(p.metadata).length ? JSON.stringify(p.metadata, null, 2) : '';

  const meta = p.metadata || {};
  document.getElementById('pm-disc-type').value   = meta.discountType   || 'none';
  document.getElementById('pm-disc-amount').value = meta.discountAmount  || '';
  const badge = meta.badge || '';
  document.querySelectorAll('.badge-opt').forEach(b => {
    const match = b.dataset.badge === badge || (b.dataset.badge === 'custom' && badge && !['','-20%','NEW','FLASH SALE'].includes(badge));
    b.classList.toggle('active', match);
  });
  const customIn = document.getElementById('pm-badge-custom');
  customIn.style.display = badge && !['','-20%','NEW','FLASH SALE'].includes(badge) ? '' : 'none';
  customIn.value = badge && !['','-20%','NEW','FLASH SALE'].includes(badge) ? badge : '';

  const varRe = new RegExp(`^${escapeRegExp(p.sku)}V\\d+$`);
  state.variations = state.products
    .filter(x => varRe.test(x.sku) && x.id !== p.id)
    .map(x => ({ id: x.id, sku: x.sku, name: x.name, price_cents: x.price_cents }));
  renderVariationsList();

  document.getElementById('pm-sku').readOnly = !state.allowEditIds;
  const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  setV('pm-weight', p.weight_grams || '');
  setV('pm-width',  p.width_cm     || '');
  setV('pm-height', p.height_cm    || '');
  setV('pm-depth',  p.depth_cm     || '');

  renderProductImgPreview(p.image || '');
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
};

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  state.editingProduct = null;
  state.variations     = [];
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('pm-submit');
  const sku = document.getElementById('pm-sku').value.trim();

  if (/V\d+$/.test(sku) && !state.editingProduct) {
    setMsg('pm-msg', 'Base SKU must not end in V+number (that pattern is reserved for variations).', 'error');
    return;
  }

  const metaRaw = document.getElementById('pm-meta').value.trim();
  let metadata  = {};
  if (metaRaw) {
    try { metadata = JSON.parse(metaRaw); }
    catch { setMsg('pm-msg', 'Metadata must be valid JSON', 'error'); return; }
  }

  const discType   = document.getElementById('pm-disc-type').value;
  const discAmount = parseFloat(document.getElementById('pm-disc-amount').value) || 0;
  const activeOpt  = document.querySelector('.badge-opt.active');
  let badge = activeOpt?.dataset.badge || '';
  if (badge === 'custom') badge = document.getElementById('pm-badge-custom').value.trim();

  if (discType !== 'none') { metadata.discountType = discType; metadata.discountAmount = discAmount; }
  else { delete metadata.discountType; delete metadata.discountAmount; }
  if (badge) metadata.badge = badge; else delete metadata.badge;

  const getInt = id => { const e = document.getElementById(id); return e ? (parseInt(e.value, 10) || 0) : 0; };
  const payload = {
    sku,
    name:         document.getElementById('pm-name').value.trim(),
    description:  document.getElementById('pm-desc').value.trim(),
    price_cents:  parseInt(document.getElementById('pm-price').value, 10),
    in_stock:     document.getElementById('pm-stock').checked,
    visible:      document.getElementById('pm-visible').checked,
    category:     document.getElementById('pm-tags').value.trim(),
    image:        document.getElementById('pm-image').value,
    metadata,
    weight_grams: getInt('pm-weight'),
    width_cm:     getInt('pm-width'),
    height_cm:    getInt('pm-height'),
    depth_cm:     getInt('pm-depth'),
  };

  btn.disabled = true;
  setMsg('pm-msg', '', '');

  const res = state.editingProduct
    ? await api('PUT',  `/api/products/${state.editingProduct.id}`, payload)
    : await api('POST', '/api/products', { ...payload, store_id: state.activeStore.id });

  const data = await safeJson(res);
  if (res.ok) {
    for (const v of state.variations) {
      if (v._new) {
        await api('POST', '/api/products', {
          store_id: state.activeStore.id,
          sku: v.sku, name: v.name,
          price_cents: v.price_cents, in_stock: true, visible: true, metadata: {},
        });
      }
    }
    closeProductModal();
    await loadProducts();
    renderItemsList();
    renderGlance();
    schedulePreviewSave();
  } else {
    setMsg('pm-msg', data.error || 'Failed to save item', 'error');
    btn.disabled = false;
  }
}

// Variations
function addVariation() {
  const baseSku = document.getElementById('pm-sku').value.trim();
  if (!baseSku) { alert('Set the base SKU first.'); return; }
  const n   = state.variations.length + 1;
  const sku = `${baseSku}V${n}`;
  state.variations.push({ _new: true, sku, name: `${document.getElementById('pm-name').value} V${n}`, price_cents: 0 });
  renderVariationsList();
}

function renderVariationsList() {
  const list = document.getElementById('pm-vars-list');
  if (!list) return;
  list.innerHTML = state.variations.map((v, i) => `
    <div class="var-row">
      <input type="text" value="${esc(v.name)}" placeholder="Name"
        onchange="updateVariation(${i},'name',this.value)" />
      <input type="number" value="${(v.price_cents/100).toFixed(2)}" placeholder="Price $" min="0" step="0.01"
        onchange="updateVariation(${i},'price_cents',Math.round(parseFloat(this.value||0)*100))" style="width:90px" />
      <span style="font-family:var(--mono);font-size:9px;color:var(--fg-faint)">${esc(v.sku)}</span>
      ${v._new ? `<button type="button" class="var-row__del" onclick="removeVariation(${i})">✕</button>` : ''}
    </div>`).join('') || '<p style="font-size:11px;color:var(--fg-faint);margin:0">No variations.</p>';
}

window.updateVariation = function(i, key, val) { state.variations[i][key] = val; };
window.removeVariation  = function(i) { state.variations.splice(i, 1); renderVariationsList(); };

window.deleteProduct = async function(productId) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  const res = await api('DELETE', `/api/products/${productId}`);
  if (res.ok) {
    await loadProducts();
    renderItemsList();
    renderGlance();
    schedulePreviewSave();
  } else {
    setMsg('items-msg', 'Failed to delete', 'error');
  }
};

// ── Config tab ────────────────────────────────────────────────────────────────
function setupConfigTab() {
  // Language
  document.getElementById('cfg-lang').addEventListener('change', e => {
    dashConfig.lang = e.target.value;
    saveDashConfig();
    applyTranslations();
  });

  // Panel size
  document.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dashConfig.size = btn.dataset.size;
      saveDashConfig();
      applyDashSize(dashConfig.size);
    });
  });

  // Preview mode
  document.querySelectorAll('[data-preview]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-preview]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dashConfig.preview = btn.dataset.preview;
      saveDashConfig();
      setPreviewMode(dashConfig.preview);
    });
  });

  // Auto-refresh toggle
  document.getElementById('cfg-auto-refresh').addEventListener('change', e => {
    dashConfig.autoRefresh = e.target.checked;
    saveDashConfig();
  });

  // Feature toggles (store features — countdown, newsletter, inventory)
  document.querySelectorAll('.tweak-feat').forEach(cb => {
    cb.addEventListener('change', () => {
      ensureObj('features');
      state.draft.features[cb.dataset.feature] = cb.checked;
      markDirty();
    });
  });

  // Newsletter fields
  const nlSave = () => {
    ensureObj('features');
    state.draft.features.newsletterTitle = document.getElementById('nl-title').value;
    state.draft.features.newsletterText  = document.getElementById('nl-text').value;
    state.draft.features.newsletterImage = document.getElementById('nl-image').value;
    markDirty();
  };
  ['nl-title','nl-text','nl-image'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', nlSave);
  });

  // Out of stock
  document.getElementById('oos-mode').addEventListener('change', e => {
    ensureObj('features');
    state.draft.features.oosMode = e.target.value;
    markDirty();
  });
  document.getElementById('stock-public').addEventListener('change', e => {
    ensureObj('features');
    state.draft.features.stockPublic = e.target.checked;
    markDirty();
  });

  // Edit IDs toggle
  document.getElementById('tweak-allow-ids').addEventListener('change', e => {
    state.allowEditIds = e.target.checked;
  });

  // Start all over
  document.getElementById('btn-start-over').addEventListener('click', async () => {
    const input = document.getElementById('reset-confirm-input').value.trim();
    if (input !== 'RESET') { alert('Type RESET to confirm.'); return; }
    if (!confirm('This will wipe all sections and config on the live store. Are you absolutely sure?')) return;
    const empty = { sections: [], features: {}, theme: {}, seo: {} };
    await api('PUT', `/api/stores/${state.activeStore.id}`, { name: state.activeStore.name, config: empty });
    state.draft = deepClone(empty);
    state.history = []; state.future = [];
    state.isDirty = false;
    localStorage.removeItem(`draft_${state.activeStore.id}`);
    renderDesignTab(); renderSectionList(); closeSectionEditor();
    schedulePreviewSave(); updateDirty(false); updateUndoRedoBtns();
    document.getElementById('reset-confirm-input').value = '';
    document.getElementById('tmpl-overlay').classList.add('active');
  });

  document.getElementById('btn-save-payment').addEventListener('click', savePaymentSettings);
  document.getElementById('btn-refresh-orders').addEventListener('click', loadOrders);
}

function renderConfigTab() {
  const f = state.draft.features || {};
  document.getElementById('cfg-lang').value       = dashConfig.lang || 'en';
  document.getElementById('cfg-auto-refresh').checked = dashConfig.autoRefresh !== false;
  document.getElementById('oos-mode').value       = f.oosMode || 'show';
  document.getElementById('stock-public').checked = !!f.stockPublic;
  document.getElementById('nl-title').value       = f.newsletterTitle || '';
  document.getElementById('nl-text').value        = f.newsletterText  || '';
  document.getElementById('nl-image').value       = f.newsletterImage || '';

  // Feature toggles
  document.querySelectorAll('.tweak-feat').forEach(cb => {
    cb.checked = !!(f[cb.dataset.feature]);
  });

  // Segment controls
  document.querySelectorAll('[data-size]').forEach(b =>
    b.classList.toggle('active', b.dataset.size === (dashConfig.size || 'medium')));
  document.querySelectorAll('[data-preview]').forEach(b =>
    b.classList.toggle('active', b.dataset.preview === (dashConfig.preview || 'desktop')));

  renderDashStyleGrid();
  setPreviewMode(dashConfig.preview || 'desktop');
}

function applyDashSize(size) {
  const w = PANEL_SIZES[size] || PANEL_SIZES.medium;
  document.documentElement.style.setProperty('--panel-w', w);
}

function applyTranslations() {
  const setT = (id, key) => { const e = document.getElementById(id); if (e) e.textContent = t(key); };
  setT('btn-save-draft', 'saveDraft');
  setT('btn-discard',    'discard');
  setT('btn-new-item',   'newItem');
  setT('btn-push-live',  'pushLive');
  document.querySelectorAll('.etab').forEach(tab => {
    const key = tab.dataset.tab;
    if (I18N.en[key]) tab.textContent = t(key);
  });
}

// ── Template gallery ──────────────────────────────────────────────────────────
function setupTemplateGallery() {
  document.getElementById('tmpl-close').addEventListener('click', () => {
    document.getElementById('tmpl-overlay').classList.remove('active');
  });
  document.getElementById('tmpl-overlay').addEventListener('click', e => {
    if (e.target.id === 'tmpl-overlay') document.getElementById('tmpl-overlay').classList.remove('active');
  });

  document.getElementById('tmpl-grid').innerHTML = TEMPLATES.map(tmpl => `
    <div class="gallery-card" onclick="applyTemplate('${esc(tmpl.id)}')">
      <div class="gallery-card__icon">${esc(tmpl.icon)}</div>
      <div class="gallery-card__name">${esc(tmpl.name)}</div>
      <div class="gallery-card__desc">${esc(tmpl.desc)}</div>
    </div>`).join('');
}

window.applyTemplate = function(id) {
  const tmpl = TEMPLATES.find(t => t.id === id);
  if (!tmpl) return;
  if (!confirm(`Apply the "${tmpl.name}" template? This replaces your current sections, palette and style.`)) return;
  pushUndo();
  const inner = tmpl.sections().filter(s => !FIXED_SECTION_TYPES.has(s.type));
  state.draft.sections = [
    { id: uid(), type: 'header', ...SECTION_TYPES.header.defaults },
    ...inner,
    { id: uid(), type: 'footer', ...SECTION_TYPES.footer.defaults },
  ];
  // Apply matching palette + visual style
  if (tmpl.palette) {
    const pal = PALETTES.find(p => p.id === tmpl.palette);
    if (pal) {
      ensureObj('theme');
      state.draft.theme.bg     = pal.theme.bg;
      state.draft.theme.fg     = pal.theme.fg;
      state.draft.theme.accent = pal.theme.accent;
    }
  }
  if (tmpl.style) {
    const vs = VISUAL_STYLES.find(s => s.id === tmpl.style);
    if (vs) {
      state.draft.style = tmpl.style;
      for (const [k, v] of Object.entries(vs.vars)) {
        document.documentElement.style.setProperty(k, v);
      }
    }
  }
  state.editingSection = null;
  renderSectionList();
  closeSectionEditor();
  markDirty();
  document.getElementById('tmpl-overlay').classList.remove('active');
};

// ── Product picker ────────────────────────────────────────────────────────────
let _ppSectionIdx = null;
let _ppSelected   = new Set();

window.openProductPicker = function(sectionIdx) {
  _ppSectionIdx = sectionIdx;
  const s = state.draft.sections[sectionIdx] || {};
  _ppSelected   = new Set((s.selectedProducts || []).map(String));
  _renderPP();
  document.getElementById('product-picker-overlay').classList.add('active');
};

function _renderPP() {
  const products = state.products || [];
  const sel = _ppSelected;
  const count = sel.size;
  document.getElementById('pp-summary').textContent =
    count === 0 ? `All ${products.length} products` : `${count} of ${products.length} selected`;

  document.getElementById('pp-list').innerHTML = products.map(p => {
    const pid = String(p.id);
    const dollars = (p.price_cents / 100).toFixed(2);
    return `<label class="pp-item">
      <input type="checkbox" data-pid="${esc(pid)}" ${sel.has(pid) ? 'checked' : ''} onchange="ppToggle(this)" />
      ${p.image ? `<img src="${esc(p.image)}" class="pp-img" alt="" />` : '<div class="pp-img pp-img--empty"></div>'}
      <div class="pp-info">
        <span class="pp-name">${esc(p.name)}</span>
        <span class="pp-price">$${esc(dollars)}</span>
        ${!p.in_stock ? '<span class="pp-oos">Out of stock</span>' : ''}
      </div>
    </label>`;
  }).join('');
}

window.ppSelectAll = function() {
  (state.products || []).forEach(p => _ppSelected.add(String(p.id)));
  _renderPP();
};

window.ppSelectNone = function() {
  _ppSelected.clear();
  _renderPP();
};

window.ppToggle = function(cb) {
  const pid = String(cb.dataset.pid);
  if (cb.checked) _ppSelected.add(pid);
  else            _ppSelected.delete(pid);
  document.getElementById('pp-summary').textContent =
    _ppSelected.size === 0
      ? `All ${(state.products||[]).length} products`
      : `${_ppSelected.size} of ${(state.products||[]).length} selected`;
};

window.ppFilterUnder = function() {
  const val = parseFloat(document.getElementById('pp-price-val').value);
  if (isNaN(val)) return;
  (state.products || []).forEach(p => {
    if (p.price_cents / 100 <= val) _ppSelected.add(String(p.id));
  });
  _renderPP();
};

window.ppFilterOver = function() {
  const val = parseFloat(document.getElementById('pp-price-val').value);
  if (isNaN(val)) return;
  (state.products || []).forEach(p => {
    if (p.price_cents / 100 >= val) _ppSelected.add(String(p.id));
  });
  _renderPP();
};

window.confirmProductPicker = function() {
  if (_ppSectionIdx === null) return;
  const s = state.draft.sections[_ppSectionIdx];
  if (!s) return;
  // Empty set = show all (no filter stored)
  s.selectedProducts = _ppSelected.size === 0 ? [] : [..._ppSelected];
  markDirty();
  openSectionEditor(_ppSectionIdx);
  document.getElementById('product-picker-overlay').classList.remove('active');
};

window.closeProductPicker = function() {
  document.getElementById('product-picker-overlay').classList.remove('active');
};

// ── Screen navigation ─────────────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

async function api(method, path, body) {
  const opts = { method, headers: {} };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  return fetch(path, opts);
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = `status-msg ${type}`;
}

function setSelectVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function ensureObj(path) {
  const parts = path.split('.');
  let cur = state.draft;
  for (const p of parts) {
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
}

function setNestedField(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] === undefined || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function flash(btnId, text, ms = 1800) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = orig; }, ms);
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Onboarding wizard ─────────────────────────────────────────────────────────
let _obStoreId  = null;
let _obSlugOk   = false;

function setupOnboarding() {
  const slugIn      = document.getElementById('ob-slug');
  const slugStatus  = document.getElementById('ob-slug-status');
  const slugPreview = document.getElementById('ob-slug-preview');

  if (slugIn) {
    slugIn.addEventListener('input', () => {
      const v = slugIn.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      slugIn.value = v;
      if (slugPreview) slugPreview.textContent = v || 'your-brand';
      slugStatus.textContent = '';
      _obSlugOk = false;
    });
  }

  document.getElementById('btn-check-slug')?.addEventListener('click', async () => {
    const slug = (slugIn?.value || '').trim();
    if (!slug) { slugStatus.textContent = 'Enter a slug first.'; return; }
    const res  = await fetch(`/api/public/slug-check?slug=${encodeURIComponent(slug)}`);
    const data = await safeJson(res);
    _obSlugOk  = !!data.available;
    slugStatus.textContent  = data.available ? '✓ Available!' : (data.error || '✗ Already taken');
    slugStatus.style.color  = data.available ? '#1c6b3a' : '#b33';
  });

  document.getElementById('btn-ob-next-1')?.addEventListener('click', async () => {
    const name = document.getElementById('ob-store-name')?.value.trim();
    const slug = slugIn?.value.trim();
    const msg  = document.getElementById('ob-msg-1');
    if (!name || !slug) { if (msg) msg.textContent = 'Please fill in both fields.'; return; }
    if (!_obSlugOk) { if (msg) msg.textContent = 'Check slug availability first.'; return; }

    const res  = await api('POST', '/api/stores', { name, slug });
    const data = await safeJson(res);
    if (!res.ok) { if (msg) msg.textContent = data.error || 'Failed to create store.'; return; }

    _obStoreId = data.id;
    document.getElementById('ob-step-1').style.display = 'none';
    document.getElementById('ob-step-2').style.display = '';
  });

  document.getElementById('btn-ob-skip-2')?.addEventListener('click', completeOnboarding);
  document.getElementById('btn-ob-finish')?.addEventListener('click', async () => {
    const cbu    = document.getElementById('ob-cbu')?.value.trim();
    const bname  = document.getElementById('ob-bank-name')?.value.trim();
    const holder = document.getElementById('ob-bank-holder')?.value.trim();
    if (cbu && _obStoreId) {
      await api('PUT', `/api/stores/${_obStoreId}/payment`, {
        cbu_cvu: cbu, bank_name: bname, bank_holder: holder,
      });
    }
    await completeOnboarding();
  });
}

async function completeOnboarding() {
  await api('POST', '/api/me/onboard');
  if (state.owner) state.owner.onboarded = 1;
  await showStoresScreen();
}

// ── Payment settings ──────────────────────────────────────────────────────────
async function loadPaymentSettings(storeId) {
  const res  = await api('GET', `/api/stores/${storeId}/payment`);
  if (!res.ok) return;
  const data = await safeJson(res);

  const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  setV('cfg-mp-pub',     data.mp_public_key   || '');
  setV('cfg-mp-tok',     data.mp_access_token === '••••••••' ? '' : '');  // never pre-fill tokens
  setV('cfg-cbu',        data.cbu_cvu         || '');
  setV('cfg-bank-name',  data.bank_name        || '');
  setV('cfg-bank-holder',data.bank_holder      || '');
  setV('cfg-s-addr',     data.store_address    || '');
  setV('cfg-s-zip',      data.store_zip        || '');
  setV('cfg-s-city',     data.store_city       || '');
  setV('cfg-s-prov',     data.store_province   || '');
  setV('cfg-wa-number',  data.whatsapp_number  || '');
  setV('cfg-wa-message', data.whatsapp_message || '');
}

async function savePaymentSettings() {
  const storeId = state.activeStore?.id;
  if (!storeId) return;
  const btn = document.getElementById('btn-save-payment');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  const getV = id => (document.getElementById(id)?.value.trim() || '');
  const body = {
    mp_public_key:    getV('cfg-mp-pub'),
    cbu_cvu:          getV('cfg-cbu'),
    bank_name:        getV('cfg-bank-name'),
    bank_holder:      getV('cfg-bank-holder'),
    store_address:    getV('cfg-s-addr'),
    store_zip:        getV('cfg-s-zip'),
    store_city:       getV('cfg-s-city'),
    store_province:   getV('cfg-s-prov'),
    whatsapp_number:  getV('cfg-wa-number').replace(/\D/g, ''),
    whatsapp_message: document.getElementById('cfg-wa-message')?.value.trim() || '',
  };

  const tok = getV('cfg-mp-tok');
  if (tok) body.mp_access_token = tok;

  const res  = await api('PUT', `/api/stores/${storeId}/payment`, body);
  const msg  = document.getElementById('payment-msg');
  if (msg) {
    msg.textContent = res.ok ? 'Saved ✓' : 'Save failed.';
    msg.style.color = res.ok ? '#1c6b3a' : '#b33';
    setTimeout(() => { msg.textContent = ''; }, 2500);
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Save payment settings'; }
}

// ── Orders tab ────────────────────────────────────────────────────────────────
async function loadOrders() {
  const storeId = state.activeStore?.id;
  if (!storeId) return;

  const status = document.getElementById('orders-status-filter')?.value || '';
  const qs     = status ? `?status=${encodeURIComponent(status)}` : '';
  const res    = await api('GET', `/api/stores/${storeId}/orders${qs}`);
  const orders = res.ok ? await safeJson(res) : [];
  renderOrders(orders);
}

function renderOrders(orders) {
  const list = document.getElementById('orders-list');
  if (!list) return;
  if (!orders.length) {
    list.innerHTML = '<p class="status-msg" style="padding:12px">No orders yet.</p>';
    return;
  }

  const fmtARS = c => '$' + (c/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});

  list.innerHTML = orders.map(o => {
    const date = new Date(o.created_at).toLocaleDateString('es-AR', { day:'2-digit', month:'short' });
    return `
    <div class="order-row" id="ord-${esc(o.id)}">
      <div class="order-row__head">
        <span class="order-name">${esc(o.customer_name)}</span>
        <span class="order-badge order-badge--${esc(o.status)}">${esc(o.status.replace('_',' '))}</span>
        <span class="order-amt">${fmtARS(o.total_cents)}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="order-ref">#${esc(o.id.slice(0,8).toUpperCase())}</span>
        <span class="order-date">${esc(date)}</span>
        <span class="order-ref">${esc(o.payment_method || '')}</span>
      </div>
      <div class="order-detail" id="ord-detail-${esc(o.id)}">
        <div class="order-detail__row"><span class="order-detail__key">Email</span><span>${esc(o.customer_email)}</span></div>
        <div class="order-detail__row"><span class="order-detail__key">Phone</span><span>${esc(o.customer_phone || '—')}</span></div>
        <div class="order-detail__row"><span class="order-detail__key">Address</span><span>${esc([o.shipping_address,o.shipping_city,o.shipping_province,o.shipping_zip].filter(Boolean).join(', ') || '—')}</span></div>
        <div class="order-detail__row"><span class="order-detail__key">Shipping</span><span>${esc(o.shipping_method || '—')} ${o.shipping_cost_cents ? fmtARS(o.shipping_cost_cents) : ''}</span></div>
        <div class="order-detail__row"><span class="order-detail__key">Subtotal</span><span>${fmtARS(o.subtotal_cents)}</span></div>
        <div class="order-detail__row"><span class="order-detail__key">Total</span><span>${fmtARS(o.total_cents)}</span></div>
        ${o.payment_id ? `<div class="order-detail__row"><span class="order-detail__key">Payment ID</span><span style="font-family:var(--mono);font-size:10px">${esc(o.payment_id)}</span></div>` : ''}
        <select class="order-status-sel" onchange="updateOrderStatus('${esc(o.id)}', this.value)">
          ${['pending','awaiting_transfer','paid','processing','shipped','delivered','cancelled'].map(s =>
            `<option value="${s}"${s === o.status ? ' selected' : ''}>${s.replace('_',' ')}</option>`
          ).join('')}
        </select>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.order-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('select')) return;
      const detail = row.querySelector('.order-detail');
      if (detail) detail.classList.toggle('open');
    });
  });
}

window.updateOrderStatus = async function(orderId, status) {
  const res = await api('PUT', `/api/orders/${orderId}`, { status });
  if (!res.ok) { alert('Failed to update order status.'); return; }
  const badge = document.querySelector(`#ord-${orderId} .order-badge`);
  if (badge) { badge.textContent = status.replace('_', ' '); badge.className = `order-badge order-badge--${status}`; }
};
