// genre.js
import { renderHeader } from "../Modules/header.js";
import {
  fetchGenre,
  fetchCasts,
  fetchPicturesLowQuality,
  genreList,
} from "../Modules/api.js";
import { renderPagination } from "../Modules/pagination.js";

renderHeader();

// DOM elements
const moviesContainer = document.querySelector(".movies-container");
const genreListWrapper = document.querySelector(".genre-list");
const paginationContainer = document.querySelector(".pagination");

// Loader element
const loader = document.createElement("span");
loader.className = "loader";
loader.style.display = "none";
moviesContainer.parentNode.insertBefore(loader, moviesContainer);

// URL params
const urlParams = new URLSearchParams(window.location.search);
const genreId = urlParams.get("id");
const currentPage = parseInt(urlParams.get("page") || "1", 10);

// Build genre list in the aside
async function renderGenreList() {
  try {
    const data = await genreList();
    genreListWrapper.innerHTML = "";
    if (!data.genres) return;

    data.genres.forEach((g) => {
      const link = document.createElement("a");
      link.textContent = g.name;
      link.href = `?id=${g.id}&page=1`;
      if (String(g.id) === genreId) link.classList.add("active");
      genreListWrapper.appendChild(link);
    });
  } catch (err) {
    console.error("renderGenreList error:", err);
  }
}

// Render movie cards
async function renderMovies() {
  if (!genreId) {
    moviesContainer.innerHTML =
      "<p style='padding:1rem;'>No genre selected.</p>";
    return;
  }

  // Show loader
  loader.style.display = "block";
  moviesContainer.innerHTML = "";

  try {
    // Fetch movies for this genre/page
    const data = await fetchGenre(genreId, currentPage);
    const movies = data.results || [];

    // Render each movie card
    for (const movie of movies) {
      const movieCard = await createMovieCard(movie);
      moviesContainer.appendChild(movieCard);
    }

    // Render pagination normally first
    renderPagination(currentPage, ".pagination");

    // Then rewrite URLs to preserve id
    fixPaginationUrls();
  } catch (err) {
    console.error("renderMovies error:", err);
    moviesContainer.innerHTML =
      "<p style='padding:1rem;'>Failed to load movies.</p>";
  } finally {
    loader.style.display = "none";
  }
}

// Create one movie card (with director + cast)
async function createMovieCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";

  // Poster
  const posterFigure = document.createElement("figure");
  posterFigure.className = "poster";
  const posterImg = document.createElement("img");
  posterImg.src =
    fetchPicturesLowQuality(movie.poster_path) || "../Assets/profile.png";
  posterImg.alt = movie.title || "Movie poster";
  posterFigure.appendChild(posterImg);
  card.appendChild(posterFigure);

  // Movie detail container
  const detailDiv = document.createElement("div");
  detailDiv.className = "movie-detail";

  // Title
  const titleSpan = document.createElement("span");
  titleSpan.className = "title";
  titleSpan.textContent = movie.title || "Untitled";
  detailDiv.appendChild(titleSpan);

  // Info wrapper (date + rating)
  const infoWrapper = document.createElement("div");
  infoWrapper.className = "info-wrapper";

  const dateSpan = document.createElement("span");
  dateSpan.className = "date";
  dateSpan.textContent = (movie.release_date || "").slice(0, 4) || "—";
  infoWrapper.appendChild(dateSpan);

  const ratingWrapper = document.createElement("div");
  ratingWrapper.className = "rating-wrapper";
  const starImg = document.createElement("img");
  starImg.src = "../Assets/star-symbol-icon.svg";
  starImg.alt = "star";
  const ratingSpan = document.createElement("span");
  ratingSpan.className = "rating";
  ratingSpan.textContent = movie.vote_average?.toFixed(1) || "0.0";
  ratingWrapper.appendChild(starImg);
  ratingWrapper.appendChild(ratingSpan);

  infoWrapper.appendChild(ratingWrapper);
  detailDiv.appendChild(infoWrapper);

  // Genres
  const genresDiv = document.createElement("div");
  genresDiv.className = "movie-card-genres";
  if (movie.genre_ids?.length) {
    movie.genre_ids.forEach((id) => {
      const genreName = getGenreNameById(id);
      if (genreName) {
        const span = document.createElement("span");
        span.textContent = genreName;
        genresDiv.appendChild(span);
      }
    });
  }
  detailDiv.appendChild(genresDiv);

  // Overview
  const overviewP = document.createElement("p");
  overviewP.className = "overview";
  overviewP.textContent = movie.overview || "No description available.";
  detailDiv.appendChild(overviewP);

  // Fetch director + cast
  try {
    const castData = await fetchCasts(movie.id);
    const director = castData.crew.find((p) => p.job === "Director");
    const topCast = (castData.cast || []).slice(0, 3);

    // Director wrapper
    const directorDiv = document.createElement("div");
    directorDiv.className = "director-wrapper";
    directorDiv.innerHTML = `Director: <span class="director">${
      director?.name || "Unknown"
    }</span>`;
    detailDiv.appendChild(directorDiv);

    // Cast wrapper
    const castDiv = document.createElement("div");
    castDiv.className = "cast-wrapper";
    castDiv.textContent = "Stars: ";
    topCast.forEach((actor) => {
      const span = document.createElement("span");
      span.className = "cast";
      span.textContent = actor.name;
      castDiv.appendChild(span);
    });
    detailDiv.appendChild(castDiv);
  } catch (err) {
    console.warn(`fetchCasts failed for movie ${movie.id}`, err);
  }

  // Votes
  const voteDiv = document.createElement("div");
  voteDiv.className = "vote-wrapper";
  voteDiv.innerHTML = `Votes: <span class="vote">${
    movie.vote_count || "0"
  }</span>`;
  detailDiv.appendChild(voteDiv);

  // More info link
  const moreLink = document.createElement("a");
  moreLink.className = "more-info";
  moreLink.href = `detail.html?id=${movie.id}`;
  moreLink.textContent = "More info";
  detailDiv.appendChild(moreLink);

  card.appendChild(detailDiv);

  return card;
}

// Helper: get genre name by ID (cached from aside list)
let genreMap = {};
function getGenreNameById(id) {
  return genreMap[id] || "";
}

// Rewrite URLs/buttons to preserve ?id=
function fixPaginationUrls() {
  const pageLinks = paginationContainer.querySelectorAll(".page-numbers a");
  pageLinks.forEach((link) => {
    const url = new URL(link.href, window.location.origin);
    const page = url.searchParams.get("page");
    link.href = `?id=${genreId}&page=${page}`;
  });

  // Fix prev/next buttons
  const prevBtn = paginationContainer.querySelector(".prev");
  const nextBtn = paginationContainer.querySelector(".next");

  prevBtn.onclick = () => {
    if (currentPage > 1)
      window.location.href = `?id=${genreId}&page=${currentPage - 1}`;
  };
  nextBtn.onclick = () => {
    window.location.href = `?id=${genreId}&page=${currentPage + 1}`;
  };
}

(async function init() {
  await renderGenreList();
  // build genreMap for quick name lookup
  const allGenres = await genreList();
  genreMap = allGenres.genres.reduce((map, g) => {
    map[g.id] = g.name;
    return map;
  }, {});

  await renderMovies();
})();
