import { renderHeader } from "../Modules/header.js";
import {
  findById,
  fetchCasts,
  movieImages,
  fetchPictures,
  fetchPicturesLowQuality,
  genreList,
} from "../Modules/api.js";

// Render header (search + genres)
await renderHeader();

// DOM refs
const titleEl = document.querySelector(".hero .title");
const releaseDateEl = document.querySelector(".info-wrapper .release-date");
const ratingEl = document.querySelector(".info-wrapper .rating");
const posterImgEl = document.querySelector(".detail .poster img");
const movieGenresEl = document.querySelector(".movie-genres");
const overviewTextEl = document.querySelector(".overview-text");
const directorNameEl = document.querySelector(".director-name");
const starsInWrap = document.querySelector(".stars .in-wrap");
const picturesEl = document.querySelector(".pictures");
const castWrapper = document.querySelector(".cast-pic-wrapper");

// Create an empty span with .loader class and insert at top of <main>
const mainEl = document.querySelector("main") || document.body;
const loader = document.createElement("span");
loader.className = "loader";
mainEl.insertBefore(loader, mainEl.firstChild);

// Utilities
function sanitizeText(v, fallback = "") {
  return v == null ? fallback : String(v);
}
function shortYear(dateString) {
  if (!dateString) return "—";
  try {
    return String(dateString).slice(0, 4) || "—";
  } catch {
    return "—";
  }
}
function oneDecimal(num) {
  if (typeof num !== "number") return "0.0";
  return (Math.round(num * 10) / 10).toFixed(1);
}
function profileOrFallback(path) {
  return fetchPicturesLowQuality(path) || "../Assets/profile.png";
}
function originalOrFallback(path) {
  return fetchPictures(path) || "../Assets/profile.png";
}

// Read movie id from URL
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");
if (!movieId) {
  loader.style.display = "none";
  document.body.querySelector("main").innerHTML =
    "<p style='padding:1rem;'>No movie ID provided in the URL.</p>";
  throw new Error("No movie id in URL");
}

