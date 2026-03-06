(() => {
  const contentEl = document.getElementById("content");
  const navLinks = Array.from(document.querySelectorAll(".navlink"));

  const routes = {
    "home": "partials/home.html",
    "o-nas": "partials/o-nas.html",
    "jak-pomagac": "partials/jak-pomagac.html",
    "o-patronie": "partials/o-patronie.html",
    "kontakt": "partials/kontakt.html",
    "wplaty": "partials/wplaty.html",
  };

  function setActive(pageKey) {
    navLinks.forEach(a => {
      a.classList.toggle("active", a.dataset.page === pageKey);
    });
  }

  async function loadPage(pageKey, { pushHash = true } = {}) {
    const path = routes[pageKey] || routes["home"];
    setActive(pageKey);

    // fade-out
    contentEl.classList.add("fade-out");

    // mała zwłoka żeby CSS zdążył zadziałać
    await new Promise(r => setTimeout(r, 120));

    try {
      const res = await fetch("/" + path, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      contentEl.innerHTML = html;

      // fade-in
      contentEl.classList.remove("fade-out");
      contentEl.classList.add("fade-in");
      setTimeout(() => contentEl.classList.remove("fade-in"), 200);

      if (pushHash) {
        const hash = pageKey === "home" ? "home" : pageKey;
        if (location.hash.replace("#", "") !== hash) {
          history.pushState({ pageKey }, "", "#" + hash);
        }
      }
    } catch (e) {
      contentEl.classList.remove("fade-out");
      contentEl.innerHTML = `
        <section class="card">
          <h2>Nie udało się załadować treści</h2>
          <p>Spróbuj odświeżyć stronę. (${String(e.message || e)})</p>
        </section>
      `;
    }
  }

  function pageFromHash() {
    const key = (location.hash || "#home").replace("#", "");
    return routes[key] ? key : "home";
  }

  // klik w menu
  navLinks.forEach(a => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      loadPage(a.dataset.page);
    });
  });

  // obsługa back/forward + ręczna zmiana hash
  window.addEventListener("popstate", () => loadPage(pageFromHash(), { pushHash: false }));
  window.addEventListener("hashchange", () => loadPage(pageFromHash(), { pushHash: false }));

  // rok w stopce
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // start
  loadPage(pageFromHash(), { pushHash: false });
})();
