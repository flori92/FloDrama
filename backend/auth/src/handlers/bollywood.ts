import { queryDB } from '../utils/db';
import { jsonResponse } from '../utils/response';

export async function handleBollywoodRequest(request: Request, url: URL, env: any) {
  if (url.pathname.endsWith('/trending')) {
    const data = await queryDB(env, "SELECT * FROM videos WHERE category_id = ? AND is_trending = 1", ['bollywood']);
    return jsonResponse({ data, error: null });
  }
  const page = parseInt(url.searchParams.get('page') || '1');
  const per_page = parseInt(url.searchParams.get('per_page') || '24');
  const offset = (page - 1) * per_page;
  const data = await queryDB(env, "SELECT * FROM videos WHERE category_id = ? LIMIT ? OFFSET ?", ['bollywood', per_page, offset]);
  const total = await queryDB(env, "SELECT COUNT(*) as count FROM videos WHERE category_id = ?", ['bollywood']);
  return jsonResponse({
    data,
    pagination: { page, per_page, total: total[0]?.count ?? 0 },
    error: null
  });
}
