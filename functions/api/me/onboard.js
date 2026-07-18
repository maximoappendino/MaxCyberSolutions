// POST /api/me/onboard — mark the authenticated owner as onboarding-complete
import { json } from '../../_lib/helpers.js';

export async function onRequestPost({ data, env }) {
  await env.DB.prepare(
    "UPDATE owners SET onboarded = 1, pending_setup_token = '' WHERE id = ?"
  ).bind(data.owner_id).run();
  return json({ ok: true });
}
