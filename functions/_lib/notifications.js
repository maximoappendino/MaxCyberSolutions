import { uuid } from './helpers.js';

export async function createNotification(env, { ownerId, type, title, body = '', link = '' }) {
  try {
    await env.DB.prepare(
      'INSERT INTO notifications (id, owner_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(uuid(), ownerId, type, title, body, link).run();
  } catch (_) { /* non-fatal — notification failure should never break a transaction */ }
}
