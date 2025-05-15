import { fetchTMDB } from '../utils/tmdb';
import { jsonResponse } from '../utils/response';

export async function handleTMDBPopularMovies(request: Request, url: URL, env: any) {
  const page = url.searchParams.get('page') || '1';
  const { error, data } = await fetchTMDB(`/movie/popular?language=en-US&page=${page}&region=US`, env);
  return jsonResponse({ data, error });
}

export async function handleTMDBTopRatedMovies(request: Request, url: URL, env: any) {
  const page = url.searchParams.get('page') || '1';
  const { error, data } = await fetchTMDB(`/movie/top_rated?language=en-US&page=${page}&region=US`, env);
  return jsonResponse({ data, error });
}

export async function handleTMDBTrendingMovies(request: Request, url: URL, env: any) {
  const page = url.searchParams.get('page') || '1';
  const { error, data } = await fetchTMDB(`/trending/movie/week?language=en-US&page=${page}`, env);
  return jsonResponse({ data, error });
}

export async function handleTMDBMovieDetails(request: Request, url: URL, env: any) {
  const movieId = url.searchParams.get('id');
  if (!movieId) return jsonResponse({ data: null, error: 'id requis' }, 400);
  const { error, data } = await fetchTMDB(`/movie/${movieId}?language=en-US`, env);
  return jsonResponse({ data, error });
}

export async function handleTMDBSearchMovies(request: Request, url: URL, env: any) {
  const query = url.searchParams.get('query');
  const page = url.searchParams.get('page') || '1';
  if (!query) return jsonResponse({ data: null, error: 'query requis' }, 400);
  const { error, data } = await fetchTMDB(`/search/movie?language=en-US&query=${encodeURIComponent(query)}&page=${page}`, env);
  return jsonResponse({ data, error });
}

export async function handleTMDBMultiSearch(request: Request, url: URL, env: any) {
  const query = url.searchParams.get('query');
  const page = url.searchParams.get('page') || '1';
  if (!query) return jsonResponse({ data: null, error: 'query requis' }, 400);
  const { error, data } = await fetchTMDB(`/search/multi?language=en-US&query=${encodeURIComponent(query)}&page=${page}`, env);
  return jsonResponse({ data, error });
}
