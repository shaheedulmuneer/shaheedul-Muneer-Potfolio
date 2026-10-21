/**
 * ============================================================================
 * FOLIOBLOX / SHAHEEDUL MUNEER - CENTRALIZED SCROLL ANIMATION CONFIGURATION
 * ============================================================================
 * 
 * Edit this single file to customize any scrolling animation style, speed,
 * delay, distance, trigger point, repeat behavior, or target element presets.
 * 
 * Available Animation Styles:
 * - 'fade-in'      : Smooth opacity fade
 * - 'slide-up'     : Fade & slide upwards from bottom
 * - 'slide-left'   : Fade & slide from left to right
 * - 'slide-right'  : Fade & slide from right to left
 * - 'zoom-in'      : Fade & zoom from subtle scale
 * - 'blur-in'      : Fade & transition from blur to crystal clear
 * - 'none'         : Disable animation for that target
 * ============================================================================
 */

const AnimationConfig = {

  // --------------------------------------------------------------------------
  // 1. GLOBAL SETTINGS
  // --------------------------------------------------------------------------
  global: {
    // Master switch to enable or disable scroll animations
    enabled: true,

    // Whether animations play only once, or repeat when scrolling up and down
    // true  = Animate once and stay visible
    // false = Re-trigger and replay every time element scrolls in and out of view
    once: false,

    // Trigger Point when scrolling:
    // threshold: 0.0 to 1.0 (0.15 = triggers when 15% of element enters viewport)
    threshold: 0.12,

    // Viewport margin trigger offset (e.g., "-50px" triggers 50px before entering screen edge)
    rootMargin: "0px 0px -40px 0px",

    // Default durations, delays, distances (used if not overridden by presets)
    defaultDuration: 750, // milliseconds (ms)
    defaultDelay: 0,      // milliseconds (ms)
    defaultDistance: 32,  // pixels (px) for sliding distances
    defaultEasing: "cubic-bezier(0.16, 1, 0.3, 1)", // modern smooth cinematic easing

    // Accessibility: Automatically disable motion for users with "Reduce Motion" enabled in OS
    respectReducedMotion: true
  },

  // --------------------------------------------------------------------------
  // 2. MOBILE-SPECIFIC SETTINGS (< 768px screen width)
  // --------------------------------------------------------------------------
  mobile: {
    // Enable or disable scroll animations on mobile devices
    enabled: true,

    // Scale down translation distance on mobile (e.g. 0.6 = 60% of desktop distance to prevent layout overflow)
    distanceFactor: 0.65,

    // Scale duration for snappier performance on mobile (e.g. 0.85 = 15% faster)
    durationFactor: 0.85,

    // Disable subtle parallax calculations on mobile touch screens for optimal 60fps battery life
    disableParallax: true
  },

  // --------------------------------------------------------------------------
  // 3. TARGET ELEMENT PRESETS
  // Customize animation style, duration, distance, and delay for specific types
  // of content (Headings, Paragraphs, Buttons, Images, Project Cards, etc.)
  // --------------------------------------------------------------------------
  presets: {
    // Main Section Headings & Display Titles
    headings: {
      selector: "h1, h2, h3, .hero-display-title, .behind-headline, .footer-heading, .statement-headline",
      style: "slide-up",     // 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom-in' | 'blur-in'
      duration: 850,         // ms
      distance: 35,          // px
      delay: 0,              // ms
      repeat: false          // override global repeat if desired
    },

    // Category Tags & Kickers (e.g. "Behind the Designs", "Hey, I'm a", "Get in Touch")
    tags: {
      selector: ".kicker-badge, .section-tag-orange, .badge-category",
      style: "slide-left",
      duration: 700,
      distance: 24,
      delay: 50
    },

    // Body Paragraphs, Subtitles, and Lead Text
    paragraphs: {
      selector: "p, .statement-subtext, .behind-lead-paragraph, .card-desc, .location-subtext, .footer-desc",
      style: "fade-in",
      duration: 750,
      delay: 100
    },

    // Action Buttons & Pills
    buttons: {
      selector: ".btn-pill-nav, .btn-orange-pill, .btn-copy-number, .drive-link-badge, .about-contact-btn",
      style: "zoom-in",
      duration: 650,
      delay: 120
    },

    // Project Showcase Cards & Capability Items
    cards: {
      selector: ".showcase-card, .service-pill-item, .contact-method-card, .qr-showcase-card, .statement-card",
      style: "slide-up",
      duration: 800,
      distance: 40,
      delay: 0
    },

    // Media & Portfolio Images
    images: {
      selector: ".card-media-img, .qr-image-container",
      style: "fade-in",
      duration: 900,
      delay: 100
    },

    // Trusted By Brands Bar Shell
    trustedBar: {
      selector: ".trusted-bar-shell",
      style: "slide-up",
      duration: 750,
      distance: 30,
      delay: 0
    }
  },

  // --------------------------------------------------------------------------
  // 4. STAGGERED ANIMATIONS
  // Stagger child elements inside a container so they cascade one after another
  // --------------------------------------------------------------------------
  stagger: {
    enabled: true,
    containers: [
      {
        // 4 Services (#01 Brand Strategy, etc.)
        selector: ".hero-services-grid",
        childSelector: ".service-pill-item",
        staggerDelay: 90 // ms between each item
      },
      {
        // 3 Showcase Cards (My Works, Audio, Cosmetics)
        selector: ".showcase-cards-grid",
        childSelector: ".showcase-card",
        staggerDelay: 130
      },
      {
        // Contact Methods (Phone, WhatsApp)
        selector: ".contact-methods-list",
        childSelector: ".contact-method-card",
        staggerDelay: 100
      },
      {
        // Application Skills Cards
        selector: ".toolkit-grid",
        childSelector: ".toolkit-card",
        staggerDelay: 90
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 5. PARALLAX SCROLLING
  // Subtle vertical movement rate while scrolling down (without layout shift)
  // speed: negative moves slightly faster upwards; positive floats downward
  // --------------------------------------------------------------------------
  parallax: {
    enabled: true,
    elements: [
      { selector: ".statement-card", speed: -0.06 },
      { selector: ".qr-showcase-card", speed: 0.05 },
      { selector: ".card-media-wrap", speed: 0.03 }
    ]
  }

};

// Export configuration for browser or modular environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationConfig;
} else {
  window.AnimationConfig = AnimationConfig;
}
