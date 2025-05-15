export async function queryDB(env: any, sql: string, params: any[] = []) {
  const stmt = env.DB.prepare(sql);
  params.forEach((p, i) => stmt.bind(i + 1, p));
  return await stmt.all();
}
