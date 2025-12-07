document.addEventListener("DOMContentLoaded", () => {

    /* ----------------------------
       GLOBAL STATE
    ---------------------------- */
    let soundEnabled = false;

    /* ============================================================
       VIDEO AUTOPLAY
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

    // Initial check
    processVideoGroup(autoplayVideos, 400);
    processVideoGroup(autoplayVideosLower, 400);

    window.addEventListener("scroll", () => {
        processVideoGroup(autoplayVideos, 400);
        processVideoGroup(autoplayVideosLower, 400);
    }, { passive: true });

    window.addEventListener("resize", () => {
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
    if (soundBtn) {
        soundBtn.type = "button";
        soundBtn.textContent = "Enable Sound";

        soundBtn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            soundBtn.textContent = soundEnabled ? "Disable Sound" : "Enable Sound";

            const activeVideo = document.querySelector(".autoplay-video.active, .autoplay-video-lower-threshhold.active");
            if (activeVideo) {
                activeVideo.muted = !soundEnabled;
                if (soundEnabled) activeVideo.volume = 1.0;
            }
        });
    }

    /* ============================================================
       CAROUSELS
    ============================================================ */
    const carousels = Array.from(document.querySelectorAll(".image-container"));

    carousels.forEach(container => {
        const track = container.querySelector(".carousel-track");
        if (!track) return;

        const slides = Array.from(track.querySelectorAll(".carousel-slide"));
        if (slides.length === 0) return;

        const prevBtn = container.querySelector(".prev");
        const nextBtn = container.querySelector(".next");

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

            if (noTransition) {
                const old = track.style.transition;
                track.style.transition = "none";
                track.style.transform = `translate3d(-${current * slideWidth}px, 0, 0)`;
                track.getBoundingClientRect();
                track.style.transition = old || "transform 0.5s ease-in-out";
            } else {
                track.style.transform = `translate3d(-${current * slideWidth}px, 0, 0)`;
            }
        }

        function updateDescription() {
            descriptions.forEach((p, i) => p.classList.toggle("active", i === current));
        }

        function goTo(index) {
            current = (index + slides.length) % slides.length;
            if (!slideWidth) sizeSlides(true);
            track.style.transform = `translate3d(-${current * slideWidth}px, 0, 0)`;
            updateDescription();
        }

        if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
        if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));
        container.addEventListener("keydown", e => {
            if (e.key === "ArrowLeft") goTo(current - 1);
            if (e.key === "ArrowRight") goTo(current + 1);
        });

        window.addEventListener("resize", () => sizeSlides(true), { passive: true });
        sizeSlides(true);
        updateDescription();
    });

    /* ============================================================
       ITCH.IO IFRAME PLAY & RESTART
    ============================================================ */
    const playBtn = document.getElementById("playBtn");
    const iframeCover = document.getElementById("iframeCover");
    const restartBtn = document.getElementById('restartBtn');
    const iframeContainer = document.getElementById('iframeContainer');

    if (playBtn && iframeCover) {
        playBtn.addEventListener("click", () => {
            iframeCover.style.display = "none";
        });
    }

    if (restartBtn && iframeContainer) {
        restartBtn.addEventListener("click", () => {
            const oldIframe = document.getElementById('gameIframe');
            if (oldIframe) oldIframe.remove();

            const newIframe = document.createElement('iframe');
            newIframe.id = 'gameIframe';
            newIframe.src = "https://itch.io/embed-upload/10516719?color=000000";
            newIframe.width = "100%";
            newIframe.height = "600px";
            newIframe.frameBorder = "0";
            newIframe.allowFullscreen = true;

            iframeContainer.appendChild(newIframe);

            if (iframeCover) iframeCover.style.display = 'flex';
        });
    }

});
