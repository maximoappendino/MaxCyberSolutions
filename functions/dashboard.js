// Redirect /dashboard → /dashboard/ so the catch-all function picks it up
export async function onRequestGet() {
  return Response.redirect('/dashboard/', 301);
}