// Main fetch + render
async function loadAndRender() {
  loader.style.display = "block";

  // Clear existing content placeholders
  titleEl && (titleEl.textContent = "");
  releaseDateEl && (releaseDateEl.textContent = "");
  ratingEl && (ratingEl.textContent = "");
  posterImgEl && (posterImgEl.src = "../Assets/profile.png");
  movieGenresEl && (movieGenresEl.innerHTML = "");
  overviewTextEl && (overviewTextEl.textContent = "");
  directorNameEl && (directorNameEl.textContent = "");
  starsInWrap && (starsInWrap.innerHTML = "");
  picturesEl && (picturesEl.innerHTML = "");
  castWrapper && (castWrapper.innerHTML = "");

  try {
    // Parallel fetches: movie details, casts, images, genre list
    const [movieData, castData, imagesData, genresData] = await Promise.all([
      findById(movieId),
      fetchCasts(movieId),
      movieImages(movieId),
      genreList(),
    ]);

    // Build genre map
    const genreMap = {};
    if (genresData && Array.isArray(genresData.genres)) {
      genresData.genres.forEach((g) => {
        genreMap[g.id] = g.name;
      });
    }

    // Title, release year, rating
    if (titleEl)
      titleEl.textContent = sanitizeText(
        movieData.title || movieData.name || "Untitled"
      );
    if (releaseDateEl)
      releaseDateEl.textContent = shortYear(movieData.release_date);
    if (ratingEl)
      ratingEl.textContent = oneDecimal(Number(movieData.vote_average) || 0);

    // Poster (use poster_path -> low quality URL if available)
    const posterPath = movieData.poster_path || movieData.backdrop_path || null;
    if (posterImgEl) {
      posterImgEl.src =
        fetchPicturesLowQuality(posterPath) || "../Assets/profile.png";
      posterImgEl.alt = sanitizeText(movieData.title || "Poster");
      posterImgEl.onerror = () => {
        posterImgEl.src = "../Assets/profile.png";
      };
    }

    // Genres (create spans)
    if (movieGenresEl) {
      movieGenresEl.innerHTML = "";
      const ids = movieData.genres
        ? movieData.genres.map((g) => (typeof g === "object" ? g.id : g))
        : movieData.genre_ids || [];
      const used = new Set();
      ids.slice(0, 6).forEach((id) => {
        const name = genreMap[id] || (id && String(id));
        if (!name || used.has(name)) return;
        used.add(name);
        const span = document.createElement("span");
        span.textContent = name;
        movieGenresEl.appendChild(span);
      });
    }

    // Overview
    if (overviewTextEl)
      overviewTextEl.textContent = sanitizeText(
        movieData.overview || "No description available."
      );

    // Director (from crew)
    let directorName = "Unknown";
    if (castData && Array.isArray(castData.crew)) {
      const director = castData.crew.find(
        (p) => p.job === "Director" || p.job === "director"
      );
      if (director && director.name) directorName = director.name;
    }
    if (directorNameEl) directorNameEl.textContent = sanitizeText(directorName);

    // Top 5 cast names for the small stars section
    if (starsInWrap) {
      starsInWrap.innerHTML = "";
      const topCast =
        castData && Array.isArray(castData.cast)
          ? castData.cast.slice(0, 5)
          : [];
      topCast.forEach((actor) => {
        const span = document.createElement("span");
        span.textContent = sanitizeText(actor.name);
        starsInWrap.appendChild(span);
      });
    }

    // Pictures: use backdrops or stills; up to 3
    if (picturesEl) {
      picturesEl.innerHTML = "";
      const pics =
        imagesData &&
        Array.isArray(imagesData.backdrops) &&
        imagesData.backdrops.length
          ? imagesData.backdrops
          : imagesData && Array.isArray(imagesData.posters)
          ? imagesData.posters
          : [];
      for (let i = 0; i < Math.min(3, pics.length); i++) {
        const p = pics[i];
        const fig = document.createElement("figure");
        fig.className = "movie-pics";
        const img = document.createElement("img");
        img.src = fetchPictures(p.file_path) || "../Assets/profile.png";
        img.alt = movieData.title + " image";
        img.onerror = () => (img.src = "../Assets/profile.png");
        fig.appendChild(img);
        picturesEl.appendChild(fig);
      }
    }

    // Cast list (max 5) — render cast cards: image + name + character
    if (castWrapper) {
      castWrapper.innerHTML = "";
      const castList =
        castData && Array.isArray(castData.cast)
          ? castData.cast.slice(0, 5)
          : [];
      castList.forEach((actor) => {
        const fig = document.createElement("figure");
        fig.className = "cast-pic";

        const img = document.createElement("img");
        img.src = profileOrFallback(actor.profile_path);
        img.alt = actor.name || "Actor";
        img.onerror = () => (img.src = "../Assets/profile.png");

        const caption = document.createElement("figcaption");
        caption.className = "actor-info";
        const actorNameSpan = document.createElement("span");
        actorNameSpan.className = "actor-name";
        actorNameSpan.textContent = sanitizeText(actor.name);
        const characterSpan = document.createElement("span");
        characterSpan.className = "character-name";
        characterSpan.textContent = sanitizeText(actor.character || "");

        caption.appendChild(actorNameSpan);
        caption.appendChild(characterSpan);

        fig.appendChild(img);
        fig.appendChild(caption);

        castWrapper.appendChild(fig);
      });
    }
  } catch (err) {
    console.error("detail.js error:", err);
    // show friendly message
    const main = document.querySelector("main");
    if (main) {
      main.innerHTML = `<p style="padding:1rem;">Failed to load movie details. Please try again later.</p>`;
    }
  } finally {
    loader.style.display = "none";
  }
}

// Start
loadAndRender();
