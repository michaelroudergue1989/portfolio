/**
 * Entorno contra el que corren las E2E.
 * - Sin E2E_BASE_URL: `vite preview` local (devuelve index.html en rutas desconocidas).
 * - Con E2E_BASE_URL remota: despliegue real en Vercel (devuelve 404 en rutas inexistentes) y, salvo que
 *   se indique otra SITE_URL, se espera que sus metadatos apunten a ese mismo origen.
 * - SITE_URL (local o remota) indica el origen con el que se compiló: canonical, og:url y sitemap.
 *   Para probar localmente con SITE_URL, definirla al compilar y al ejecutar las pruebas.
 */
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

const requested = process.env.E2E_BASE_URL?.trim();
export const BASE_URL = requested ? new URL(requested).origin : 'http://localhost:4173';
export const BASE_HOSTNAME = new URL(BASE_URL).hostname;
export const IS_REMOTE = !LOCAL_HOSTNAMES.includes(BASE_HOSTNAME);
export const PREVIEW_PORT = new URL(BASE_URL).port || '4173';

const configuredSite = process.env.SITE_URL?.trim() ?? '';
const fallbackSite = IS_REMOTE ? BASE_URL : null;
const site = configuredSite === '' ? fallbackSite : configuredSite;
export const SITE_ORIGIN = site === null ? null : new URL(site).origin;

/** Únicos hosts a los que las pruebas admiten peticiones: el local y el de la URL base autorizada. */
export const OWN_HOSTS = new Set([...LOCAL_HOSTNAMES, BASE_HOSTNAME]);
