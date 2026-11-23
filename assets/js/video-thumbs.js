const isLetterboxSample = (data) => {
  let dark = 0;
  let max = 0;
  let n = 0;

  for (let i = 0; i < data.length; i += 4) {
    const value = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (value > max) max = value;
    if (value < 16) dark += 1;
    n += 1;
  }

  return n > 0 && max < 40 && dark / n > 0.98;
};

const measureLetterbox = (ctx, width, height) => {
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  while (top < height && isLetterboxSample(ctx.getImageData(0, top, width, 1).data)) {
    top += 1;
  }
  while (bottom > top && isLetterboxSample(ctx.getImageData(0, bottom, width, 1).data)) {
    bottom -= 1;
  }
  while (left < width && isLetterboxSample(ctx.getImageData(left, 0, 1, height).data)) {
    left += 1;
  }
  while (right > left && isLetterboxSample(ctx.getImageData(right, 0, 1, height).data)) {
    right -= 1;
  }

  return { top, bottom, left, right };
};

const cropLetterbox = async (img) => {
  if (img.dataset.letterboxCropped === "1") return;

  const src = img.currentSrc || img.src;
  if (!src || src.startsWith("data:")) return;

  try {
    const response = await fetch(src);
    if (!response.ok) return;

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);

    const { top, bottom, left, right } = measureLetterbox(ctx, bitmap.width, bitmap.height);
    const contentWidth = Math.max(1, right - left + 1);
    const contentHeight = Math.max(1, bottom - top + 1);
    // Slight extra zoom avoids 1px residual bars from subpixel rounding.
    const scale = Math.max(bitmap.width / contentWidth, bitmap.height / contentHeight) * 1.04;

    img.dataset.letterboxCropped = "1";

    if (scale > 1.02) {
      img.style.transform = `scale(${scale.toFixed(3)})`;
    }
  } catch {
    // Ignore CORS / decode errors; object-fit cover remains as fallback.
  }
};

const useFallbackThumb = (img) => {
  const fallback = img.dataset.thumbFallback;
  if (!fallback || img.dataset.thumbFallbackUsed === "1") return false;

  img.dataset.thumbFallbackUsed = "1";
  img.dataset.letterboxCropped = "";
  img.style.transform = "";
  img.setAttribute("data-src", fallback);
  img.setAttribute("src", fallback);
  img.classList.add("lazyload");
  img.addEventListener("load", () => cropLetterbox(img), { once: true });
  return true;
};

const prepareVideoThumb = (img) => {
  const ytId = img.dataset.ytId;
  if (ytId) {
    const maxres = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth >= 1280) {
        img.setAttribute("data-src", maxres);
        if (img.classList.contains("lazyloaded") || img.src) {
          img.src = maxres;
        }
      } else {
        useFallbackThumb(img);
      }
      if (window.lazySizes) {
        window.lazySizes.loader.unveil(img);
      }
    };
    probe.onerror = () => {
      useFallbackThumb(img);
      if (window.lazySizes) {
        window.lazySizes.loader.unveil(img);
      }
    };
    probe.src = maxres;
  }

  img.addEventListener(
    "error",
    () => {
      if (useFallbackThumb(img) && window.lazySizes) {
        window.lazySizes.loader.unveil(img);
      }
    },
    { once: true },
  );

  if (img.complete && img.naturalWidth > 0) {
    cropLetterbox(img);
  } else {
    img.addEventListener("lazyloaded", () => cropLetterbox(img), { once: true });
    img.addEventListener("load", () => cropLetterbox(img), { once: true });
  }
};

document.querySelectorAll(".gallery-item--video img.gallery-item__media").forEach(prepareVideoThumb);

document.addEventListener("lazyloaded", (event) => {
  const img = event.target;
  if (img && img.matches?.(".gallery-item--video img.gallery-item__media")) {
    cropLetterbox(img);
  }
});
