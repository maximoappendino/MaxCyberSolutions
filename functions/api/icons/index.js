import { json } from '../../_lib/helpers.js';

// Public icon listing — any authenticated dashboard user can fetch the icon list.
export async function onRequestGet({ env }) {
  const listed = await env.ASSETS_BUCKET.list({ prefix: 'icons/' });
  const icons = listed.objects
    .filter(o => o.size > 0)
    .map(o => ({
      key:  o.key,
      name: o.key.replace('icons/', ''),
      url:  `/api/assets/${o.key}`,
    }));
  return json({ icons });
}
