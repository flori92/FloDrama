import { handleDramaRequest } from './handlers/drama';
import { handleAnimeRequest } from './handlers/anime';
import { handleFilmRequest } from './handlers/film';
import { handleBollywoodRequest } from './handlers/bollywood';
import { handleGlobalTrendingRequest, handleGlobalRecentRequest } from './handlers/global';
import { handleUserRequest } from './handlers/user';
import { handleAuthRequest } from './handlers/auth';
import { handleListRequest } from './handlers/list';
import { handleHistoryRequest } from './handlers/history';
import { handleCommentsRequest } from './handlers/comments';
import { handleUploadRequest } from './handlers/upload';
import { handleTMDBPopularMovies, handleTMDBTopRatedMovies, handleTMDBTrendingMovies, handleTMDBMovieDetails, handleTMDBSearchMovies, handleTMDBMultiSearch } from './handlers/tmdb';
import { handleGoogleAuth, handleGoogleCallback } from './handlers/auth-google';

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/drama')) {
      return handleDramaRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/anime')) {
      return handleAnimeRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/film')) {
      return handleFilmRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/bollywood')) {
      return handleBollywoodRequest(request, url, env);
    }
    if (url.pathname === '/api/global/trending') {
      return handleGlobalTrendingRequest(request, url, env);
    }
    if (url.pathname === '/api/global/recent') {
      return handleGlobalRecentRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/user')) {
      return handleUserRequest(request, url, env);
    }
    if (url.pathname === '/api/auth/google') {
      return handleGoogleAuth(request, url, env);
    }
    if (url.pathname === '/api/auth/google/callback') {
      return handleGoogleCallback(request, url, env);
    }
    if (url.pathname.startsWith('/api/auth')) {
      return handleAuthRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/list')) {
      return handleListRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/history')) {
      return handleHistoryRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/comments')) {
      return handleCommentsRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/upload')) {
      return handleUploadRequest(request, url, env);
    }
    if (url.pathname.startsWith('/api/tmdb/popular')) {
      return handleTMDBPopularMovies(request, url, env);
    }
    if (url.pathname.startsWith('/api/tmdb/toprated')) {
      return handleTMDBTopRatedMovies(request, url, env);
    }
    if (url.pathname.startsWith('/api/tmdb/trending')) {
      return handleTMDBTrendingMovies(request, url, env);
    }
    if (url.pathname.startsWith('/api/tmdb/details')) {
      return handleTMDBMovieDetails(request, url, env);
    }
    if (url.pathname.startsWith('/api/tmdb/search')) {
      return handleTMDBSearchMovies(request, url, env);
    }
    if (url.pathname.startsWith('/api/tmdb/multi')) {
      return handleTMDBMultiSearch(request, url, env);
    }
    return new Response('Not found', { status: 404 });
  }
}
