// api.js
const apiKey = "efbb10bb837f1faa8146ccffcf173213";
const baseUrl = "https://api.themoviedb.org/3"; // Base URL for TMDB API
const picturesBaseUrl = "https://image.tmdb.org/t/p"; // Base URL for TMDB images

// Fetch top-rated movies with pagination
export async function fetchMovies(page = 1) {
  try {
    const res = await fetch(
      `${baseUrl}/movie/top_rated?page=${page}&api_key=${apiKey}`
    );
    if (!res.ok) throw new Error(`fetchMovies failed: HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`fetchMovies error (page ${page}):`, error);
    throw error;
  }
}

// Search movies by query with pagination
export async function searchMovies(query, page = 1) {
  try {
    const res = await fetch(
      `${baseUrl}/search/movie?query=${encodeURIComponent(
        query
      )}&include_adult=false&language=en-US&page=${page}&api_key=${apiKey}`
    );
    if (!res.ok) throw new Error(`searchMovies failed: HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`searchMovies error (query: ${query}, page ${page}):`, error);
    throw error;
  }
}

// Fetch movie details by ID
export async function findById(movieId) {
  try {
    const res = await fetch(`${baseUrl}/movie/${movieId}?api_key=${apiKey}`);
    if (!res.ok) throw new Error(`findById failed: HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`findById error (movieId: ${movieId}):`, error);
    throw error;
  }
}

// Fetch movie images by movie ID
export async function movieImages(movieId) {
  try {
    const res = await fetch(
      `${baseUrl}/movie/${movieId}/images?api_key=${apiKey}`
    );
    if (!res.ok) throw new Error(`movieImages failed: HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`movieImages error (movieId: ${movieId}):`, error);
    throw error;
  }
}

// Fetch list of movie genres
export async function genreList() {
  try {
    const res = await fetch(`${baseUrl}/genre/movie/list?api_key=${apiKey}`);
    if (!res.ok) throw new Error(`genreList failed: HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("genreList error:", error);
    throw error;
  }
}

// Fetch cast details for a movie by ID
export async function fetchCasts(movieId) {
  try {
    const res = await fetch(
      `${baseUrl}/movie/${movieId}/credits?api_key=${apiKey}`
    );
    if (!res.ok) throw new Error(`fetchCasts failed: HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`fetchCasts error (movieId: ${movieId}):`, error);
    throw error;
  }
}

// Construct URL for original-size movie images (no fetch needed)
export function fetchPictures(path) {
  if (!path) {
    console.debug("fetchPictures: No path provided, returning null.");
    return null;
  }
  const cleanPath = path.replace(/^\//, "");
  const url = `${picturesBaseUrl}/original/${cleanPath}`;
  console.debug(`fetchPictures: Constructed URL: ${url}`);
  return url;
}

// Construct URL for low-quality (w500) movie images (no fetch needed)
export function fetchPicturesLowQuality(path) {
  if (!path) {
    console.debug("fetchPicturesLowQuality: No path provided, returning null.");
    return null;
  }
  const cleanPath = path.replace(/^\//, "");
  const url = `${picturesBaseUrl}/w500/${cleanPath}`;
  console.debug(`fetchPicturesLowQuality: Constructed URL: ${url}`);
  return url;
}
