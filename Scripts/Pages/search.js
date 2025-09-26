// search.js

import { renderHeader } from "../Modules/header.js";
import {
  searchMovies,
  fetchPicturesLowQuality,
  genreList,
} from "../Modules/api.js";
import { renderPagination } from "../Modules/pagination.js";

// DOM Elements
const moviesSection = document.querySelector(".movies");
const loader = document.querySelector(".loader");
const paginationSection = document.querySelector(".pagination");
const searchTitle = document.querySelector(".search-title");

// State
let currentQuery = "";
let currentPage = 1;
let genreMap = {};

// Utility: sanitize text
function sanitizeText(text) {
  return text == null ? "" : String(text);
}

// Get poster URL
function getPoster(posterPath) {
  const url = fetchPicturesLowQuality(posterPath);
  if (url && typeof url === "string") {
    return url;
  }
  console.debug(`No valid poster URL for path: ${posterPath}, using default.`);
  return "../../Assets/profile.png";
}

// Convert genre IDs → names array
function getGenres(genreIds = []) {
  if (!Array.isArray(genreIds)) return ["Unknown genre"];
  const names = genreIds
    .map((id) => genreMap[id])
    .filter(Boolean)
    .slice(0, 4);
  return names.length > 0 ? names : ["Unknown genre"];
}

// Build a single movie card
function createMovieCard(movie) {
  const wrapper = document.createElement("div");
  wrapper.className = "movie-wrapper";

  const posterPath = movie.poster_path || movie.backdrop_path || null;
  const genreNames = getGenres(movie.genre_ids);
  const genreSpans = genreNames
    .map((genre) => `<span class="genre">${sanitizeText(genre)}</span>`)
    .join("");
  const posterUrl = getPoster(posterPath);

  wrapper.innerHTML = `
    <figure>
      <img src="${posterUrl}" alt="${sanitizeText(movie.title)}">
    </figure>
    <div class="title">${sanitizeText(movie.title)}</div>
    <div class="genres">${genreSpans}</div>
    <div class="info-wrapper">
      <div class="rating">
        <img src="../../Assets/star-symbol-icon.svg" alt="rating">
        <span>${(Math.round(movie.vote_average * 10) / 10).toFixed(1)}</span>
      </div>
      <a href="../../Pages/detail.html?id=${movie.id}">More Info</a>
    </div>
  `;

  // Fallback image
  const imgEl = wrapper.querySelector("figure img");
  imgEl.onerror = () => {
    console.debug(`Failed to load image for ${movie.title}, using default.`);
    imgEl.src = "../../Assets/profile.png";
  };

  return wrapper;
}

// Render movie grid & pagination
async function renderMoviesData(data) {
  moviesSection.innerHTML = "";
  if (!data || !Array.isArray(data.results)) {
    moviesSection.textContent = "No movies found for this search.";
    paginationSection.innerHTML = "";
    console.warn("Invalid search results:", data);
    return;
  }

  data.results.forEach((movie) => {
    const card = createMovieCard(movie);
    moviesSection.appendChild(card);
  });

  renderPagination(currentPage);

  // Adjust pagination links to preserve query
  const paginationContainer = document.querySelector(".pagination");
  if (paginationContainer) {
    // page numbers
    paginationContainer.querySelectorAll(".page-btn").forEach((link) => {
      const url = new URL(window.location.href);
      const page = link.textContent.trim();
      url.searchParams.set("query", currentQuery);
      url.searchParams.set("page", page);
      link.href = url.toString();
    });

    // prev/next
    const prevBtn = paginationContainer.querySelector(".prev");
    const nextBtn = paginationContainer.querySelector(".next");
    if (prevBtn) {
      prevBtn.onclick = () => {
        const url = new URL(window.location.href);
        url.searchParams.set("query", currentQuery);
        url.searchParams.set("page", Math.max(1, currentPage - 1));
        window.location.href = url.toString();
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const url = new URL(window.location.href);
        url.searchParams.set("query", currentQuery);
        url.searchParams.set("page", currentPage + 1);
        window.location.href = url.toString();
      };
    }
  }
}

// Load genres
async function loadGenres() {
  try {
    const genres = await genreList();
    if (genres && Array.isArray(genres.genres)) {
      genreMap = genres.genres.reduce((map, genre) => {
        map[genre.id] = genre.name;
        return map;
      }, {});
    } else {
      console.warn("Invalid genre data:", genres);
    }
  } catch (error) {
    console.warn("Failed to load genres:", error);
  }
}

// Init page
async function init() {
  // Render header
  try {
    await renderHeader();
  } catch (error) {
    console.warn("Failed to render header:", error);
  }

  // Load genres
  await loadGenres();

  // Parse URL
  const urlParams = new URLSearchParams(window.location.search);
  currentQuery = urlParams.get("query") || "";
  const pageParam = parseInt(urlParams.get("page"), 10) || 1;
  currentPage = pageParam < 1 ? 1 : pageParam;

  // Show query
  if (searchTitle) {
    searchTitle.textContent = currentQuery
      ? `${sanitizeText(currentQuery)}`
      : "No search query provided.";
  } else {
    console.warn("Search title element (.search-title) not found.");
  }

  // No query
  if (!currentQuery) {
    moviesSection.innerHTML = "<div>Please enter a search query.</div>";
    paginationSection.innerHTML = "";
    console.debug("No search query provided in URL.");
    return;
  }

  // Loader
  if (loader) loader.style.display = "block";
  let apiData;
  try {
    apiData = await searchMovies(currentQuery, currentPage);
    if (!apiData) throw new Error("searchMovies returned no data");
  } catch (error) {
    console.warn(
      `Failed to fetch search results for query "${currentQuery}":`,
      error
    );
    apiData = null;
  } finally {
    if (loader) loader.style.display = "none";
  }

  // Handle error
  if (!apiData || !Array.isArray(apiData.results)) {
    moviesSection.innerHTML = "<div>No movies found for this search.</div>";
    paginationSection.innerHTML = "";
    console.warn("Search fetch failed, showing error message.");
    if (searchTitle)
      searchTitle.textContent = `No results for: ${sanitizeText(currentQuery)}`;
    return;
  }

  currentPage = Number.isFinite(apiData.page) ? apiData.page : currentPage;

  // Render movies & pagination
  await renderMoviesData(apiData);

  // Scroll to grid
  setTimeout(() => {
    moviesSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

// Start app
init();
