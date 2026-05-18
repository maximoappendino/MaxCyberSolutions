local test:
python -m http.server 8000


Tell the user to press x in the dev terminal to stop it, then:

  ! npm run dev

  Once it's back up, run the seed in a second terminal:

  ! node scripts/seed-local.js

  The seed will register the admin account, create the e-commerce store, and insert all 10
  products. Then visit:

  - http://localhost:8788/store/e-commerce — the storefront
  - http://localhost:8788/dashboard/ — the admin panel (login: admin@maxcybersolutions.com /
  demo1234)
