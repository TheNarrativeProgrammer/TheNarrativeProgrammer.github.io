document.addEventListener("DOMContentLoaded", function () {
    const videos = document.querySelectorAll(".autoplay-video");

    videos.forEach(video => {
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
    });

    window.addEventListener("scroll", function () {
        const screenCenter = window.innerHeight / 2;

        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const videoCenter = rect.top + rect.height / 2;

            if (Math.abs(videoCenter - screenCenter) < 400) {
                video.classList.add("active");
                video.play().catch(err => console.log("Autoplay blocked:", err));

                // NEW: sound for active video
                if (soundEnabled) {
                    video.muted = false;
                    video.volume = 1.0;
                }
            } else {
                video.classList.remove("active");
                video.pause();

                // NEW: always mute inactive videos
                video.muted = true;
            }
        }); 
    }); 
}); 

document.addEventListener("DOMContentLoaded", function () {
    const videos = document.querySelectorAll(".autoplay-video-lower-threshhold");

    videos.forEach(video => {
        video.loop = true; // ensure looping
        video.muted = true; // ensure muted for autoplay
        video.playsInline = true; // for mobile
        video.preload = "auto"; // preload for smooth start
    });

    window.addEventListener("scroll", function () {
        const screenCenter = window.innerHeight / 2;

        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const videoCenter = rect.top + rect.height / 2;

            if (Math.abs(videoCenter - screenCenter) < 400) {
                video.classList.add("active");
                video.play().catch(err => console.log("Autoplay blocked:", err));
            } else {
                video.classList.remove("active");
                video.pause();
            }
        });
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("section");
    const sidebarLinks = document.querySelectorAll(".sidebar a");

    // Smooth scroll behavior on click
    sidebarLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute("href"));
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            updateActiveLink(link);
        });
    });

    // Update active link on scroll
    window.addEventListener("scroll", () => {
        let currentSection = null;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100; // offset for navbar
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
    });

    function updateActiveLink(activeLink) {
        sidebarLinks.forEach(link => link.classList.remove("active"));
        activeLink.classList.add("active");
    }
});

let soundEnabled = false;

const soundBtn = document.getElementById("unmuteBtn");
soundBtn.textContent = "Enable Sound";

soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    // Update button label
    soundBtn.textContent = soundEnabled ? "Disable Sound" : "Enable Sound";

    // Apply sound state to currently active video
    const active = document.querySelector(".autoplay-video.active, .autoplay-video-lower-threshhold.active");

    if (active) {
        active.muted = !soundEnabled;
        if (soundEnabled) {
            active.volume = 1.0;
            active.play();
        }
    }
});



document.addEventListener("DOMContentLoaded", () => {
    // Loop over all carousels
    document.querySelectorAll(".image-container").forEach((container, carouselIndex) => {

        const track = container.querySelector(".carousel-track");
        const slides = Array.from(track.querySelectorAll(".carousel-slide"));
        const prevBtn = container.querySelector(".prev");
        const nextBtn = container.querySelector(".next");

        // Only grab descriptions inside the SAME carousel
        const descriptions = Array.from(
            container.closest(".media-container").querySelectorAll(".codeDescription-container p")
        );

        let current = 0;
        let slideWidth = 0;

        function sizeSlides(noTransition = true) {
            slideWidth = container.clientWidth;
            slides.forEach(s => { s.style.width = slideWidth + "px"; });
            track.style.width = (slideWidth * slides.length) + "px";

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
            descriptions.forEach((p, i) => {
                p.classList.toggle("active", i === current);
            });
        }

        function goTo(index) {
            current = (index + slides.length) % slides.length;
            track.style.transform = `translate3d(-${current * slideWidth}px, 0, 0)`;
            updateDescription();
        }

        prevBtn.addEventListener("click", () => goTo(current - 1));
        nextBtn.addEventListener("click", () => goTo(current + 1));

        window.addEventListener("resize", () => sizeSlides(true));

        sizeSlides(true);
        updateDescription();
    });
});