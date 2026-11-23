const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");
const backdrop = document.getElementById("menu-backdrop");

if (toggle && menu) {
  let closeTimer;

  const setOpen = (open) => {
    window.clearTimeout(closeTimer);
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);

    if (!backdrop) return;

    if (open) {
      backdrop.hidden = false;
      requestAnimationFrame(() => {
        backdrop.classList.add("is-open");
      });
    } else {
      backdrop.classList.remove("is-open");
      closeTimer = window.setTimeout(() => {
        backdrop.hidden = true;
      }, 300);
    }
  };

  const close = () => setOpen(false);
  const toggleMenu = () => setOpen(toggle.getAttribute("aria-expanded") !== "true");

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    toggleMenu();
  });

  backdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      close();
    }
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });
}
