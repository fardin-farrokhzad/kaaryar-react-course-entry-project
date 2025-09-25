// main.js
// Homepage script for movie browsing app using TMDB API

import { renderHeader } from "../Modules/header.js";
import {
  fetchMovies,
  fetchPicturesLowQuality,
  fetchPictures,
  genreList,
} from "../Modules/api.js";
import { renderPagination } from "../Modules/pagination.js";

// DOM elements
const heroSection = document.querySelector(".hero");
const sliderWrapper = document.querySelector(".slider-wrapper");
const sliderDots = document.querySelector(".slider-dots");
const moviesSection = document.querySelector(".movies");
const loader = document.querySelector(".loader");

// State and cache
let currentPage = 1;
let currentSlide = 0;
let autoSlideIntervalId = null;
let genreMap = {};
const imageCache = new Map();

// Utilities
function sanitizeText(text) {
  return text == null ? "" : String(text);
}

function getGenres(genreIds = []) {
  if (!Array.isArray(genreIds)) return ["Unknown genre"];
  const names = genreIds
    .map((id) => genreMap[id])
    .filter(Boolean)
    .slice(0, 4);
  return names.length > 0 ? names : ["Unknown genre"];
}

function cacheKey(type, path) {
  return `${type}:${path.replace(/^\//, "")}`;
}

function resolveImage(path, type = "low") {
  if (!path) {
    console.debug("No image path provided, using default.");
    return "../../Assets/profile.png";
  }
  const cleanPath = path.replace(/^\//, "");
  const key = cacheKey(type, cleanPath);
  if (imageCache.has(key)) return imageCache.get(key);
  const size = type === "original" ? "original" : "w500";
  const url = `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
  imageCache.set(key, url);
  console.debug(`Resolved image URL: ${url}`);
  return url;
}

// Slider
function updateSlider() {
  sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
  sliderDots.querySelectorAll("button").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlide);
  });
}

function startAutoSlide() {
  stopAutoSlide();
  const dots = sliderDots.querySelectorAll("button");
  if (!dots.length) return;
  autoSlideIntervalId = setInterval(() => {
    currentSlide = (currentSlide + 1) % dots.length;
    updateSlider();
  }, 5000);
}

function stopAutoSlide() {
  if (autoSlideIntervalId) {
    clearInterval(autoSlideIntervalId);
    autoSlideIntervalId = null;
  }
}

async function renderSliderFromMovies(movies = []) {
  if (!Array.isArray(movies) || !movies.length) {
    sliderWrapper.innerHTML = "";
    sliderDots.innerHTML = "";
    console.debug("No movies provided for slider.");
    return;
  }
  sliderWrapper.innerHTML = "";
  sliderDots.innerHTML = "";
  currentSlide = 0;
  stopAutoSlide();
  await Promise.all(
    movies.slice(0, 5).map(async (movie, index) => {
      const backdropPath = movie.backdrop_path || movie.poster_path || null;
      const backdropUrl = resolveImage(backdropPath, "original");
      const genreNames = getGenres(movie.genre_ids);
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.style.backgroundImage = `url(${backdropUrl})`;
      const genreSpans = genreNames
        .map((genre) => `<span class="genre">${sanitizeText(genre)}</span>`)
        .join("");
      slide.innerHTML = `
        <div class="slide-content">
          <h1>${sanitizeText(movie.title)}</h1>
          <div class="hero-genres">${genreSpans}</div>
          <p>${sanitizeText(movie.overview || "No description available.")}</p>
          <p><strong>Rating:</strong> ⭐ ${(
            Math.round(movie.vote_average * 10) / 10
          ).toFixed(1)}</p>
        </div>
      `;
      slide.addEventListener("click", () => {
        window.location.href = `../../Pages/detail.html?id=${movie.id}`;
      });
      sliderWrapper.appendChild(slide);
      const dot = document.createElement("button");
      dot.classList.toggle("active", index === 0);
      dot.addEventListener("click", () => {
        currentSlide = index;
        updateSlider();
      });
      sliderDots.appendChild(dot);
    })
  );
  updateSlider();
  startAutoSlide();
}

// Movie grid
function createMovieCard(movie) {
  const wrapper = document.createElement("div");
  wrapper.className = "movie-wrapper";
  const posterPath = movie.poster_path || movie.backdrop_path || null;
  const genreText = getGenres(movie.genre_ids).join(", ");
  const posterUrl = resolveImage(posterPath, "low");
  wrapper.innerHTML = `
    <figure>
      <img src="${posterUrl}" alt="${sanitizeText(movie.title)}">
    </figure>
    <div class="title">${sanitizeText(movie.title)}</div>
    <span class="genre">${sanitizeText(genreText)}</span>
    <div class="info-wrapper">
      <div class="rating">
        <img src="../../Assets/star-symbol-icon.svg" alt="rating">
        <span>${(Math.round(movie.vote_average * 10) / 10).toFixed(1)}</span>
      </div>
      <a href="../../Pages/detail.html?id=${movie.id}">More Info</a>
    </div>
  `;
  const imgEl = wrapper.querySelector("figure img");
  imgEl.onerror = () => {
    console.debug(`Failed to load image for ${movie.title}, using default.`);
    imgEl.src = "../../Assets/profile.png";
  };
  return wrapper;
}

async function renderMoviesData(data) {
  moviesSection.innerHTML = "";
  if (!data || !Array.isArray(data.results)) {
    moviesSection.textContent = "Could not load movies.";
    console.warn("Invalid movie data:", data);
    return;
  }
  data.results.forEach((movie) => {
    const card = createMovieCard(movie);
    moviesSection.appendChild(card);
  });
  renderPagination(currentPage);
}

// Initialization
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

async function init() {
  try {
    await renderHeader();
  } catch (error) {
    console.warn("Failed to render header:", error);
  }
  await loadGenres();
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = parseInt(urlParams.get("page"), 10) || 1;
  currentPage = pageParam < 1 ? 1 : pageParam;
  if (loader) loader.style.display = "block";
  let apiData;
  try {
    apiData = await fetchMovies(currentPage);
    if (!apiData) throw new Error("fetchMovies returned false");
  } catch (error) {
    console.warn("Failed to fetch movies:", error);
    apiData = null;
  } finally {
    if (loader) loader.style.display = "none";
  }
  if (!apiData || !Array.isArray(apiData.results)) {
    moviesSection.innerHTML =
      "<div>Could not load movies. Please try again later.</div>";
    heroSection.classList.remove("show");
    console.warn("Movie fetch failed, showing error message.");
    return;
  }
  currentPage = Number.isFinite(apiData.page) ? apiData.page : currentPage;
  if (currentPage === 1) {
    heroSection.classList.add("show");
    await renderSliderFromMovies(apiData.results);
  } else {
    heroSection.classList.remove("show");
    sliderWrapper.innerHTML = "";
    sliderDots.innerHTML = "";
    stopAutoSlide();
  }
  await renderMoviesData(apiData);
  if (currentPage > 1) {
    setTimeout(() => {
      moviesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }
}

// Start
init();
