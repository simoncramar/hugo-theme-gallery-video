import GLightbox from "./glightbox/glightbox.min.js";

const galleries = document.querySelectorAll(".gallery-grid");

if (galleries.length) {
  const lightbox = GLightbox({
    selector: ".gallery-item",
    touchNavigation: true,
    loop: true,
    autoplayVideos: true,
    closeButton: true,
    closeOnOutsideClick: true,
    videosWidth: "960px",
    iframeAttributes: {
      allow: "autoplay; encrypted-media; picture-in-picture; web-share; fullscreen",
      allowFullscreen: true,
    },
  });

  const allItems = document.querySelectorAll("a.gallery-item");

  // Handle URL hash for direct image links
  if (window.location.hash.substring(1).length > 1) {
    const target = window.location.hash.substring(1);
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].dataset["target"] === target) {
        lightbox.openAt(i);
        break;
      }
    }
  }

  // Update URL hash when navigating and stop inline iframes on slide change
  lightbox.on("slide_changed", ({ prev, current }) => {
    if (prev.slideNode) {
      const iframe = prev.slideNode.querySelector(".gslide-inline iframe");
      if (iframe) {
        iframe.src = "";
      }
    }
    const element = allItems[current.index];
    if (element && element.dataset["target"]) {
      history.replaceState("", document.title, "#" + element.dataset["target"]);
    }
  });

  // Clear hash on close
  lightbox.on("close", () => {
    history.replaceState("", document.title, window.location.pathname);
  });
}
