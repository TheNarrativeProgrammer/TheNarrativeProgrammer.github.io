document.addEventListener("DOMContentLoaded", () => {

    /* ---------------------------
       GLOBAL STATE
    --------------------------- */
    let soundEnabled = false; // moved to top so handlers referencing it never see an uninitialized value

    /* ============================================================
       VIDEO AUTOPLAY (upper threshold + lower threshold combined)
    ============================================================ */

    const autoplayVideos = Array.from(document.querySelectorAll(".autoplay-video"));
    const autoplayVideosLower = Array.from(document.querySelectorAll(".autoplay-video-lower-threshhold"));

    function setupVideoDefaults(videos) {
        videos.forEach(video => {
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.preload = "auto";
        });
    }

    setupVideoDefaults(autoplayVideos);
    setupVideoDefaults(autoplayVideosLower);

    function processVideoGroup(videos, threshold = 400) {
        const screenCenter = window.innerHeight / 2;

        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const videoCenter = rect.top + rect.height / 2;
            const isActive = Math.abs(videoCenter - screenCenter) < threshold;

            if (isActive) {
                video.classList.add("active");
                video.play().catch(err => console.log("Autoplay blocked:", err));

                if (soundEnabled && video.classList.contains("autoplay-video")) {
                    video.muted = false;
                    video.volume = 1.0;
                }
            } else {
                video.classList.remove("active");
                video.pause();
                video.muted = true;
            }
        });
    }

    // initial run in case some videos are already in view
    processVideoGroup(autoplayVideos, 400);
    processVideoGroup(autoplayVideosLower, 400);

    window.addEventListener("scroll", () => {
        processVideoGroup(autoplayVideos, 400);
        processVideoGroup(autoplayVideosLower, 400);
    }, { passive: true });

    window.addEventListener("resize", () => {
        // Re-run sizing / active detection on resize
        processVideoGroup(autoplayVideos, 400);
        processVideoGroup(autoplayVideosLower, 400);
    });


    /* ============================================================
       SIDEBAR SCROLL + ACTIVE LINK HIGHLIGHT
    ============================================================ */

    const sections = Array.from(document.querySelectorAll("section"));
    const sidebarLinks = Array.from(document.querySelectorAll(".sidebar a"));

    function updateActiveLink(link) {
        sidebarLinks.forEach(l => l.classList.remove("active"));
        if (link) link.classList.add("active");
    }

    sidebarLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const href = link.getAttribute("href");
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                updateActiveLink(link);
            } else {
                console.warn("Sidebar link target not found:", href);
            }
        });
    });

    window.addEventListener("scroll", () => {
        let currentSection = null;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (pageYOffset >= sectionTop) {
                currentSection = section.getAttribute("id");
            }
        });

        sidebarLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentSection}`) {
                link.classList.add("active");
            }
        });
    }, { passive: true });



    /* ============================================================
       SOUND TOGGLE BUTTON
    ============================================================ */

    const soundBtn = document.getElementById("unmuteBtn");
    if (!soundBtn) {
        console.error("Sound button with id #unmuteBtn not found.");
    } else {
        soundBtn.type = "button";
        soundBtn.textContent = "Enable Sound";

        soundBtn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            soundBtn.textContent = soundEnabled ? "Disable Sound" : "Enable Sound";

            const active = document.querySelector(".autoplay-video.active, .autoplay-video-lower-threshhold.active");

            if (active) {
                active.muted = !soundEnabled;
                if (soundEnabled) {
                    active.volume = 1.0;
                    active.play().catch(() => { });
                }
            } else {
                // No active video — just toggle global state, future active videos will respect it
                console.info("Sound toggled; no active video right now.");
            }
        });
    }



    /* ============================================================
       CAROUSELS (Robust, null-safe)
    ============================================================ */

    const carousels = Array.from(document.querySelectorAll(".image-container"));
    if (carousels.length === 0) {
        console.info("No .image-container carousels found on page.");
    }

    carousels.forEach((container, carouselIndex) => {
        const track = container.querySelector(".carousel-track");
        if (!track) {
            console.warn(`Carousel #${carouselIndex} missing .carousel-track — skipping.`);
            return;
        }

        const slides = Array.from(track.querySelectorAll(".carousel-slide"));
        if (slides.length === 0) {
            console.warn(`Carousel #${carouselIndex} has no .carousel-slide children — skipping.`);
            return;
        }

        const prevBtn = container.querySelector(".prev");
        const nextBtn = container.querySelector(".next");

        if (!prevBtn || !nextBtn) {
            console.warn(`Carousel #${carouselIndex} missing prev or next buttons. prev: ${!!prevBtn}, next: ${!!nextBtn}`);
            // still continue, but skip adding click listeners for missing buttons
        } else {
            prevBtn.type = "button";
            nextBtn.type = "button";
        }

        // Descriptions (null-safe) — search in the nearest .media-container (if any)
        let descriptions = [];
        const mediaContainer = container.closest(".media-container");
        if (mediaContainer) {
            descriptions = Array.from(mediaContainer.querySelectorAll(".codeDescription-container p"));
        }

        let current = 0;
        let slideWidth = 0;

        function sizeSlides(noTransition = true) {
            slideWidth = container.clientWidth || container.getBoundingClientRect().width;
            slides.forEach(s => { s.style.width = slideWidth + "px"; });
            track.style.width = (slideWidth * slides.length) + "px";

            // enforce transform to current slide
            if (noTransition) {
                const old = track.style.transition;
                track.style.transition = "none";
                track.style.transform = `translate3d(-${current * slideWidth}px, 0, 0)`;
                track.getBoundingClientRect(); // force reflow
                track.style.transition = old || "transform 0.5s ease-in-out";
            } else {
                track.style.transform = `translate3d(-${current * slideWidth}px, 0, 0)`;
            }
        }

        function updateDescription() {
            if (!descriptions || descriptions.length === 0) return;
            descriptions.forEach((p, i) => {
                p.classList.toggle("active", i === current);
            });
        }

        function goTo(index) {
            if (slides.length === 0) return;
            // normalize index
            current = (index + slides.length) % slides.length;
            // ensure slideWidth is fresh (in case container width changed)
            if (!slideWidth) sizeSlides(true);
            track.style.transform = `translate3d(-${current * slideWidth}px, 0, 0)`;
            updateDescription();
        }

        // attach handlers only if buttons exist
        if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
        if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));

        // handle keyboard accessibility (optional)
        container.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") { goTo(current - 1); }
            if (e.key === "ArrowRight") { goTo(current + 1); }
        });

        // make sure the carousel reacts when the viewport changes
        window.addEventListener("resize", () => sizeSlides(true), { passive: true });

        // init
        sizeSlides(true);
        updateDescription();
    });

    // end DOMContentLoaded
});
