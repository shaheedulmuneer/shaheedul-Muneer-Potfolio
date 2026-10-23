/**
 * FOLIOBLOX / SHAHEEDUL MUNEER PORTFOLIO
 * Scroll-driven video animation scrubbing & interactive UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const nav = document.getElementById('main-nav');
  const servicePillItems = document.querySelectorAll('.service-pill-item');
  const projectCards = document.querySelectorAll('.showcase-card');
  const modal = document.getElementById('projectModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalVideo = document.getElementById('modalVideo');
  const modalActionRow = document.getElementById('modalActionRow');
  const modalTitle = document.getElementById('modalTitle');
  const modalTag = document.getElementById('modalTag');
  const modalDesc = document.getElementById('modalDesc');

  // Multi-Video Lightbox Modal Elements
  const modalDialog = document.getElementById('modalDialog');
  const modalVideoShell = document.getElementById('modalVideoShell');
  const modalVideoNavBar = document.getElementById('modalVideoNavBar');
  const prevVideoBtn = document.getElementById('prevVideoBtn');
  const nextVideoBtn = document.getElementById('nextVideoBtn');
  const videoCounterLabel = document.getElementById('videoCounterLabel');
  const modalMultiBadge = document.getElementById('modalMultiBadge');
  const modalReelGallery = document.getElementById('modalReelGallery');
  const reelGalleryTitleText = document.getElementById('reelGalleryTitleText');
  const reelThumbnailsTrack = document.getElementById('reelThumbnailsTrack');
  const trackScrollLeft = document.getElementById('trackScrollLeft');
  const trackScrollRight = document.getElementById('trackScrollRight');
  const fashionCoverVideo = document.getElementById('fashionCoverVideo');
  const commercialCoverVideo = document.getElementById('commercialCoverVideo');
  const foodCoverVideo = document.getElementById('foodCoverVideo');
  const celebrityCoverVideo = document.getElementById('celebrityCoverVideo');
  const btsCoverVideo = document.getElementById('btsCoverVideo');

  // ========================================================================
  // HERO CANVAS IMAGE SEQUENCE SCROLL ANIMATION (Apple-style Butter-Smooth)
  // Sequence: scroling/ezgif-frame-001.jpg -> scroling/ezgif-frame-205.jpg (205 frames)
  // ========================================================================
  const heroTrack = document.getElementById('hero');
  const heroCanvas = document.getElementById('heroScrollCanvas');
  const scrubFill = document.getElementById('scrubFill');
  const scrubText = document.getElementById('scrubText');
  const heroHeaderRow = document.getElementById('heroHeaderRow');
  const heroServicesGrid = document.getElementById('heroServicesGrid');

  const TOTAL_FRAMES = 205;
  const frameImages = new Array(TOTAL_FRAMES + 1);
  let targetFrame = 1;
  let currentFrame = 1;
  let lastRenderedFrame = -1;
  let isCanvasReady = false;
  let ctx = null;

  if (heroCanvas) {
    ctx = heroCanvas.getContext('2d', { alpha: false });

    // Path helper for 3-digit padded frame filenames
    function getFrameSrc(index) {
      return `scroling/ezgif-frame-${String(index).padStart(3, '0')}.jpg`;
    }

    // High-DPI crisp canvas sizing with 2x DPR limit for silky performance
    function resizeCanvas() {
      if (!heroCanvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(window.innerWidth * dpr);
      const h = Math.round(window.innerHeight * dpr);

      if (heroCanvas.width !== w || heroCanvas.height !== h) {
        heroCanvas.width = w;
        heroCanvas.height = h;
        drawFrame(Math.round(currentFrame), true);
      }
    }

    // Draw frame onto canvas with full-screen edge-to-edge cover (no black side bars)
    function drawFrame(frameIndex, force = false) {
      if (!ctx || !heroCanvas) return;
      const idx = Math.max(1, Math.min(TOTAL_FRAMES, frameIndex));
      if (!force && idx === lastRenderedFrame) return;

      // Select frame or find nearest available loaded frame (prevents any blank flickers)
      let img = frameImages[idx];
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
          const prev = idx - offset;
          const next = idx + offset;
          if (prev >= 1 && frameImages[prev] && frameImages[prev].complete && frameImages[prev].naturalWidth > 0) {
            img = frameImages[prev];
            break;
          }
          if (next <= TOTAL_FRAMES && frameImages[next] && frameImages[next].complete && frameImages[next].naturalWidth > 0) {
            img = frameImages[next];
            break;
          }
        }
      }

      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = heroCanvas.width;
      const ch = heroCanvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      // True edge-to-edge full-bleed cover (eliminates side black bars on wide/desktop screens)
      const ratio = Math.max(cw / iw, ch / ih);

      const drawW = Math.ceil(iw * ratio);
      const drawH = Math.ceil(ih * ratio);
      const drawX = Math.floor((cw - drawW) / 2);
      const drawY = Math.floor((ch - drawH) / 2);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, iw, ih, drawX, drawY, drawW, drawH);

      lastRenderedFrame = idx;
    }

    // Load Frame 1 instantly for 0ms initial visual display
    const firstImg = new Image();
    firstImg.src = getFrameSrc(1);
    firstImg.onload = () => {
      frameImages[1] = firstImg;
      isCanvasReady = true;
      resizeCanvas();
      drawFrame(1, true);

      // Start preloading the full sequence in progressive milestones
      preloadFrameSequence();
    };

    // Progressive asynchronous frame preloader
    function preloadFrameSequence() {
      // Prioritize milestone frames (every 10th frame), then fill remaining frames
      const queue = [];
      for (let i = 2; i <= TOTAL_FRAMES; i += 8) queue.push(i);
      for (let i = 2; i <= TOTAL_FRAMES; i++) {
        if (!queue.includes(i)) queue.push(i);
      }

      let qIdx = 0;
      function loadNextBatch() {
        const batchSize = 10;
        for (let k = 0; k < batchSize && qIdx < queue.length; k++) {
          const fn = queue[qIdx++];
          if (!frameImages[fn]) {
            const im = new Image();
            im.src = getFrameSrc(fn);
            im.onload = () => {
              frameImages[fn] = im;
            };
          }
        }
        if (qIdx < queue.length) {
          if (window.requestIdleCallback) {
            window.requestIdleCallback(loadNextBatch, { timeout: 100 });
          } else {
            setTimeout(loadNextBatch, 25);
          }
        }
      }
      loadNextBatch();
    }

    // 60-120 FPS requestAnimationFrame Exponential Lerp Loop
    function renderScrubLoop() {
      if (isCanvasReady) {
        const diff = targetFrame - currentFrame;
        if (Math.abs(diff) > 0.01) {
          // Smooth 0.18 lerp coefficient creates silky cinematic gliding
          currentFrame += diff * 0.18;
          drawFrame(Math.round(currentFrame));
        }
      }
      requestAnimationFrame(renderScrubLoop);
    }
    requestAnimationFrame(renderScrubLoop);

    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();
  }

  // Unified Scroll Event Handler
  function handleScroll() {
    const scrollY = window.scrollY;

    // Navbar backdrop elevation
    if (nav) {
      if (scrollY > 50) {
        nav.style.transform = 'translateY(-4px)';
      } else {
        nav.style.transform = 'translateY(0)';
      }
    }

    // Calculate Full Page Scroll Progress (From Creative Director down to Contact Section)
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let progress = scrollY / maxScroll;
    progress = Math.max(0, Math.min(1, progress));

    // Update target frame for the canvas renderer (frame 1 to 205 spanning full website)
    targetFrame = 1 + progress * (TOTAL_FRAMES - 1);

    // Update progress bar UI in hero
    if (scrubFill) {
      scrubFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    // Dynamic Scrubber Label Updates across full portfolio journey
    if (scrubText) {
      if (progress < 0.05) {
        scrubText.textContent = "Scroll to explore portfolio";
      } else if (progress < 0.92) {
        scrubText.textContent = `Shaheedul Muneer • ${(progress * 100).toFixed(0)}%`;
      } else {
        scrubText.textContent = "Direct Contact • Dubai, UAE";
      }
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial run

  // Interactive Capabilities Grid Pills: Click to filter works & glide to projects
  if (servicePillItems.length > 0) {
    servicePillItems.forEach(pill => {
      const activatePillFilter = () => {
        const targetFilter = pill.getAttribute('data-filter') || 'all';
        
        // Find and trigger matching project filter tab
        const matchingTab = document.querySelector(`.filter-tab[data-category="${targetFilter}"]`);
        if (matchingTab) {
          matchingTab.click();
        }

        // Smooth scroll to projects showcase
        const projectsSec = document.getElementById('projects');
        if (projectsSec) {
          projectsSec.scrollIntoView({ behavior: 'smooth' });
        }
      };

      pill.addEventListener('click', activatePillFilter);
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activatePillFilter();
        }
      });
    });
  }

  // Commercial & 3D Ads Playlist (All 11 Videos from animation folder)
  const commercialVideos = [
    {
      id: 1,
      title: "Apex Velocity — Automotive Hero Film",
      category: "Commercial & 3D Ads",
      desc: "Cover automotive film featuring nighttime supercar velocity, dynamic tracking sweeps, motion blur, and anamorphic lens flares.",
      video: "animation/A16D4EAB-99CA-4592-AC0B-4C5CE9C63FAE.mp4",
      label: "Cover Film",
      number: "01"
    },
    {
      id: 2,
      title: "Kinetic Motion — Brand Campaign 02",
      category: "Commercial & 3D Ads",
      desc: "High-energy commercial cut with kinetic camera sweeps, dynamic lighting transitions, and precision rhythm cutting.",
      video: "animation/2BEB788D-E6BE-4723-8685-ACD00D83CE7A.mp4",
      label: "Commercial 02",
      number: "02"
    },
    {
      id: 3,
      title: "Dynamic Velocity — Automotive Spot 03",
      category: "Commercial & 3D Ads",
      desc: "Precision speed sequencing with cinematic grade, aggressive motion tracking, and high-impact sound design pacing.",
      video: "animation/472555B9-D02D-4A30-A924-4E49801921B0.mp4",
      label: "Commercial 03",
      number: "03"
    },
    {
      id: 4,
      title: "Aesthetic Rhythm — Digital Ad 04",
      category: "Commercial & 3D Ads",
      desc: "Clean product pacing and visual storytelling highlighting material textures and synchronized beat timing.",
      video: "animation/58883B73-885A-472F-95F6-B7A6187006FB.mp4",
      label: "Digital Ad 04",
      number: "04"
    },
    {
      id: 5,
      title: "High-Octane Visuals — Commercial 05",
      category: "Commercial & 3D Ads",
      desc: "Fast-cut digital advertising film crafted for maximum viewer retention and striking visual contrast.",
      video: "animation/64B8CEED-D32A-4788-BFF3-C01A85374A6B.mp4",
      label: "Commercial 05",
      number: "05"
    },
    {
      id: 6,
      title: "Cinematic Precision — Motion Campaign 06",
      category: "Commercial & 3D Ads",
      desc: "Feature commercial composition with volumetric illumination, fluid camera dynamics, and hyper-detailed render finish.",
      video: "animation/6808FEFF-061D-4B51-A6A3-7263669C14D0.mp4",
      label: "Campaign 06",
      number: "06"
    },
    {
      id: 7,
      title: "Atmospheric Pace — Commercial 07",
      category: "Commercial & 3D Ads",
      desc: "Mood-driven commercial visual direction showcasing dramatic shadow play and seamless shot choreography.",
      video: "animation/73A30357-8D14-422E-9F57-F8DF299C89FB.mp4",
      label: "Commercial 07",
      number: "07"
    },
    {
      id: 8,
      title: "Neon Nocturne — Visual Ad 08",
      category: "Commercial & 3D Ads",
      desc: "Cyberpunk urban aesthetic with vivid neon reflections, high-speed camera motion, and deep saturated color grading.",
      video: "animation/C95FEE6D-1AA4-482C-816B-1F8B10A8A46E.mp4",
      label: "Visual Ad 08",
      number: "08"
    },
    {
      id: 9,
      title: "Precision Kinetic — Brand Spot 09",
      category: "Commercial & 3D Ads",
      desc: "Minimalist yet punchy digital spot balancing negative space with swift mechanical motion.",
      video: "animation/D1A58A18-EB37-416B-B6A7-9A264B97CFEF.mp4",
      label: "Brand Spot 09",
      number: "09"
    },
    {
      id: 10,
      title: "Fluid Motion — Commercial 10",
      category: "Commercial & 3D Ads",
      desc: "Continuous single-take motion illusion with seamless spatial tracking and fluid transition wipes.",
      video: "animation/D5C40664-8558-4CA7-A733-B2548ED0F952.mp4",
      label: "Commercial 10",
      number: "10"
    },
    {
      id: 11,
      title: "Hyperdrive Sequence — Ad Finale 11",
      category: "Commercial & 3D Ads",
      desc: "Climactic commercial spot with warp speed motion ramps, dynamic anamorphic flare bursts, and explosive sound-sync.",
      video: "animation/D7BC09DF-1F40-4A3B-9434-658D5B58FB21.mp4",
      label: "Film Finale 11",
      number: "11"
    }
  ];

  // Fashion & Editorial Films Playlist (All 13 Videos from fashion/fashion folder)
  const fashionVideos = [
    {
      id: 1,
      title: "Haute Couture — Editorial Fashion Film",
      category: "Fashion & Editorial",
      desc: "Cover editorial fashion film featuring high-fashion garments, dramatic silhouette pacing, and fluid fabric choreography.",
      video: "fashion/fashion/655F0814-F72F-41B7-89C2-ED2EF7A4751B.mp4",
      label: "Cover Film",
      number: "01"
    },
    {
      id: 2,
      title: "Runway Motion — Collection 02",
      category: "Fashion & Editorial",
      desc: "Fast-paced modern runway movement capturing sculptural tailoring, textured textiles, and cinematic spotlight transitions.",
      video: "fashion/fashion/0A9A0B70-6B66-4BEA-BEA9-FC594B207C17.mp4",
      label: "Runway 02",
      number: "02"
    },
    {
      id: 3,
      title: "Minimalist Silhouette — Lookbook 03",
      category: "Fashion & Editorial",
      desc: "Clean architectural garment cuts and monochrome lighting emphasizing posture, elegance, and pure form.",
      video: "fashion/fashion/0FF137FF-DAA7-4BE0-A089-183B7A7A350B.mp4",
      label: "Lookbook 03",
      number: "03"
    },
    {
      id: 4,
      title: "Avant-Garde Draping — Film 04",
      category: "Fashion & Editorial",
      desc: "Experimental textile tension, slow-motion fabric waves, and high-contrast dramatic editorial grade.",
      video: "fashion/fashion/252ADD29-0CAE-4EBF-B64C-76C9D846CA05.mp4",
      label: "Draping 04",
      number: "04"
    },
    {
      id: 5,
      title: "Urban Luxury Form — Campaign 05",
      category: "Fashion & Editorial",
      desc: "Contemporary high-fashion street aesthetics balancing gritty architectural surroundings with sleek luxury silhouettes.",
      video: "fashion/fashion/2CFF7D8D-B56F-4612-B92B-419488FD3D5D.mp4",
      label: "Urban 05",
      number: "05"
    },
    {
      id: 6,
      title: "Fluid Fabric Motion — Editorial 06",
      category: "Fashion & Editorial",
      desc: "Silky continuous camera tracking around dynamic model movement and billowing fabric textures.",
      video: "fashion/fashion/2F1BD5AA-77F0-4B0E-8D98-F8E58711053C.mp4",
      label: "Fluidity 06",
      number: "06"
    },
    {
      id: 7,
      title: "Atelier Aesthetic — Spotlight 07",
      category: "Fashion & Editorial",
      desc: "Artisanal craftsmanship, refined stitching details, and intimate directional lighting.",
      video: "fashion/fashion/765FF137-A277-4AC0-A435-2A4D50093EE0.mp4",
      label: "Atelier 07",
      number: "07"
    },
    {
      id: 8,
      title: "Monochrome Haute Look — Campaign 08",
      category: "Fashion & Editorial",
      desc: "Sculptural shadow direction and deep tonal blacks elevating modern haute couture attire.",
      video: "fashion/fashion/FB3D73A5-6536-4EEB-8C48-C1F746E11C8F.mp4",
      label: "Haute 08",
      number: "08"
    },
    {
      id: 9,
      title: "Heritage Elegance — Saree Film 09",
      category: "Fashion & Editorial",
      desc: "Timeless drape movement, golden hour reflections, and delicate handwoven silk textures.",
      video: "fashion/fashion/Family - Saree.mp4",
      label: "Heritage Saree",
      number: "09"
    },
    {
      id: 10,
      title: "Ensemble Trio — Models Editorial 10",
      category: "Fashion & Editorial",
      desc: "Synchronized group movement and multi-model spatial harmony in high-end occasion wear.",
      video: "fashion/fashion/Family 3 Models.mp4",
      label: "Ensemble 10",
      number: "10"
    },
    {
      id: 11,
      title: "Contemporary Streetwear — Film 11",
      category: "Fashion & Editorial",
      desc: "Dynamic urban rhythm cutting and modern oversized garment movement in natural daylight.",
      video: "fashion/fashion/Sam Bnglr 3.mp4",
      label: "Streetwear 11",
      number: "11"
    },
    {
      id: 12,
      title: "Designer Capsule Reel — Film 12",
      category: "Fashion & Editorial",
      desc: "Curated capsule lookbook sequencing with subtle color grading and rhythmic pacing.",
      video: "fashion/fashion/Saaam blore.mov",
      label: "Capsule 12",
      number: "12"
    },
    {
      id: 13,
      title: "Nocturne Black Collection — Finale 13",
      category: "Fashion & Editorial",
      desc: "Sophisticated dark monochrome palette showcasing technical fabrics, matte textures, and nocturnal glamour.",
      video: "fashion/fashion/Saamsameer black.mov",
      label: "Finale Black 13",
      number: "13"
    }
  ];

  // Food & Culinary Films Playlist (All 13 Videos from food/Food& Restaurant folder)
  const foodVideos = [
    {
      id: 1,
      title: "Sizzling Gourmet — Culinary Hero Film",
      category: "Food & Culinary",
      desc: "Cover culinary commercial showcasing sizzling high-heat searing, flame-grilled textures, and mouthwatering food styling.",
      video: "food/Food& Restaurant/1492DEE8-1C96-4303-99DE-5FF55E2486C8.mp4",
      label: "Cover Film",
      number: "01"
    },
    {
      id: 2,
      title: "Artisan Plating — Course 02",
      category: "Food & Culinary",
      desc: "Delicate haute-cuisine plating precision with micro-herbs, smooth sauce arcs, and high-speed motion capture.",
      video: "food/Food& Restaurant/3F58F0A5-EBA0-4F21-A153-EE831C54AAB0.mp4",
      label: "Plating 02",
      number: "02"
    },
    {
      id: 3,
      title: "Culinary Chemistry — Film 03",
      category: "Food & Culinary",
      desc: "Dynamic ingredient collisions, fluid splashes, and crisp textural sound-synchronization.",
      video: "food/Food& Restaurant/450D8EDB-8E96-4BE1-954D-11B8C44CCD5A.mp4",
      label: "Chemistry 03",
      number: "03"
    },
    {
      id: 4,
      title: "Chef Precision Craft — Film 04",
      category: "Food & Culinary",
      desc: "Intimate master chef hand movements, razor-sharp knife skills, and ambient kitchen illumination.",
      video: "food/Food& Restaurant/4E7E34E2-8007-417B-8027-ACD2D83BD5DE.mp4",
      label: "Chef Craft 04",
      number: "04"
    },
    {
      id: 5,
      title: "Gastronomy Flavour Burst — Spot 05",
      category: "Food & Culinary",
      desc: "Vibrant multi-sensory flavor commercial with golden caramelization and rich steam wafts.",
      video: "food/Food& Restaurant/575488F9-708B-42A1-92F1-E84C15DDEA51.mp4",
      label: "Flavour 05",
      number: "05"
    },
    {
      id: 6,
      title: "Flame & Searing Motion — Reel 06",
      category: "Food & Culinary",
      desc: "Dramatic open fire cooking, blazing charcoal ember sparks, and cinematic slow-motion sizzles.",
      video: "food/Food& Restaurant/6AB9A1AA-0F00-461E-8E48-DCD1DC3E5C47.mp4",
      label: "Fire Searing 06",
      number: "06"
    },
    {
      id: 7,
      title: "Fresh Organic Harvest — Commercial 07",
      category: "Food & Culinary",
      desc: "Lush farm-to-table farm fresh produce, crisp water droplet macro photography, and clean natural lighting.",
      video: "food/Food& Restaurant/A4B20203-D9A2-47C7-BA25-36BD61573B12.mp4",
      label: "Harvest 07",
      number: "07"
    },
    {
      id: 8,
      title: "Velvety Sauce Drizzle — Film 08",
      category: "Food & Culinary",
      desc: "Sensual slow-motion glossy demi-glace drizzle over tender pan-roasted steak.",
      video: "food/Food& Restaurant/A80818F8-F7C1-49CD-9166-9AB94F2B2204.mp4",
      label: "Sauce Drizzle 08",
      number: "08"
    },
    {
      id: 9,
      title: "Sweet Confectionery Art — Spot 09",
      category: "Food & Culinary",
      desc: "Pastry chef chocolate tempering, molten dessert fills, and delicate powdered sugar snowfall.",
      video: "food/Food& Restaurant/D84D120F-8E95-4C1C-AEA7-E4FCBB6201AC.mp4",
      label: "Dessert Art 09",
      number: "09"
    },
    {
      id: 10,
      title: "Signature Dining Course — Commercial 10",
      category: "Food & Culinary",
      desc: "Luxury restaurant ambiance, fine wine pouring reflections, and elegant table settings.",
      video: "food/Food& Restaurant/E07D5EEC-A72F-404E-B451-A4A3C0C20C65.mp4",
      label: "Fine Dining 10",
      number: "10"
    },
    {
      id: 11,
      title: "High-Heat Wok Toss — Dynamic 11",
      category: "Food & Culinary",
      desc: "Explosive wok hei wok tossing, flying noodles, vibrant stir-fry veggies, and fast rhythm cutting.",
      video: "food/Food& Restaurant/FC87E39C-0CA2-4610-8E1D-2AAA98B4D115.mp4",
      label: "Wok Toss 11",
      number: "11"
    },
    {
      id: 12,
      title: "Restaurant Ambiance Reel — Film 12",
      category: "Food & Culinary",
      desc: "Atmospheric evening eatery cinematography capturing the energy of dining, laughter, and craft mixology.",
      video: "food/Food& Restaurant/JUNE 16-26-content 4 out 2.mp4",
      label: "Ambiance 12",
      number: "12"
    },
    {
      id: 13,
      title: "Master Feast Feature — Finale 13",
      category: "Food & Culinary",
      desc: "Grand culinary banquet showcase highlighting diverse global cuisines, sizzling cuts, and celebratory banqueting.",
      video: "food/Food& Restaurant/JUNE 16-26-content 5  part 1.mp4",
      label: "Grand Feast 13",
      number: "13"
    }
  ];

  // Card 2: Continuous Sequential Cycling for Commercial & 3D Ads Cover Video
  let currentCommercialCoverIndex = 0;
  if (commercialCoverVideo) {
    const cycleCommercial = () => {
      // Advance to the next video in the commercial playlist
      currentCommercialCoverIndex = (currentCommercialCoverIndex + 1) % commercialVideos.length;

      // Silky smooth crossfade
      commercialCoverVideo.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
      commercialCoverVideo.style.opacity = '0.35';
      commercialCoverVideo.style.transform = 'scale(0.99)';

      setTimeout(() => {
        commercialCoverVideo.src = commercialVideos[currentCommercialCoverIndex].video;
        commercialCoverVideo.muted = true;
        commercialCoverVideo.currentTime = 0;
        const p = commercialCoverVideo.play();
        if (p !== undefined) p.catch(() => {});

        setTimeout(() => {
          commercialCoverVideo.style.opacity = '1';
          commercialCoverVideo.style.transform = 'scale(1)';
        }, 120);
      }, 200);
    };

    commercialCoverVideo.addEventListener('ended', cycleCommercial);
    commercialCoverVideo.addEventListener('error', cycleCommercial);
  }

  // Card 3: Continuous Sequential Cycling for Fashion Cover Video (Optimized lightweight clips)
  const fashionCoverPlaylist = fashionVideos.filter(v => !v.video.endsWith('.mov') && !v.video.includes('JUNE') && !v.video.includes('Family'));
  let currentFashionCoverIndex = 0;
  if (fashionCoverVideo) {
    const cycleFashion = () => {
      if (fashionCoverPlaylist.length === 0) return;
      currentFashionCoverIndex = (currentFashionCoverIndex + 1) % fashionCoverPlaylist.length;

      // Silky smooth crossfade
      fashionCoverVideo.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
      fashionCoverVideo.style.opacity = '0.35';
      fashionCoverVideo.style.transform = 'scale(0.99)';

      setTimeout(() => {
        fashionCoverVideo.src = fashionCoverPlaylist[currentFashionCoverIndex].video;
        fashionCoverVideo.muted = true;
        fashionCoverVideo.currentTime = 0;
        const p = fashionCoverVideo.play();
        if (p !== undefined) p.catch(() => {});

        setTimeout(() => {
          fashionCoverVideo.style.opacity = '1';
          fashionCoverVideo.style.transform = 'scale(1)';
        }, 120);
      }, 200);
    };

    fashionCoverVideo.addEventListener('ended', cycleFashion);
    fashionCoverVideo.addEventListener('error', cycleFashion);
  }


  // High-Profile & Celebrity Films Playlist (All 8 Videos from celebrity/Celebrity folder)
  const celebrityVideos = [
    {
      id: 1,
      title: "VIP Spotlight — Celebrity Hero Commercial",
      category: "High-Profile & Celebrity",
      desc: "Cover celebrity film featuring cinematic spotlight tracking, high-profile talent charisma, and prestige commercial finish.",
      video: "celebrity/Celebrity/B4EAC4EA-34FC-4CD7-B7B4-BEA0FEB75E32.mp4",
      label: "Cover Film",
      number: "01"
    },
    {
      id: 2,
      title: "Celebrity Endorsement — Commercial 02",
      category: "High-Profile & Celebrity",
      desc: "Prime endorsement campaign balancing intimate close-up performance with dramatic brand storytelling.",
      video: "celebrity/Celebrity/C15969AA-77D6-4A9D-B586-A862B6ADCCBD.mp4",
      label: "Endorsement 02",
      number: "02"
    },
    {
      id: 3,
      title: "Red Carpet Glamour — Visual Reel 03",
      category: "High-Profile & Celebrity",
      desc: "High-energy red carpet atmosphere, flashing paparazzi strobes, and fluid slow-motion entrance choreography.",
      video: "celebrity/Celebrity/C7FC30AF-E88F-4194-9699-D5E2EF695C4A.mp4",
      label: "Red Carpet 03",
      number: "03"
    },
    {
      id: 4,
      title: "Iconic Persona — Campaign 04",
      category: "High-Profile & Celebrity",
      desc: "Striking black-and-gold lighting aesthetic highlighting talent expression, posture, and iconic presence.",
      video: "celebrity/Celebrity/C8B96147-9C86-44F1-9BBA-B09558EF07FD.mp4",
      label: "Persona 04",
      number: "04"
    },
    {
      id: 5,
      title: "Luxury Ambassador — Brand Feature 05",
      category: "High-Profile & Celebrity",
      desc: "High-production luxury watch and timepiece commercial with macro details and VIP brand prestige.",
      video: "celebrity/Celebrity/FE24FCA7-EFCD-4C80-8375-0FEE06B89FB5.mp4",
      label: "Ambassador 05",
      number: "05"
    },
    {
      id: 6,
      title: "Signature Portrait Motion — Reel 06",
      category: "High-Profile & Celebrity",
      desc: "Artistic monochrome portrait motion with calibrated shadow gradations and subtle slow pans.",
      video: "celebrity/Celebrity/Saaam blore.mov",
      label: "Portrait Motion 06",
      number: "06"
    },
    {
      id: 7,
      title: "Nocturne VIP Monologue — Film 07",
      category: "High-Profile & Celebrity",
      desc: "Mood-driven nighttime performance piece capturing intimate vocal delivery and cinematic anamorphic bokeh.",
      video: "celebrity/Celebrity/Saamsameer black.mov",
      label: "Nocturne VIP 07",
      number: "07"
    },
    {
      id: 8,
      title: "High-Profile Finale — Commercial 08",
      category: "High-Profile & Celebrity",
      desc: "Climactic commercial montage uniting high-profile appearances with explosive pacing and rhythm cutting.",
      video: "celebrity/Celebrity/Sam Bnglr 3.mp4",
      label: "Finale VIP 08",
      number: "08"
    },
    {
      id: 9,
      title: "NKOS — Emergent #1 Community Breakthrough",
      category: "VIP Motion & Commercial Direction",
      desc: "A few weeks ago, NKOS didn’t exist. Today, it’s the #1 community-upvoted project in Emergent. High-impact kinetic typography and UI reveal.",
      video: "animation/nandu/nkos_vip_emergent.mp4",
      label: "VIP Winner 09",
      number: "09"
    }
  ];

  // Card 4: Culinary & Food Cover Video - Lightweight clips only (skips massive 245MB/97MB files from auto-rotation)
  const foodCoverPlaylist = foodVideos.filter(v => !v.video.includes('JUNE'));
  let currentFoodCoverIndex = 0;
  let isFoodCutTriggered = false;

  function advanceFoodCoverVideo() {
    if (!foodCoverVideo || isFoodCutTriggered || foodCoverPlaylist.length === 0) return;
    isFoodCutTriggered = true;
    currentFoodCoverIndex = (currentFoodCoverIndex + 1) % foodCoverPlaylist.length;

    // Silky smooth half-cut dissolve transition
    foodCoverVideo.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    foodCoverVideo.style.opacity = '0.35';
    foodCoverVideo.style.transform = 'scale(0.99)';

    setTimeout(() => {
      foodCoverVideo.src = foodCoverPlaylist[currentFoodCoverIndex].video;
      foodCoverVideo.muted = true;
      foodCoverVideo.currentTime = 0;
      const p = foodCoverVideo.play();
      if (p !== undefined) p.catch(() => {});

      setTimeout(() => {
        foodCoverVideo.style.opacity = '1';
        foodCoverVideo.style.transform = 'scale(1)';
        // Re-enable half-cut after new video is running
        setTimeout(() => {
          isFoodCutTriggered = false;
        }, 800);
      }, 120);
    }, 200);
  }

  if (foodCoverVideo) {
    // When video ends naturally
    foodCoverVideo.addEventListener('ended', () => {
      if (!isFoodCutTriggered) {
        advanceFoodCoverVideo();
      }
    });

    // Skip to next if format/load error
    foodCoverVideo.addEventListener('error', () => {
      advanceFoodCoverVideo();
    });

    // "One video half cut, start another video outside":
    // Dynamically cuts when the clip reaches half of its duration (currentTime >= duration / 2)
    foodCoverVideo.addEventListener('timeupdate', () => {
      if (!isFoodCutTriggered && foodCoverVideo.duration && isFinite(foodCoverVideo.duration) && foodCoverVideo.duration > 1) {
        const halfCutPoint = foodCoverVideo.duration / 2;
        if (foodCoverVideo.currentTime >= halfCutPoint) {
          advanceFoodCoverVideo();
        }
      }
    });
  }

  // Card 5: High-Profile Celebrity Works - Lightweight clips only (skips .mov files from auto-rotation)
  const celebrityCoverPlaylist = celebrityVideos.filter(v => !v.video.endsWith('.mov'));
  let currentCelebrityCoverIndex = 0;
  let isCelebrityCutTriggered = false;

  function advanceCelebrityCoverVideo() {
    if (!celebrityCoverVideo || isCelebrityCutTriggered || celebrityCoverPlaylist.length === 0) return;
    isCelebrityCutTriggered = true;
    currentCelebrityCoverIndex = (currentCelebrityCoverIndex + 1) % celebrityCoverPlaylist.length;

    // Silky smooth half-cut dissolve transition
    celebrityCoverVideo.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    celebrityCoverVideo.style.opacity = '0.35';
    celebrityCoverVideo.style.transform = 'scale(0.99)';

    setTimeout(() => {
      celebrityCoverVideo.src = celebrityCoverPlaylist[currentCelebrityCoverIndex].video;
      celebrityCoverVideo.muted = true;
      celebrityCoverVideo.currentTime = 0;
      const p = celebrityCoverVideo.play();
      if (p !== undefined) p.catch(() => {});

      setTimeout(() => {
        celebrityCoverVideo.style.opacity = '1';
        celebrityCoverVideo.style.transform = 'scale(1)';
        // Re-enable half-cut after new video is running
        setTimeout(() => {
          isCelebrityCutTriggered = false;
        }, 800);
      }, 120);
    }, 200);
  }

  if (celebrityCoverVideo) {
    // When video ends naturally
    celebrityCoverVideo.addEventListener('ended', () => {
      if (!isCelebrityCutTriggered) {
        advanceCelebrityCoverVideo();
      }
    });

    // Skip to next if format/load error
    celebrityCoverVideo.addEventListener('error', () => {
      advanceCelebrityCoverVideo();
    });

    // "One video half cut, start another video outside":
    // Dynamically cuts when the clip reaches half of its duration (currentTime >= duration / 2)
    celebrityCoverVideo.addEventListener('timeupdate', () => {
      if (!isCelebrityCutTriggered && celebrityCoverVideo.duration && isFinite(celebrityCoverVideo.duration) && celebrityCoverVideo.duration > 1) {
        const halfCutPoint = celebrityCoverVideo.duration / 2;
        if (celebrityCoverVideo.currentTime >= halfCutPoint) {
          advanceCelebrityCoverVideo();
        }
      }
    });
  }

  // Behind the Scenes Films Playlist (All 8 Videos from Behind the scenes folder)
  const btsVideos = [
    {
      id: 1,
      title: "On-Set Rigging — Production Hero BTS",
      category: "Behind the Scenes",
      desc: "Raw on-set production footage showcasing camera rigging, lens calibration, and dynamic camera movement direction.",
      video: "Behind the scenes/078878F0-E7FA-4F22-A9B5-7CFEBAACDE40.mp4",
      label: "On-Set Hero 01",
      number: "01"
    },
    {
      id: 2,
      title: "Directing in Action — Set Lighting BTS 02",
      category: "Behind the Scenes",
      desc: "Director Shaheedul Muneer guiding talent blocking, lighting mood adjustments, and collaborative crew synchronization.",
      video: "Behind the scenes/1665108D-AD69-41D0-BFA0-5AA7D94E584D.mp4",
      label: "Directing 02",
      number: "02"
    },
    {
      id: 3,
      title: "Commercial Workflow — Crew Synchronization 03",
      category: "Behind the Scenes",
      desc: "Fast-paced commercial set workflow, monitor checks, camera tracking rehearsals, and live creative adjustments.",
      video: "Behind the scenes/278FA250-1EE5-4109-B695-A2633F253F20.mp4",
      label: "Commercial BTS 03",
      number: "03"
    },
    {
      id: 4,
      title: "Studio Cinematography — Rigging & Framing 04",
      category: "Behind the Scenes",
      desc: "High-precision studio rig setup, framing choices, and camera focal testing for maximum visual punch.",
      video: "Behind the scenes/C3DBD84D-5CF6-4FDB-B37A-AD9800F877E0.mp4",
      label: "Studio Rig 04",
      number: "04"
    },
    {
      id: 5,
      title: "Culinary Set Magic — Food Styling & Lighting 05",
      category: "Behind the Scenes",
      desc: "Behind-the-lens look at sizzling food styling, heat capture, high-speed lighting triggers, and live plating.",
      video: "Behind the scenes/They said they were cooking something…But somehow they already ate it. ....video production, ree.mp4",
      label: "Food Styling BTS 05",
      number: "05"
    },
    {
      id: 6,
      title: "Creative Strategy — Production Growth 06",
      category: "Behind the Scenes",
      desc: "Translating brand marketing goals into high-impact visual execution, storyboard breakdowns, and execution.",
      video: "Behind the scenes/Your next level of growth needs a smarter marketing partner.We bring strategy, execution, and re.mp4",
      label: "Strategy BTS 06",
      number: "06"
    },
    {
      id: 7,
      title: "Peaceful Staycation — Location Filming 07",
      category: "Behind the Scenes",
      desc: "On-location scenic shoot capturing natural golden hour lighting, tranquil environment pacing, and handheld camera work.",
      video: "Behind the scenes/நிம்மதி❤️A pause to restart, to rethink..........workation, staycation, peaceful stay, relaxatio.mp4",
      label: "Location BTS 07",
      number: "07"
    },
    {
      id: 8,
      title: "Vision & Gratitude — Year-End Creative Wrap 08",
      category: "Behind the Scenes",
      desc: "Celebratory production wrap, reflective creative montage, and forward-looking cinematic vision for 2026.",
      video: "Behind the scenes/✨ Hello 2026, with Gratitude & Vision ✨As 2025 comes to a close, we’re thankful for every idea c.mp4",
      label: "Finale Wrap 08",
      number: "08"
    }
  ];

  // Card 6: Behind the Scenes Cover Video - Half-cut dynamic cycling outside on the card
  let currentBtsCoverIndex = 0;
  let isBtsCutTriggered = false;

  function advanceBtsCoverVideo() {
    if (!btsCoverVideo || isBtsCutTriggered) return;
    isBtsCutTriggered = true;
    currentBtsCoverIndex = (currentBtsCoverIndex + 1) % btsVideos.length;

    // Silky smooth half-cut dissolve transition
    btsCoverVideo.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    btsCoverVideo.style.opacity = '0.35';
    btsCoverVideo.style.transform = 'scale(0.99)';

    setTimeout(() => {
      btsCoverVideo.src = btsVideos[currentBtsCoverIndex].video;
      btsCoverVideo.muted = true;
      btsCoverVideo.currentTime = 0;
      const p = btsCoverVideo.play();
      if (p !== undefined) p.catch(() => {});

      setTimeout(() => {
        btsCoverVideo.style.opacity = '1';
        btsCoverVideo.style.transform = 'scale(1)';
        // Re-enable half-cut after new video is running
        setTimeout(() => {
          isBtsCutTriggered = false;
        }, 800);
      }, 120);
    }, 200);
  }

  if (btsCoverVideo) {
    // When video ends naturally
    btsCoverVideo.addEventListener('ended', () => {
      if (!isBtsCutTriggered) {
        advanceBtsCoverVideo();
      }
    });

    // Skip to next if format/load error
    btsCoverVideo.addEventListener('error', () => {
      advanceBtsCoverVideo();
    });

    // "One video half cut, start another video outside":
    // Dynamically cuts when the clip reaches half of its duration (currentTime >= duration / 2)
    btsCoverVideo.addEventListener('timeupdate', () => {
      if (!isBtsCutTriggered && btsCoverVideo.duration && isFinite(btsCoverVideo.duration) && btsCoverVideo.duration > 1) {
        const halfCutPoint = btsCoverVideo.duration / 2;
        if (btsCoverVideo.currentTime >= halfCutPoint) {
          advanceBtsCoverVideo();
        }
      }
    });
  }

  // =========================================================================
  // Mobile & iOS Safari Viewport Video Controller
  // Solves iOS video decoder exhaustion and ensures instant autoplay on iPhone
  // =========================================================================
  const showcaseCoverVideos = [
    celebrityCoverVideo,
    fashionCoverVideo,
    foodCoverVideo,
    commercialCoverVideo,
    btsCoverVideo
  ].filter(Boolean);

  // 1. Enforce WebKit mobile autoplay attributes on DOM properties
  showcaseCoverVideos.forEach(v => {
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('loop', '');
  });

  // 2. Play only the video currently visible on screen (respects iOS 2-decoder limit)
  if ('IntersectionObserver' in window) {
    const cardVisibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const vid = entry.target;
        if (entry.isIntersecting) {
          vid.muted = true;
          const playPromise = vid.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          vid.pause();
        }
      });
    }, {
      threshold: 0.15
    });

    showcaseCoverVideos.forEach(v => cardVisibilityObserver.observe(v));
  } else {
    showcaseCoverVideos.forEach(v => v.play().catch(() => {}));
  }

  // 3. iPhone First-Touch / Scroll Wakeup:
  const triggerMobilePlayback = () => {
    showcaseCoverVideos.forEach(v => {
      const rect = v.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        v.muted = true;
        v.play().catch(() => {});
      }
    });
  };

  window.addEventListener('touchstart', triggerMobilePlayback, { passive: true });
  window.addEventListener('scroll', triggerMobilePlayback, { passive: true });
  window.addEventListener('click', triggerMobilePlayback, { passive: true });

  // Modal Interactive Content Map (6 Projects covering Shaheedul Muneer's specializations)
  const projectDetails = {
    myworks: {
      title: "My Works — Motion & Title Direction",
      category: "Video Editing & Motion Graphics",
      desc: "Comprehensive showcase of kinetic typography, rhythm editing, title sequences, and color grading by Shaheedul Muneer.",
      video: "assets/scroll_animation.mp4",
      driveUrl: "https://drive.google.com/open?id=1OevTYhwwUEchpa1mBQsDN2e0XZhD9LBn&usp=drive_copy"
    },
    commercial: {
      title: "Apex Velocity — Automotive Hero Film",
      category: "Commercial & 3D Ads",
      desc: "Nighttime automotive commercial, dynamic 3D motion design, and high-impact digital advertising films across 11 featured commercials.",
      video: "animation/A16D4EAB-99CA-4592-AC0B-4C5CE9C63FAE.mp4",
      hasMultiVideo: true,
      playlistTitle: "Commercial & 3D Ads Playlist",
      multiBadgeText: "11 Films Included",
      videoList: commercialVideos
    },
    fashion: {
      title: "Haute Couture — Editorial Fashion Film",
      category: "Fashion & Editorial",
      desc: "Luxury fashion cinematography, editorial runway direction, and avant-garde motion campaigns across 13 featured fashion films.",
      video: "fashion/fashion/655F0814-F72F-41B7-89C2-ED2EF7A4751B.mp4",
      hasMultiVideo: true,
      playlistTitle: "Fashion & Editorial Films Playlist",
      multiBadgeText: "13 Films Included",
      videoList: fashionVideos
    },
    food: {
      title: "Sizzling Gourmet — Culinary & Food Film",
      category: "Food & Culinary",
      desc: "High-speed culinary cinematography, artisan plating choreography, sizzling grill dynamics, and gourmet restaurant advertising films across 13 featured productions.",
      video: "food/Food& Restaurant/1492DEE8-1C96-4303-99DE-5FF55E2486C8.mp4",
      hasMultiVideo: true,
      playlistTitle: "Food & Restaurant Films Playlist",
      multiBadgeText: "13 Films Included",
      videoList: foodVideos
    },
    celebrity: {
      title: "VIP Spotlight — Celebrity Hero Commercial",
      category: "High-Profile & Celebrity",
      desc: "Exclusive high-profile celebrity campaigns, luxury brand endorsements, VIP talent film direction, and red carpet visual production across 9 featured films.",
      video: "celebrity/Celebrity/B4EAC4EA-34FC-4CD7-B7B4-BEA0FEB75E32.mp4",
      hasMultiVideo: true,
      playlistTitle: "High-Profile & Celebrity Films Playlist",
      multiBadgeText: "9 Films Included",
      videoList: celebrityVideos
    },
    'nkos-vip': {
      title: "NKOS — #1 Emergent Community Breakthrough",
      category: "VIP Motion & Commercial Direction",
      desc: "A few weeks ago, NKOS didn’t exist. Today, it’s the #1 community-upvoted project on Emergent. Engineered with surgical pacing, kinetic type choreography, and commercial-grade visual impact.",
      video: "animation/nandu/nkos_vip_emergent.mp4"
    },
    bts: {
      title: "On-Set Rigging — Production Hero BTS",
      category: "Behind the Scenes & Production",
      desc: "Exclusive on-set cinematography, director in action, camera rigging, lighting setups, and raw creative process across 8 featured production films.",
      video: "Behind the scenes/078878F0-E7FA-4F22-A9B5-7CFEBAACDE40.mp4",
      hasMultiVideo: true,
      playlistTitle: "Behind the Scenes Films Playlist",
      multiBadgeText: "8 BTS Films Included",
      videoList: btsVideos
    },
    apparel: {
      title: "On-Set Rigging — Production Hero BTS",
      category: "Behind the Scenes & Production",
      desc: "Exclusive on-set cinematography, director in action, camera rigging, lighting setups, and raw creative process across 8 featured production films.",
      video: "Behind the scenes/078878F0-E7FA-4F22-A9B5-7CFEBAACDE40.mp4",
      hasMultiVideo: true,
      playlistTitle: "Behind the Scenes Films Playlist",
      multiBadgeText: "8 BTS Films Included",
      videoList: btsVideos
    }
  };

  // State for active multi-video modal playlist
  let activeMultiVideoList = [];
  let activeMultiVideoIndex = 0;

  // Initialize interactive thumbnail track for multi-video collections
  function initMultiVideoThumbnails(videoList) {
    if (!reelThumbnailsTrack || !videoList) return;
    activeMultiVideoList = videoList;
    reelThumbnailsTrack.innerHTML = '';

    videoList.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `reel-thumbnail-item ${idx === 0 ? 'active' : ''}`;
      card.setAttribute('data-index', idx);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Play ${item.title}`);

      card.innerHTML = `
        <div class="reel-thumb-media">
          <video src="${item.video}" muted loop playsinline preload="metadata" class="thumb-mini-video"></video>
          <span class="thumb-number-tag">${item.number}</span>
          <div class="thumb-play-overlay">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
          </div>
          <div class="thumb-playing-bars">
            <span class="bar bar-1"></span>
            <span class="bar bar-2"></span>
            <span class="bar bar-3"></span>
          </div>
        </div>
        <div class="reel-thumb-info">
          <span class="thumb-title">${item.label}</span>
        </div>
      `;

      const miniVideo = card.querySelector('video');

      // Hover to preview mini clip
      card.addEventListener('mouseenter', () => {
        if (miniVideo) {
          miniVideo.play().catch(() => {});
        }
      });
      card.addEventListener('mouseleave', () => {
        if (miniVideo) {
          miniVideo.pause();
          miniVideo.currentTime = 0;
        }
      });

      // Click to play film in main player
      card.addEventListener('click', () => {
        switchActiveMultiVideo(idx, true);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchActiveMultiVideo(idx, true);
        }
      });

      reelThumbnailsTrack.appendChild(card);
    });
  }

  // Smoothly switch active video in main modal player
  function switchActiveMultiVideo(index, autoPlay = true) {
    if (!activeMultiVideoList || index < 0 || index >= activeMultiVideoList.length) return;
    activeMultiVideoIndex = index;
    const item = activeMultiVideoList[index];

    // Smooth transition dissolve
    if (modalVideo) {
      modalVideo.classList.add('is-transitioning');
    }

    setTimeout(() => {
      modalTitle.textContent = item.title;
      modalTag.textContent = item.category;
      modalDesc.textContent = item.desc;

      if (videoCounterLabel) {
        videoCounterLabel.textContent = `Film ${item.number} of ${activeMultiVideoList.length}`;
      }

      // Update active thumbnail item and smooth scroll into view
      if (reelThumbnailsTrack) {
        const thumbItems = reelThumbnailsTrack.querySelectorAll('.reel-thumbnail-item');
        thumbItems.forEach((thumb, idx) => {
          if (idx === index) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            thumb.classList.remove('active');
          }
        });
      }

      if (modalVideo) {
        modalVideo.src = item.video;
        modalVideo.load();
        if (autoPlay) {
          const playPromise = modalVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // If browser blocks unmuted autoplay, smoothly fall back to muted so video starts immediately
              modalVideo.muted = true;
              modalVideo.play().catch(() => {});
            });
          }
        }
      }

      setTimeout(() => {
        if (modalVideo) {
          modalVideo.classList.remove('is-transitioning');
        }
      }, 120);
    }, 180);
  }

  // Setup navigation arrows and continuous playback
  if (prevVideoBtn) {
    prevVideoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeMultiVideoList && activeMultiVideoList.length > 0) {
        const prevIndex = (activeMultiVideoIndex - 1 + activeMultiVideoList.length) % activeMultiVideoList.length;
        switchActiveMultiVideo(prevIndex, true);
      }
    });
  }

  if (nextVideoBtn) {
    nextVideoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeMultiVideoList && activeMultiVideoList.length > 0) {
        const nextIndex = (activeMultiVideoIndex + 1) % activeMultiVideoList.length;
        switchActiveMultiVideo(nextIndex, true);
      }
    });
  }

  if (trackScrollLeft && reelThumbnailsTrack) {
    trackScrollLeft.addEventListener('click', () => {
      reelThumbnailsTrack.scrollBy({ left: -220, behavior: 'smooth' });
    });
  }

  if (trackScrollRight && reelThumbnailsTrack) {
    trackScrollRight.addEventListener('click', () => {
      reelThumbnailsTrack.scrollBy({ left: 220, behavior: 'smooth' });
    });
  }

  if (modalVideo) {
    modalVideo.addEventListener('ended', () => {
      if (modalDialog && modalDialog.classList.contains('has-multi-video') && activeMultiVideoList.length > 0) {
        const nextIndex = (activeMultiVideoIndex + 1) % activeMultiVideoList.length;
        switchActiveMultiVideo(nextIndex, true);
      }
    });

    // Click on modal video to toggle play/pause easily
    modalVideo.addEventListener('click', (e) => {
      // If user clicked directly on the video viewport
      if (modalVideo.paused) {
        modalVideo.play().catch(() => {});
      } else {
        modalVideo.pause();
      }
    });
  }

  // Helper to open project modal by key
  function openProjectByKey(key) {
    const data = projectDetails[key];
    if (data) {
      modalTitle.textContent = data.title;
      modalTag.textContent = data.category;
      modalDesc.textContent = data.desc;

      if (data.hasMultiVideo) {
        // Multi-Video Suite (Commercial & 3D Ads, Fashion, Food, Celebrity)
        if (modalDialog) modalDialog.classList.add('has-multi-video');
        if (modalMultiBadge) {
          modalMultiBadge.textContent = data.multiBadgeText || `${data.videoList.length} Films Included`;
          modalMultiBadge.style.display = 'inline-flex';
        }
        if (reelGalleryTitleText) {
          reelGalleryTitleText.textContent = data.playlistTitle || 'Featured Films Playlist';
        }
        if (modalReelGallery) modalReelGallery.style.display = 'block';
        if (modalVideoNavBar) modalVideoNavBar.style.display = 'flex';
        if (modalVideoShell) modalVideoShell.style.display = 'block';
        if (modalImg) modalImg.style.display = 'none';
        if (modalVideo) modalVideo.style.display = 'block';

        initMultiVideoThumbnails(data.videoList);
        switchActiveMultiVideo(0, true);
      } else {
        // Standard Single Image / Single Video Projects
        if (modalDialog) modalDialog.classList.remove('has-multi-video');
        if (modalMultiBadge) modalMultiBadge.style.display = 'none';
        if (modalReelGallery) modalReelGallery.style.display = 'none';
        if (modalVideoNavBar) modalVideoNavBar.style.display = 'none';

        if (data.video && modalVideo) {
          if (modalImg) modalImg.style.display = 'none';
          if (modalVideoShell) modalVideoShell.style.display = 'block';
          modalVideo.style.display = 'block';
          modalVideo.src = data.video;
          modalVideo.load();
          const playPromise = modalVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              modalVideo.muted = true;
              modalVideo.play().catch(() => {});
            });
          }
        } else {
          if (modalVideo) {
            modalVideo.pause();
            modalVideo.style.display = 'none';
          }
          if (modalVideoShell) modalVideoShell.style.display = 'none';
          if (modalImg) {
            modalImg.style.display = 'block';
            modalImg.src = data.image;
            modalImg.alt = data.title;
          }
        }
      }

      if (data.driveUrl && modalActionRow) {
        modalActionRow.style.display = 'block';
      } else if (modalActionRow) {
        modalActionRow.style.display = 'none';
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  // Open Project Modal for showcase cards
  const allProjectCards = document.querySelectorAll('.showcase-card');
  allProjectCards.forEach(card => {
    const triggerCardModal = (e) => {
      // If user clicked the external drive link directly, let it open
      if (e && e.target && e.target.closest && e.target.closest('.drive-link-badge')) return;

      const key = card.getAttribute('data-project');
      openProjectByKey(key);
    };

    card.addEventListener('click', triggerCardModal);
    const wrap = card.querySelector('.card-media-wrap');
    if (wrap) {
      wrap.addEventListener('click', triggerCardModal);
    }
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerCardModal(e);
      }
    });
  });

  // VIP Spotlight Player & Interactive Controls
  const vipSpotlightVideo = document.getElementById('vipSpotlightVideo');
  const vipPlayPauseBtn = document.getElementById('vipPlayPauseBtn');
  const vipMuteToggleBtn = document.getElementById('vipMuteToggleBtn');
  const vipSoundLabel = document.getElementById('vipSoundLabel');
  const vipOpenModalBtn = document.getElementById('vipOpenModalBtn');
  const vipContactBtn = document.getElementById('vipContactBtn');

  if (vipSpotlightVideo && vipPlayPauseBtn) {
    const iconPause = vipPlayPauseBtn.querySelector('.icon-pause');
    const iconPlay = vipPlayPauseBtn.querySelector('.icon-play');
    const label = vipPlayPauseBtn.querySelector('.vip-btn-label');

    function toggleVipPlay() {
      if (vipSpotlightVideo.paused) {
        vipSpotlightVideo.play().catch(() => {});
        if (iconPause) iconPause.style.display = 'inline-block';
        if (iconPlay) iconPlay.style.display = 'none';
        if (label) label.textContent = 'Pause';
      } else {
        vipSpotlightVideo.pause();
        if (iconPause) iconPause.style.display = 'none';
        if (iconPlay) iconPlay.style.display = 'inline-block';
        if (label) label.textContent = 'Play';
      }
    }

    vipPlayPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleVipPlay();
    });

    vipSpotlightVideo.addEventListener('click', () => {
      toggleVipPlay();
    });
  }

  if (vipSpotlightVideo && vipMuteToggleBtn) {
    const iconMuted = vipMuteToggleBtn.querySelector('.icon-muted');
    const iconUnmuted = vipMuteToggleBtn.querySelector('.icon-unmuted');

    vipMuteToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      vipSpotlightVideo.muted = !vipSpotlightVideo.muted;
      if (vipSpotlightVideo.muted) {
        if (iconMuted) iconMuted.style.display = 'inline-block';
        if (iconUnmuted) iconUnmuted.style.display = 'none';
        if (vipSoundLabel) vipSoundLabel.textContent = 'Unmute Sound';
      } else {
        if (iconMuted) iconMuted.style.display = 'none';
        if (iconUnmuted) iconUnmuted.style.display = 'inline-block';
        if (vipSoundLabel) vipSoundLabel.textContent = 'Mute Sound';
        // Ensure video is playing when unmuted
        if (vipSpotlightVideo.paused) {
          vipSpotlightVideo.play().catch(() => {});
        }
      }
    });
  }

  if (vipOpenModalBtn) {
    vipOpenModalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openProjectByKey('nkos-vip');
    });
  }

  // Category Filtering Logic
  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetCategory = tab.getAttribute('data-category');

        // Toggle active tab style
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Filter cards smoothly
        allProjectCards.forEach(card => {
          const cardCategory = card.getAttribute('data-category') || '';
          const isMatch = targetCategory === 'all' || cardCategory.split(' ').includes(targetCategory);

          if (isMatch) {
            card.classList.remove('is-hidden');
            // Small RAF tick to trigger CSS transition
            requestAnimationFrame(() => {
              card.classList.remove('is-fade-out');
            });
          } else {
            card.classList.add('is-fade-out');
            setTimeout(() => {
              if (card.classList.contains('is-fade-out')) {
                card.classList.add('is-hidden');
              }
            }, 300);
          }
        });
      });
    });
  }

  // Toolkit Floating 3D Software Logos Interactive Popup & Touch Handling
  const floatLogos = document.querySelectorAll('.toolkit-float-item');
  if (floatLogos.length > 0) {
    floatLogos.forEach(logo => {
      logo.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasActive = logo.classList.contains('is-active');
        floatLogos.forEach(l => l.classList.remove('is-active'));
        if (!wasActive) {
          logo.classList.add('is-active');
        }
      });
    });

    document.addEventListener('click', () => {
      floatLogos.forEach(l => l.classList.remove('is-active'));
    });
  }

  // Close Modal
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (modalDialog) modalDialog.classList.remove('has-multi-video');
    if (modalVideoShell) modalVideoShell.style.display = 'none';
    if (modalVideoNavBar) modalVideoNavBar.style.display = 'none';
    if (modalMultiBadge) modalMultiBadge.style.display = 'none';
    if (modalReelGallery) modalReelGallery.style.display = 'none';
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.removeAttribute('src');
      modalVideo.load();
    }
    // Pause any thumbnail preview videos
    if (reelThumbnailsTrack) {
      reelThumbnailsTrack.querySelectorAll('video').forEach(v => {
        v.pause();
        v.currentTime = 0;
      });
      reelThumbnailsTrack.innerHTML = '';
    }
    activeMultiVideoList = [];
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
    // Keyboard arrow keys navigation when multi-video modal is open
    if (modal.classList.contains('active') && modalDialog && modalDialog.classList.contains('has-multi-video')) {
      if (e.key === 'ArrowRight' && activeMultiVideoList && activeMultiVideoList.length > 0) {
        const nextIndex = (activeMultiVideoIndex + 1) % activeMultiVideoList.length;
        switchActiveMultiVideo(nextIndex, true);
      } else if (e.key === 'ArrowLeft' && activeMultiVideoList && activeMultiVideoList.length > 0) {
        const prevIndex = (activeMultiVideoIndex - 1 + activeMultiVideoList.length) % activeMultiVideoList.length;
        switchActiveMultiVideo(prevIndex, true);
      }
    }
  });

  // ==========================================
  // Interactive Color Grading Comparison Slider
  // ==========================================
  const colorComparison = document.getElementById('colorComparison');
  if (colorComparison) {
    let isDraggingSplit = false;
    let currentSplit = 50;

    function updateSplitPosition(clientX) {
      const rect = colorComparison.getBoundingClientRect();
      if (rect.width === 0) return;
      let percent = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.max(3, Math.min(97, percent));
      currentSplit = percent;
      colorComparison.style.setProperty('--split', `${percent.toFixed(2)}%`);
    }

    colorComparison.addEventListener('pointerdown', (e) => {
      isDraggingSplit = true;
      colorComparison.classList.add('is-scrubbing');
      if (colorComparison.setPointerCapture) {
        try {
          colorComparison.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
      updateSplitPosition(e.clientX);
    });

    colorComparison.addEventListener('pointermove', (e) => {
      if (isDraggingSplit) {
        updateSplitPosition(e.clientX);
      }
    });

    const stopDragging = (e) => {
      if (isDraggingSplit) {
        isDraggingSplit = false;
        colorComparison.classList.remove('is-scrubbing');
        if (e && colorComparison.releasePointerCapture && e.pointerId) {
          try {
            colorComparison.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }
      }
    };

    colorComparison.addEventListener('pointerup', stopDragging);
    colorComparison.addEventListener('pointercancel', stopDragging);

    // Keyboard support (arrow keys when focused)
    colorComparison.setAttribute('tabindex', '0');
    colorComparison.setAttribute('role', 'slider');
    colorComparison.setAttribute('aria-label', 'Color grading comparison slider');
    colorComparison.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        currentSplit = Math.max(3, currentSplit - 4);
        colorComparison.style.setProperty('--split', `${currentSplit.toFixed(2)}%`);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        currentSplit = Math.min(97, currentSplit + 4);
        colorComparison.style.setProperty('--split', `${currentSplit.toFixed(2)}%`);
      }
    });

    // Synchronize both color comparison video streams
    const compareGradedVideo = document.getElementById('compareGradedVideo');
    const compareLogVideo = document.getElementById('compareLogVideo');

    if (compareGradedVideo && compareLogVideo) {
      // Ensure mobile-ready properties
      [compareGradedVideo, compareLogVideo].forEach(v => {
        v.muted = true;
        v.defaultMuted = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
      });

      // Synchronize play/pause and looping without seeking interruptions
      compareGradedVideo.addEventListener('play', () => {
        if (compareLogVideo.paused) compareLogVideo.play().catch(() => {});
      });
      compareGradedVideo.addEventListener('pause', () => {
        if (!compareLogVideo.paused) compareLogVideo.pause();
      });
      compareGradedVideo.addEventListener('seeked', () => {
        compareLogVideo.currentTime = compareGradedVideo.currentTime;
      });

      // Catch end of video loop to keep perfectly aligned
      compareGradedVideo.addEventListener('ended', () => {
        compareGradedVideo.currentTime = 0;
        compareLogVideo.currentTime = 0;
        compareGradedVideo.play().catch(() => {});
        compareLogVideo.play().catch(() => {});
      });

      const playBoth = () => {
        const p1 = compareGradedVideo.play();
        const p2 = compareLogVideo.play();
        if (p1 !== undefined) p1.catch(() => {});
        if (p2 !== undefined) p2.catch(() => {});
      };

      // Autoplay on load
      playBoth();

      // Trigger playback when scrolled into view
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              playBoth();
            } else {
              compareGradedVideo.pause();
              compareLogVideo.pause();
            }
          });
        }, { threshold: 0.2 });
        observer.observe(colorComparison);
      }

      // Resume on any interaction or tap anywhere
      colorComparison.addEventListener('pointerdown', playBoth);
      window.addEventListener('touchstart', playBoth, { once: true, passive: true });
      window.addEventListener('click', playBoth, { once: true, passive: true });
    }
  }

  // Launch Showreel in Cinema Modal
  const launchCinemaBtn = document.getElementById('launchCinemaBtn');
  if (launchCinemaBtn) {
    launchCinemaBtn.addEventListener('click', () => {
      if (modal && modalVideo) {
        modalTitle.textContent = "Color Science & Post-Production";
        modalTag.textContent = "Color Grading Breakdown • 2026";
        modalDesc.textContent = "Full resolution commercial color grade breakdown and cinematic post-production by Shaheedul Muneer.";
        
        if (modalDialog) modalDialog.classList.remove('has-multi-video');
        if (modalMultiBadge) modalMultiBadge.style.display = 'none';
        if (modalReelGallery) modalReelGallery.style.display = 'none';
        if (modalVideoNavBar) modalVideoNavBar.style.display = 'none';

        if (modalImg) modalImg.style.display = 'none';
        if (modalVideoShell) modalVideoShell.style.display = 'block';
        modalVideo.style.display = 'block';
        modalVideo.src = 'color/coloring.mp4';
        modalVideo.load();
        const playPromise = modalVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            modalVideo.muted = true;
            modalVideo.play().catch(() => {});
          });
        }

        if (modalActionRow) {
          modalActionRow.style.display = 'none';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  // ==========================================
  // Contact Modal & Quick Contact Handlers
  // ==========================================
  const contactModal = document.getElementById('contactModal');
  const contactModalCloseBtn = document.getElementById('contactModalCloseBtn');
  const contactModalBackdrop = document.getElementById('contactModalBackdrop');
  const navContactBtn = document.getElementById('nav-contact-btn');
  const behindContactBtn = document.getElementById('behind-contact-btn');
  const copyPhoneBtn = document.getElementById('copyPhoneBtn');
  const copyBtnText = document.getElementById('copyBtnText');

  function openContactModal(e) {
    if (e) e.preventDefault();
    if (contactModal) {
      contactModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeContactModal() {
    if (contactModal) {
      contactModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (navContactBtn) navContactBtn.addEventListener('click', openContactModal);
  if (behindContactBtn) behindContactBtn.addEventListener('click', openContactModal);
  if (vipContactBtn) vipContactBtn.addEventListener('click', openContactModal);
  if (contactModalCloseBtn) contactModalCloseBtn.addEventListener('click', closeContactModal);
  if (contactModalBackdrop) contactModalBackdrop.addEventListener('click', closeContactModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
      closeContactModal();
    }
  });

  // Copy Phone Number with Visual Feedback
  if (copyPhoneBtn) {
    copyPhoneBtn.addEventListener('click', () => {
      const phone = copyPhoneBtn.getAttribute('data-phone') || '+971582453134';
      navigator.clipboard.writeText(phone).then(() => {
        copyPhoneBtn.classList.add('copied');
        if (copyBtnText) copyBtnText.textContent = 'Copied! ✓';
        setTimeout(() => {
          copyPhoneBtn.classList.remove('copied');
          if (copyBtnText) copyBtnText.textContent = 'Copy Phone';
        }, 2200);
      }).catch(() => {
        // Fallback for older browsers
        const temp = document.createElement('textarea');
        temp.value = phone;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        copyPhoneBtn.classList.add('copied');
        if (copyBtnText) copyBtnText.textContent = 'Copied! ✓';
        setTimeout(() => {
          copyPhoneBtn.classList.remove('copied');
          if (copyBtnText) copyBtnText.textContent = 'Copy Phone';
        }, 2200);
      });
    });
  }

  // Smooth Section Navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      // If it's a contact trigger button, modal handler takes precedence
      if (this.id === 'nav-contact-btn' || this.id === 'behind-contact-btn' || this.id === 'vipContactBtn') {
        return;
      }
      if (targetId && targetId !== '#') {
        const targetElem = document.querySelector(targetId);
        if (targetElem) {
          e.preventDefault();
          targetElem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // ==========================================
  // Custom Dual-Circle Interactive Cinema Cursor
  // (One small round dot + One large fluid trailing circle)
  // ==========================================
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.body.classList.add('has-custom-cursor');

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isCursorVisible = false;

    // Direct tracking for the small inner point
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isCursorVisible) {
        isCursorVisible = true;
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
        ringX = mouseX;
        ringY = mouseY;
      }

      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    // Smooth fluid physics tracking for the large trailing circle
    function renderCursor() {
      if (isCursorVisible) {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        cursorRing.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Interactive Hover Expansion on links, buttons, cards, and interactive elements
    const interactiveSelectors = 'a, button, .showcase-card, .service-pill-item, .filter-tab, .toolkit-tab, .toolkit-card, .toolkit-float-item, .brand-item, .reel-thumbnail-item, .contact-method-card, .video-nav-arrow, .reel-track-btn, .about-float-item, input, textarea, [role="button"]';

    document.addEventListener('mouseover', (e) => {
      if (e.target && e.target.closest && e.target.closest(interactiveSelectors)) {
        cursorRing.classList.add('is-hovering');
        cursorDot.classList.add('is-hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target && e.target.closest && e.target.closest(interactiveSelectors)) {
        cursorRing.classList.remove('is-hovering');
        cursorDot.classList.remove('is-hovering');
      }
    });

    // Click feedback
    window.addEventListener('mousedown', () => {
      cursorRing.classList.add('is-clicking');
      cursorDot.classList.add('is-clicking');
    });

    window.addEventListener('mouseup', () => {
      cursorRing.classList.remove('is-clicking');
      cursorDot.classList.remove('is-clicking');
    });

    // Window leave / enter
    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
      isCursorVisible = false;
    });

    document.addEventListener('mouseenter', () => {
      if (isCursorVisible) {
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
      }
    });
  }

  // ==========================================
  // About Me Scroll-Driven Word Highlighting
  // (Progressive color change and bold on scrolling down)
  // ==========================================
  const aboutBioElem = document.getElementById('aboutBioScrollText');
  const aboutSectionElem = document.getElementById('about');

  if (aboutBioElem && aboutSectionElem) {
    // Wrap plain words into individual span elements
    if (!aboutBioElem.querySelector('.scroll-word')) {
      const words = aboutBioElem.innerText.trim().split(/\s+/);
      aboutBioElem.innerHTML = words
        .map(w => `<span class="scroll-word">${w}</span>`)
        .join(' ');
    }

    const scrollWords = aboutBioElem.querySelectorAll('.scroll-word');

    function updateAboutScrollHighlight() {
      const rect = aboutBioElem.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Start highlighting when paragraph top enters the bottom 82% of screen
      // Complete highlighting when it reaches upper 28% of screen
      const revealStart = windowH * 0.82;
      const revealEnd = windowH * 0.28;
      const totalDistance = revealStart - revealEnd;

      const currentProgress = (revealStart - rect.top) / totalDistance;
      const clampedProgress = Math.min(Math.max(currentProgress, 0), 1);

      const totalWords = scrollWords.length;
      const activeCount = Math.round(clampedProgress * totalWords);

      scrollWords.forEach((word, index) => {
        if (index < activeCount) {
          word.classList.add('is-active');
        } else {
          word.classList.remove('is-active');
        }
      });
    }

    window.addEventListener('scroll', updateAboutScrollHighlight, { passive: true });
    window.addEventListener('resize', updateAboutScrollHighlight, { passive: true });
    // Run initially in case page loaded partway down
    updateAboutScrollHighlight();
  }
});
