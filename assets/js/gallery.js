import justifiedLayout from "./justified-layout.js";
import * as params from "@params";

const initGallery = (gallery) => {
  let containerWidth = 0;
  const items = gallery.querySelectorAll(".gallery-item");

  const aspectRatios = Array.from(items).map((item) => {
    const img = item.querySelector("img");

    if (img) {
      // Fill the layout box and crop overflow (removes YouTube letterboxing, etc.)
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.objectPosition = "center";
      return parseFloat(img.getAttribute("width")) / parseFloat(img.getAttribute("height"));
    } else {
      // For videos or items without img: parse aspect ratio from style attribute
      const aspectRatioStyle = item.style.aspectRatio || item.getAttribute("style")?.match(/aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/);
      if (aspectRatioStyle) {
        if (typeof aspectRatioStyle === "string" && aspectRatioStyle.includes("/")) {
          const [width, height] = aspectRatioStyle.split("/").map(parseFloat);
          return width / height;
        } else if (Array.isArray(aspectRatioStyle)) {
          return parseFloat(aspectRatioStyle[1]) / parseFloat(aspectRatioStyle[2]);
        }
      }
      // Default to 16:9 for videos
      return 16 / 9;
    }
  });

  function updateGallery() {
    if (containerWidth === gallery.getBoundingClientRect().width) return;
    containerWidth = gallery.getBoundingClientRect().width;

    const layout = justifiedLayout(aspectRatios, {
      rowWidth: containerWidth,
      spacing: Number.isInteger(params.boxSpacing) ? params.boxSpacing : 8,
      rowHeight: params.targetRowHeight || 288,
      heightTolerance: Number.isInteger(params.targetRowHeightTolerance) ? params.targetRowHeightTolerance : 0.25,
    });

    items.forEach((item, i) => {
      const { width, height, top, left } = layout.boxes[i];
      item.style.position = "absolute";
      item.style.width = width + "px";
      item.style.height = height + "px";
      item.style.top = top + "px";
      item.style.left = left + "px";
      item.style.overflow = "hidden";
    });

    gallery.style.position = "relative";
    gallery.style.height = layout.containerHeight + "px";
    gallery.classList.remove("gallery-grid--pending");
  }

  window.addEventListener("resize", updateGallery);
  window.addEventListener("orientationchange", updateGallery);

  // Call twice to adjust for scrollbars appearing after first call
  updateGallery();
  updateGallery();
};

document.querySelectorAll(".gallery-grid").forEach(initGallery);
