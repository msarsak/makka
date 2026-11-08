// Reddit-Suche (öffentliche JSON-Schnittstelle, ohne Login). Websuche macht Claude selbst (Server-Werkzeug).
const UA = 'Hephaestion-Assistant/0.6 (personal assistant)';

export function parseReddit(json, max = 8) {
  const posts = json?.data?.children || [];
  return posts.slice(0, max).map(({ data: d }) => ({
    title: d.title,
    subreddit: 'r/' + d.subreddit,
    score: d.score,
    comments: d.num_comments,
    url: 'https://www.reddit.com' + d.permalink,
    created: new Date(d.created_utc * 1000).toISOString().slice(0, 10),
    text: String(d.selftext || '').replace(/\s+/g, ' ').slice(0, 300),
  }));
}

export async function searchReddit({ query, subreddit, sort = 'relevance', time = 'month' }) {
  const q = encodeURIComponent(String(query || '').slice(0, 200));
  const sorts = ['relevance', 'hot', 'top', 'new', 'comments'];
  const times = ['hour', 'day', 'week', 'month', 'year', 'all'];
  const s = sorts.includes(sort) ? sort : 'relevance';
  const t = times.includes(time) ? time : 'month';
  const sub = subreddit ? String(subreddit).replace(/^\/?r\//i, '').replace(/[^\w]/g, '') : '';
  const url = sub
    ? `https://www.reddit.com/r/${sub}/search.json?q=${q}&restrict_sr=1&sort=${s}&t=${t}&limit=10`
    : `https://www.reddit.com/search.json?q=${q}&sort=${s}&t=${t}&limit=10`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Reddit antwortet mit HTTP ${r.status}`);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error('Reddit hat die Anfrage blockiert');
  return parseReddit(await r.json());
}
