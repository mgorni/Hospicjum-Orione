

  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpj_CYtCwZIaXHYU-WwHK0TM40gMnBXwrmr5PTK0mj9SQ4Edwa-oB_eS48BwxN4sRGf4FurP0dIrJI/pub?gid=0&single=true&output=csv";
 
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function textToParagraphs(text) {
    return escapeHtml(text)
      .split(/\n\s*\n/)
      .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function parseCsv(csvText) {
    const rows = [];
    let row = [];
    let value = "";
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(value);
        value = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        row.push(value);
        rows.push(row);
        row = [];
        value = "";
      } else {
        value += char;
      }
    }

    if (value.length > 0 || row.length > 0) {
      row.push(value);
      rows.push(row);
    }

    return rows;
  }

  function rowsToObjects(rows) {
    if (!rows.length) return [];

    const headers = rows[0].map(h => h.trim().toLowerCase());

    return rows.slice(1)
      .filter(r => r.some(cell => String(cell).trim() !== ""))
      .map(r => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = (r[index] ?? "").trim();
        });
        return obj;
      });
  }

  function parseDate(dateStr) {
    if (!dateStr) return new Date(0);

    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
    }

    const plMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (plMatch) {
      const day = plMatch[1].padStart(2, "0");
      const month = plMatch[2].padStart(2, "0");
      const year = plMatch[3];
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }

    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }

  function formatDate(dateStr) {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime()) || d.getTime() === 0) {
      return escapeHtml(dateStr || "");
    }
    return d.toLocaleDateString("pl-PL");
  }

  function isPublished(value) {
    const v = String(value ?? "").trim().toLowerCase();
    return ["tak", "true", "yes", "1"].includes(v);
  }

  function renderNews(items) {
    const container = document.getElementById("news-list");

    if (!items.length) {
      container.innerHTML = "<p>Brak aktualności.</p>";
      return;
    }

    container.innerHTML = items.map(item => {
      const title = item["tytuł"] || "Bez tytułu";
      const date = item["data"] || "";
      const content = item["treść"] || "";
      const image = item["zdjęcie"] || "";

      return `
        <article class="news-item">
          <h2 class="news-title">${escapeHtml(title)}</h2>
          ${date ? `<p class="news-date">${formatDate(date)}</p>` : ""}
          <div class="news-content">
            ${textToParagraphs(content)}
          </div>
          ${image ? `
            <div class="news-image-wrap">
              <img
                class="news-image"
                src="${escapeHtml(image)}"
                alt="${escapeHtml(title)}"
                loading="lazy"
              >
            </div>
          ` : ""}
        </article>
      `;
    }).join("");
  }

  async function loadNews() {
    const container = document.getElementById("news-list");
    if (!container) return;
    
    try {
      const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let csvText = await response.text();

      // Usunięcie BOM, jeśli kiedyś się pojawi
      csvText = csvText.replace(/^\uFEFF/, "");

      const rows = parseCsv(csvText);
      const items = rowsToObjects(rows)
        .filter(item => isPublished(item["publikacja?"]))
        .sort((a, b) => parseDate(b["data"]) - parseDate(a["data"]));

      renderNews(items);
    } catch (error) {
      console.error("Błąd ładowania aktualności:", error);
      container.innerHTML = "<p>Nie udało się załadować aktualności.</p>";
    }
  }

  document.addEventListener("DOMContentLoaded", loadNews);
