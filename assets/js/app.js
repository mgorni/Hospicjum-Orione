// ======================
// Routing / SPA loader
// ======================

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");

  const routes = {
    home: "/partials/home.html",
    "o-nas": "/partials/o-nas.html",
    aktualnosci: "/partials/aktualnosci.html",
    "jak-pomagac": "/partials/jak-pomagac.html",
    "o-patronie": "/partials/o-patronie.html",
    kontakt: "/partials/kontakt.html",
    wplaty: "/partials/wplaty.html",
  };

  async function loadPage(page) {
    const url = routes[page] || routes.home;

    try {
      content.innerHTML = '<div class="loading">Ładowanie…</div>';

      const response = await fetch(url);
      const html = await response.text();

      content.innerHTML = html;

      window.location.hash = page;
      updateActiveLinks(page);
    } catch (e) {
      content.innerHTML = "<p>Błąd ładowania strony.</p>";
      console.error(e);
    }
  }

  function updateActiveLinks(activePage) {
    document.querySelectorAll(".navlink").forEach((link) => {
      link.classList.toggle(
        "active",
        link.dataset.page === activePage
      );
    });
  }

  // obsługa kliknięć w linki (1 i 2 poziom)
  document.querySelectorAll(".navlink").forEach((a) => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const page = a.dataset.page;
      loadPage(page);

      // zamykanie dropdownów
      document.querySelectorAll(".topnav-item-has-submenu").forEach((item) => {
        item.classList.remove("is-open");
        const btn = item.querySelector(".navbutton");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    });
  });

  // start
  const initialPage = window.location.hash.replace("#", "") || "home";
  loadPage(initialPage);
});


// ======================
// Dropdown (mobile + accessibility)
// ======================

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".topnav-item-has-submenu");

  menuItems.forEach((item) => {
    const button = item.querySelector(".navbutton");

    if (!button) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();

      const isOpen = item.classList.contains("is-open");

      // zamknij wszystkie
      menuItems.forEach((otherItem) => {
        otherItem.classList.remove("is-open");
        const otherBtn = otherItem.querySelector(".navbutton");
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
      });

      // otwórz kliknięty
      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  // klik poza menu zamyka
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".topnav-item-has-submenu")) {
      menuItems.forEach((item) => {
        item.classList.remove("is-open");
        const btn = item.querySelector(".navbutton");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }
  });

  // ESC zamyka
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menuItems.forEach((item) => {
        item.classList.remove("is-open");
        const btn = item.querySelector(".navbutton");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }
  });
});
