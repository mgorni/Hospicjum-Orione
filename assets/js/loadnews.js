<script>
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpj_CYtCwZIaXHYU-WwHK0TM40gMnBXwrmr5PTK0mj9SQ4Edwa-oB_eS48BwxN4sRGf4FurP0dIrJI/pub?gid=0&single=true&output=csv";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function nl2br(text) {
    return escapeHtml(text).replace(/\n/g, "<br>");
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

    // Obsługa YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
    }

    // Awaryjnie standardowy parser
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }

  function formatDate(dateStr) {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime()) || d.getTime() === 0) return escapeHtml(dateStr || "");
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
      const title = item.title || item.tytuł || "Bez tytułu";
      const date = item.date || item.data || "";
      const summary = item.summary || item.zajawka || "";
      const content = item.content || item.treść || "";
      const link = item.link || item.url || "";

      return `
        <article class="news-item">
          <h2>${escapeHtml(title)}</h2>
          ${date ? `<p class="news-date">${formatDate(date)}</p>` : ""}
          ${summary ? `<p class="news-summary">${escapeHtml(summary)}</p>` : ""}
          ${content ? `<div class="news-content">${nl2br(content)}</div>` : ""}
          ${link ? `<p><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Czytaj więcej</a></p>` : ""}
        </article>
      `;
    }).join("");
  }

  async function loadNews() {
    const container = document.getElementById("news-list");

    try {
      const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const csvText = await response.text();
      const rows = parseCsv(csvText);
      const items = rowsToObjects(rows)
        .filter(item => isPublished(item.published || item.opublikowany))
        .sort((a, b) => parseDate(b.date || b.data) - parseDate(a.date || a.data));

      renderNews(items);
    } catch (error) {
      console.error("Błąd ładowania aktualności:", error);
      container.innerHTML = "<p>Nie udało się załadować aktualności.</p>";
    }
  }

  loadNews();
</script>
