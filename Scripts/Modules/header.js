// header.js
// Header logic: search autocomplete, genre dropdown, user interactions

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

  // Check elements
  if (
    !searchBar ||
    !searchButton ||
    !suggestionsContainer ||
    !dropdownButton ||
    !dropdownMenu
  ) {
    console.warn("Header elements missing:", {
      searchBar: !!searchBar,
      searchButton: !!searchButton,
      suggestionsContainer: !!suggestionsContainer,
      dropdownButton: !!dropdownButton,
      dropdownMenu: !!dropdownMenu,
    });
    return;
  }

  // Config
  const MIN_CHARS = 2;
  const DEBOUNCE_MS = 250;
  const MAX_RESULTS = 8;
  const DEFAULT_IMG = "../../Assets/profile.png";
  let debounceTimer = null;
  let genreMap = {};

  // Load genres
  async function loadGenres() {
    try {
      const genreData = await genreList();
      if (genreData && Array.isArray(genreData.genres)) {
        genreMap = genreData.genres.reduce((map, genre) => {
          map[genre.id] = genre.name;
          return map;
        }, {});
      } else {
        console.warn("Invalid genre data:", genreData);
      }
    } catch (error) {
      console.warn("Failed to fetch genres:", error);
    }
  }

  // Debounce utility
  function debounce(fn, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
  }

  // Get poster URL
  function getPoster(posterPath) {
    const url = fetchPicturesLowQuality(posterPath);
    if (url && typeof url === "string") {
      return url;
    }
    console.debug(
      `No valid poster URL for path: ${posterPath}, using default.`
    );
    return DEFAULT_IMG;
  }

  // Genre IDs to names
  function getGenres(genreIds = []) {
    if (!Array.isArray(genreIds)) return "Unknown genre";
    const names = genreIds
      .map((id) => genreMap[id])
      .filter(Boolean)
      .join(", ");
    return names || "Unknown genre";
  }

  // Render autocomplete suggestions
  async function renderSuggestions(results) {
    suggestionsContainer.innerHTML = "";
    if (!results || !Array.isArray(results) || results.length === 0) {
      suggestionsContainer.style.display = "none";
      console.debug("No search results to render.");
      return;
    }

    console.debug(
      "Search results:",
      results.map((m) => ({ title: m.title, poster_path: m.poster_path }))
    );
    suggestionsContainer.style.display = "block";
    const movies = results.slice(0, MAX_RESULTS);

    movies.forEach((movie) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";

      const imgDiv = document.createElement("div");
      imgDiv.className = "img";
      const img = document.createElement("img");
      img.src = getPoster(movie.poster_path);
      img.alt = movie.title || "Movie poster";
      img.onerror = () => {
        console.debug(
          `Image failed to load for ${movie.title}, using default.`
        );
        img.src = DEFAULT_IMG;
      };
      imgDiv.appendChild(img);

      const txtDiv = document.createElement("div");
      txtDiv.className = "txt";
      const h3 = document.createElement("h3");
      h3.textContent = movie.title || "Untitled";
      const span = document.createElement("span");
      span.textContent = getGenres(movie.genre_ids);
      txtDiv.appendChild(h3);
      txtDiv.appendChild(span);

      item.appendChild(imgDiv);
      item.appendChild(txtDiv);

      item.addEventListener("click", () => {
        window.location.href = `../../Pages/detail.html?id=${movie.id}`;
      });

      suggestionsContainer.appendChild(item);
    });
  }

  await loadGenres();

  // Handle search submit
  function handleSearchSubmit() {
    const query = searchBar.value.trim();
    if (query) {
      suggestionsContainer.style.display = "none";
      window.location.href = `../../Pages/search.html?query=${encodeURIComponent(
        query
      )}`;
    }
  }

  // Autocomplete input
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.trim();
    if (query.length < MIN_CHARS) {
      suggestionsContainer.style.display = "none";
      return;
    }

    debounce(async () => {
      try {
        const data = await searchMovies(query);
        await renderSuggestions(data?.results || []);
      } catch (error) {
        console.warn("Search failed:", error);
        suggestionsContainer.style.display = "none";
      }
    }, DEBOUNCE_MS);
  });

  // Search button
  searchButton.addEventListener("click", handleSearchSubmit);

  // Enter key
  searchBar.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit();
    }
  });

  // Hide suggestions click outside
  document.addEventListener("click", (event) => {
    if (
      !searchBar.contains(event.target) &&
      !suggestionsContainer.contains(event.target) &&
      !searchButton.contains(event.target)
    ) {
      suggestionsContainer.style.display = "none";
    }
  });

  // Populate genre dropdown
  dropdownButton.addEventListener("click", () => {
    dropdownMenu.innerHTML = "";
    Object.entries(genreMap).forEach(([id, name]) => {
      const link = document.createElement("a");
      link.href = `../../Pages/genre.html?id=${id}`;
      link.textContent = name;
      dropdownMenu.appendChild(link);
    });
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Hide dropdown outside click
  document.addEventListener("click", (event) => {
    if (
      !dropdownButton.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.style.display = "none";
    }
  });
}
