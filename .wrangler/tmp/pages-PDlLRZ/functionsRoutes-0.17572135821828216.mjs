import { onRequestPost as __api_auth_login_js_onRequestPost } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/auth/login.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/auth/logout.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/auth/register.js"
import { onRequestDelete as __api_products__id__js_onRequestDelete } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/products/[id].js"
import { onRequestGet as __api_products__id__js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/products/[id].js"
import { onRequestPut as __api_products__id__js_onRequestPut } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/products/[id].js"
import { onRequestDelete as __api_stores__id__js_onRequestDelete } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/stores/[id].js"
import { onRequestGet as __api_stores__id__js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/stores/[id].js"
import { onRequestPut as __api_stores__id__js_onRequestPut } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/stores/[id].js"
import { onRequestGet as __api_me_js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/me.js"
import { onRequestGet as __api_products_index_js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/products/index.js"
import { onRequestPost as __api_products_index_js_onRequestPost } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/products/index.js"
import { onRequestGet as __api_stores_index_js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/stores/index.js"
import { onRequestPost as __api_stores_index_js_onRequestPost } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/stores/index.js"
import { onRequestGet as __store__slug__js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/store/[slug].js"
import { onRequestGet as __dashboard___path___js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/dashboard/[[path]].js"
import { onRequestGet as __dashboard_js_onRequestGet } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/dashboard.js"
import { onRequest as __api__middleware_js_onRequest } from "/home/maximo/GitHub/maximoappendino/maxcybersolutions/functions/api/_middleware.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestPost],
    },
  {
      routePath: "/api/products/:id",
      mountPath: "/api/products",
      method: "DELETE",
      middlewares: [],
      modules: [__api_products__id__js_onRequestDelete],
    },
  {
      routePath: "/api/products/:id",
      mountPath: "/api/products",
      method: "GET",
      middlewares: [],
      modules: [__api_products__id__js_onRequestGet],
    },
  {
      routePath: "/api/products/:id",
      mountPath: "/api/products",
      method: "PUT",
      middlewares: [],
      modules: [__api_products__id__js_onRequestPut],
    },
  {
      routePath: "/api/stores/:id",
      mountPath: "/api/stores",
      method: "DELETE",
      middlewares: [],
      modules: [__api_stores__id__js_onRequestDelete],
    },
  {
      routePath: "/api/stores/:id",
      mountPath: "/api/stores",
      method: "GET",
      middlewares: [],
      modules: [__api_stores__id__js_onRequestGet],
    },
  {
      routePath: "/api/stores/:id",
      mountPath: "/api/stores",
      method: "PUT",
      middlewares: [],
      modules: [__api_stores__id__js_onRequestPut],
    },
  {
      routePath: "/api/me",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_me_js_onRequestGet],
    },
  {
      routePath: "/api/products",
      mountPath: "/api/products",
      method: "GET",
      middlewares: [],
      modules: [__api_products_index_js_onRequestGet],
    },
  {
      routePath: "/api/products",
      mountPath: "/api/products",
      method: "POST",
      middlewares: [],
      modules: [__api_products_index_js_onRequestPost],
    },
  {
      routePath: "/api/stores",
      mountPath: "/api/stores",
      method: "GET",
      middlewares: [],
      modules: [__api_stores_index_js_onRequestGet],
    },
  {
      routePath: "/api/stores",
      mountPath: "/api/stores",
      method: "POST",
      middlewares: [],
      modules: [__api_stores_index_js_onRequestPost],
    },
  {
      routePath: "/store/:slug",
      mountPath: "/store",
      method: "GET",
      middlewares: [],
      modules: [__store__slug__js_onRequestGet],
    },
  {
      routePath: "/dashboard/:path*",
      mountPath: "/dashboard",
      method: "GET",
      middlewares: [],
      modules: [__dashboard___path___js_onRequestGet],
    },
  {
      routePath: "/dashboard",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__dashboard_js_onRequestGet],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_js_onRequest],
      modules: [],
    },
  ]