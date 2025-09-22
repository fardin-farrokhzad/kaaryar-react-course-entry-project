import { searchMovies, fetchPicturesLowQuality, genreList } from "./api.js";

export async function renderHeader() {
  // DOM elements
  const searchBar = document.querySelector(".search-bar");
  const searchButton = document.querySelector(".search-button");
  const suggestionsContainer = document.querySelector(
    ".autocomplete-suggestions"
  );
  const dropdownButton = document.querySelector(".dropdown-button");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (
    !searchBar ||
    !searchButton ||
    !suggestionsContainer ||
    !dropdownButton ||
    !dropdownMenu
  ) {
    console.warn("Header elements not found.");
    return;
  }

  // Config
  const MIN_CHARS = 2;
  const DEBOUNCE_MS = 250;
  const MAX_RESULTS = 8;
  const DEFAULT_IMG = "../../Assets/profile.png";
  let debounceTimer;
  let genreMap = {};

  // Fetch genres once
  try {
    const gData = await genreList();
    if (gData && Array.isArray(gData.genres)) {
      gData.genres.forEach((g) => (genreMap[g.id] = g.name));
    }
  } catch {
    console.warn("Could not fetch genres");
  }

  // Simple debounce helper
  function debounce(fn, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
  }

  // Get poster using API module
  async function getPoster(posterPath) {
    if (!posterPath) return DEFAULT_IMG;
    const cleanPath = posterPath.replace(/^\//, "");
    try {
      const url = await fetchPicturesLowQuality(cleanPath);
      return url || DEFAULT_IMG;
    } catch {
      return DEFAULT_IMG;
    }
  }

  // Convert genre IDs to names
  function getGenres(genre_ids = []) {
    if (!Array.isArray(genre_ids)) return "";
    const names = genre_ids.map((id) => genreMap[id]).filter(Boolean);
    return names.join(", ");
  }

  // Render autocomplete suggestions
  async function renderSuggestions(results) {
    suggestionsContainer.innerHTML = "";
    if (!results || results.length === 0) {
      suggestionsContainer.style.display = "none";
      return;
    }

    suggestionsContainer.style.display = "block";
    const slice = results.slice(0, MAX_RESULTS);

    slice.forEach(async (movie) => {
      const item = document.createElement("div");

      // Image container
      const imgDiv = document.createElement("div");
      imgDiv.className = "img";
      const img = document.createElement("img");
      img.src = DEFAULT_IMG; // default
      img.alt = movie.title;

      getPoster(movie.poster_path).then((url) => {
        img.src = url; // replace with actual poster
      });

      img.onerror = () => {
        img.src = DEFAULT_IMG; // fallback
      };
      imgDiv.appendChild(img);

      // Text container
      const txtDiv = document.createElement("div");
      txtDiv.className = "txt";
      const h3 = document.createElement("h3");
      h3.textContent = movie.title;
      const span = document.createElement("span");
      span.textContent = getGenres(movie.genre_ids) || "Unknown genre";
      txtDiv.appendChild(h3);
      txtDiv.appendChild(span);

      item.appendChild(imgDiv);
      item.appendChild(txtDiv);

      // Click → go to detail page
      item.addEventListener("click", () => {
        window.location.href = `detail.html?id=${movie.id}`;
      });

      suggestionsContainer.appendChild(item);
    });
  }

  // Search input listener
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim();
    if (q.length < MIN_CHARS) {
      suggestionsContainer.style.display = "none";
      return;
    }

    debounce(async () => {
      const data = await searchMovies(q);
      if (data && Array.isArray(data.results)) {
        await renderSuggestions(data.results);
      } else {
        suggestionsContainer.style.display = "none";
      }
    }, DEBOUNCE_MS);
  });

  // Search button
  searchButton.addEventListener("click", () => {
    if (searchBar.value) {
      alert("Searching for: " + searchBar.value);
      suggestionsContainer.style.display = "none";
    }
  });

  // Hide suggestions if clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchBar.contains(e.target) &&
      !suggestionsContainer.contains(e.target) &&
      !searchButton.contains(e.target)
    ) {
      suggestionsContainer.style.display = "none";
    }
  });

  // Dropdown for genres
  dropdownButton.addEventListener("click", () => {
    dropdownMenu.innerHTML = "";
    Object.entries(genreMap).forEach(([id, name]) => {
      const a = document.createElement("a");
      a.href = `genre.html?id=${id}`;
      a.textContent = name;
      dropdownMenu.appendChild(a);
    });
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Hide dropdown if clicking outside
  document.addEventListener("click", (e) => {
    if (
      !dropdownButton.contains(e.target) &&
      !dropdownMenu.contains(e.target)
    ) {
      dropdownMenu.style.display = "none";
    }
  });
}
renderHeader();
