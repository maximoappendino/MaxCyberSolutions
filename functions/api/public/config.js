// GET /api/public/config — returns non-secret frontend configuration
import { json } from '../../_lib/helpers.js';

export async function onRequestGet({ env }) {
  return json({
    mp_public_key: env.MP_PUBLIC_KEY || '',
  });
}
