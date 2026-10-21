/**
 * ============================================================================
 * FOLIOBLOX / SHAHEEDUL MUNEER - SCROLL ANIMATION ENGINE
 * ============================================================================
 * 
 * High-performance, dependency-free animation engine powered by
 * IntersectionObserver and GPU-accelerated CSS transforms.
 * 
 * Reads settings from window.AnimationConfig (animations.config.js).
 * ============================================================================
 */

(function () {
  'use strict';

  // Fallback defaults if config is not loaded
  const DEFAULT_CONFIG = {
    global: {
      enabled: true,
      once: false,
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
      defaultDuration: 750,
      defaultDelay: 0,
      defaultDistance: 32,
      defaultEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
      respectReducedMotion: true
    },
    mobile: {
      enabled: true,
      distanceFactor: 0.65,
      durationFactor: 0.85,
      disableParallax: true
    },
    presets: {},
    stagger: { enabled: true, containers: [] },
    parallax: { enabled: true, elements: [] }
  };

  class ScrollAnimationEngine {
    constructor() {
      this.config = window.AnimationConfig || DEFAULT_CONFIG;
      this.isMobile = window.innerWidth < 768;
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.animatedElements = new Set();
      this.observer = null;
      this.parallaxItems = [];

      this.init();
    }

    init() {
      // 1. Check if disabled or accessibility prefers reduced motion
      if (!this.config.global.enabled) return;
      if (this.isMobile && !this.config.mobile.enabled) return;

      if (this.config.global.respectReducedMotion && this.prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
        return;
      }

      // 2. Set up IntersectionObserver
      this.setupObserver();

      // 3. Register Presets & HTML Data Attributes
      this.registerPresets();
      this.registerStaggeredContainers();
      this.registerManualAttributes();

      // 4. Set up Parallax Scrolling
      if (this.config.parallax.enabled && (!this.isMobile || !this.config.mobile.disableParallax)) {
        this.setupParallax();
      }

      // 5. Handle Window Resize (recalculate mobile factors)
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.isMobile = window.innerWidth < 768;
        }, 150);
      }, { passive: true });
    }

    /**
     * Initializes the IntersectionObserver for scroll triggers
     */
    setupObserver() {
      const options = {
        root: null, // viewport
        rootMargin: this.config.global.rootMargin || "0px 0px -40px 0px",
        threshold: this.config.global.threshold || 0.12
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const el = entry.target;
          const shouldRepeat = el.dataset.animRepeat !== undefined 
            ? el.dataset.animRepeat === 'true' 
            : !this.config.global.once;

          if (entry.isIntersecting) {
            el.classList.add('anim-visible');

            // If animation should only play once, stop observing it
            if (!shouldRepeat) {
              this.observer.unobserve(el);
            }
          } else {
            // If repeating is enabled, reset animation when scrolling out of view
            if (shouldRepeat) {
              el.classList.remove('anim-visible');
            }
          }
        });
      }, options);
    }

    /**
     * Applies styling tokens and classes to an element
     */
    applyAnimationToElement(el, settings = {}) {
      if (!el || this.animatedElements.has(el)) return;
      this.animatedElements.add(el);

      const style = settings.style || 'slide-up';
      if (style === 'none') return;

      let duration = settings.duration !== undefined ? settings.duration : this.config.global.defaultDuration;
      let delay = settings.delay !== undefined ? settings.delay : this.config.global.defaultDelay;
      let distance = settings.distance !== undefined ? settings.distance : this.config.global.defaultDistance;
      const easing = settings.easing || this.config.global.defaultEasing;

      // Apply mobile scaling factors
      if (this.isMobile) {
        duration = Math.round(duration * (this.config.mobile.durationFactor || 0.85));
        distance = Math.round(distance * (this.config.mobile.distanceFactor || 0.65));
      }

      // Set CSS Custom Properties on the element
      el.style.setProperty('--anim-duration', `${duration}ms`);
      el.style.setProperty('--anim-delay', `${delay}ms`);
      el.style.setProperty('--anim-distance', `${distance}px`);
      el.style.setProperty('--anim-easing', easing);

      // Base classes
      el.classList.add('anim-element', `anim-${style}`);

      if (settings.repeat !== undefined) {
        el.dataset.animRepeat = settings.repeat.toString();
      }

      // Observe for scroll entry
      if (this.observer) {
        this.observer.observe(el);
      }
    }

    /**
     * Parses the presets defined in AnimationConfig.presets
     */
    registerPresets() {
      const presets = this.config.presets || {};
      for (const key of Object.keys(presets)) {
        const preset = presets[key];
        if (!preset.selector) continue;

        const elements = document.querySelectorAll(preset.selector);
        elements.forEach(el => {
          this.applyAnimationToElement(el, preset);
        });
      }
    }

    /**
     * Sets up staggered animations for containers with child items
     */
    registerStaggeredContainers() {
      if (!this.config.stagger || !this.config.stagger.enabled) return;

      const containers = this.config.stagger.containers || [];
      containers.forEach(item => {
        const parentElems = document.querySelectorAll(item.selector);
        parentElems.forEach(parent => {
          const children = parent.querySelectorAll(item.childSelector);
          children.forEach((child, index) => {
            const staggerDelay = (item.staggerDelay || 100) * index;
            // Fetch existing delay or combine
            const currentDelay = parseFloat(child.style.getPropertyValue('--anim-delay') || 0);
            const finalDelay = currentDelay + staggerDelay;
            child.style.setProperty('--anim-delay', `${finalDelay}ms`);
          });
        });
      });
    }

    /**
     * Allows developers or designers to write inline data attributes on any element:
     * e.g. <div data-anim="slide-right" data-anim-duration="900" data-anim-delay="200">
     */
    registerManualAttributes() {
      const elements = document.querySelectorAll('[data-anim]');
      elements.forEach(el => {
        const style = el.getAttribute('data-anim');
        const duration = el.getAttribute('data-anim-duration') ? parseInt(el.getAttribute('data-anim-duration')) : undefined;
        const delay = el.getAttribute('data-anim-delay') ? parseInt(el.getAttribute('data-anim-delay')) : undefined;
        const distance = el.getAttribute('data-anim-distance') ? parseInt(el.getAttribute('data-anim-distance')) : undefined;
        const repeat = el.getAttribute('data-anim-repeat') ? el.getAttribute('data-anim-repeat') === 'true' : undefined;

        this.applyAnimationToElement(el, {
          style,
          duration,
          delay,
          distance,
          repeat
        });
      });
    }

    /**
     * Sets up smooth Parallax Scrolling for configured elements
     */
    setupParallax() {
      const parallaxConfig = this.config.parallax.elements || [];
      const items = [];

      parallaxConfig.forEach(cfg => {
        const elements = document.querySelectorAll(cfg.selector);
        elements.forEach(el => {
          items.push({
            el,
            speed: cfg.speed || 0.05
          });
        });
      });

      // Also support manual data-parallax attribute: <div data-parallax="0.08">
      const manualParallax = document.querySelectorAll('[data-parallax]');
      manualParallax.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.05;
        items.push({ el, speed });
      });

      if (items.length === 0) return;
      this.parallaxItems = items;

      let ticking = false;
      const updateParallax = () => {
        const windowHeight = window.innerHeight;

        this.parallaxItems.forEach(item => {
          const rect = item.el.getBoundingClientRect();
          // Check if element is currently near viewport
          if (rect.bottom >= -100 && rect.top <= windowHeight + 100) {
            const elementCenter = rect.top + rect.height / 2;
            const viewportCenter = windowHeight / 2;
            const offset = (viewportCenter - elementCenter) * item.speed;
            
            // Apply subtle GPU-accelerated transform without touching margins or layout
            item.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
          }
        });

        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });

      // Initial run
      updateParallax();
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.scrollAnimationEngine = new ScrollAnimationEngine();
    });
  } else {
    window.scrollAnimationEngine = new ScrollAnimationEngine();
  }

})();
