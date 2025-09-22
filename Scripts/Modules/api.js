const apiKey = "efbb10bb837f1faa8146ccffcf173213";
const baseUrl = "https://api.themoviedb.org/3";
const picturesBaseUrl = "https://image.tmdb.org/t/p";
export async function fetchMovies(page = 1) {
  try {
    const res = await fetch(
      `${baseUrl}/movie/top_rated?page=${page}&api_key=${apiKey}`
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
export async function searchMovies(query, page = 1) {
  try {
    const res = await fetch(
      `${baseUrl}/search/movie?query=${encodeURIComponent(
        query
      )}&include_adult=false&language=en-US&${page}&api_key=${apiKey}`
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
export async function findById(query) {
  try {
    const res = await fetch(`${baseUrl}/movie/${query}?api_key=${apiKey}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
export async function movieImages(query) {
  try {
    const res = await fetch(
      `${baseUrl}/movie/images${query}?api_key=${apiKey}`
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
export async function genreList() {
  try {
    const res = await fetch(`${baseUrl}/genre/movie/list?api_key=${apiKey}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
export async function fetchCasts(query) {
  try {
    const res = await fetch(
      `${baseUrl}/movie/${query}/credits?api_key=${apiKey}`
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
export async function fetchPictures(query) {
  try {
    const res = await fetch(`${picturesBaseUrl}/original/${query}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
export async function fetchPicturesLowQuality(query) {
  try {
    const res = await fetch(`${picturesBaseUrl}/w500/${query}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data;
  } catch (err) {
    return false;
  }
}
