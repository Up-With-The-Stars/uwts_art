const gallery = document.querySelector("#gallery");
const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const sortSelect = document.querySelector("#sort");
const resultCount = document.querySelector("#result-count");
const empty = document.querySelector("#empty");
const errorBox = document.querySelector("#error");
const dialog = document.querySelector("#preview");

let images = [];
let activeImage = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function getFilteredImages() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const filtered = images.filter(item => {
    const searchable = `${item.name} ${item.stem} ${item.folder} ${item.path}`.toLowerCase();
    return (!query || searchable.includes(query)) &&
      (category === "all" || item.category === category);
  });

  const sort = sortSelect.value;
  filtered.sort((a, b) => {
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "folder") return `${a.category}/${a.folder}/${a.name}`.localeCompare(`${b.category}/${b.folder}/${b.name}`);
    return a.name.localeCompare(b.name);
  });
  return filtered;
}

function render() {
  const filtered = getFilteredImages();
  resultCount.textContent = `${filtered.length.toLocaleString()} of ${images.length.toLocaleString()} graphics`;
  empty.hidden = filtered.length !== 0;
  gallery.hidden = filtered.length === 0;
  gallery.innerHTML = filtered.map((item, index) => `
    <article class="tile" role="button" tabindex="0" data-index="${index}" aria-label="Preview ${escapeHtml(item.name)}">
      <div class="thumb"><img src="${encodeURI(item.path)}" alt="" loading="lazy"></div>
      <div class="tile-meta">
        <span class="tile-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        <span class="tile-sub">${escapeHtml(item.categoryLabel)}${item.folder ? " · " + escapeHtml(item.folder) : ""}</span>
      </div>
    </article>`).join("");

  gallery.querySelectorAll(".tile").forEach(tile => {
    const open = () => showPreview(filtered[Number(tile.dataset.index)]);
    tile.addEventListener("click", open);
    tile.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function showPreview(item) {
  activeImage = item;
  document.querySelector("#preview-category").textContent = item.categoryLabel;
  document.querySelector("#preview-name").textContent = item.name;
  document.querySelector("#preview-folder").textContent = item.path;
  const image = document.querySelector("#preview-image");
  image.src = item.path;
  image.alt = item.name;
  const download = document.querySelector("#download");
  download.href = item.path;
  download.download = item.name;
  document.querySelector("#open-original").href = item.path;
  dialog.showModal();
}

searchInput.addEventListener("input", render);
categorySelect.addEventListener("change", render);
sortSelect.addEventListener("change", render);
document.querySelector("#clear").addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "all";
  sortSelect.value = "name";
  render();
});
document.querySelector("#close-preview").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});
document.querySelector("#copy-path").addEventListener("click", async () => {
  if (!activeImage) return;
  try {
    await navigator.clipboard.writeText(activeImage.path);
    document.querySelector("#copy-path").textContent = "Copied!";
    setTimeout(() => document.querySelector("#copy-path").textContent = "Copy path", 1200);
  } catch {
    document.querySelector("#copy-path").textContent = "Copy unavailable";
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

fetch("./gfx-index.json")
  .then(response => {
    if (!response.ok) throw new Error(`Could not load gfx-index.json (${response.status})`);
    return response.json();
  })
  .then(data => {
    images = data.images || [];
    render();
    if (data.missingSources?.length) {
      console.warn("Some source folders were not found:", data.missingSources);
    }
  })
  .catch(error => {
    resultCount.textContent = "Unable to load graphics";
    errorBox.hidden = false;
    errorBox.textContent = `${error.message}. Check that the GitHub Actions generator ran successfully.`;
  });
