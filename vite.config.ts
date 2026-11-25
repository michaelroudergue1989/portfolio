import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

interface VercelHeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

/** Cabeceras globales de vercel.json (fuente única): el servidor de preview/E2E las replica. */
function readGlobalHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
    headers?: VercelHeaderRule[];
  };
  const rule = config.headers?.find((item) => item.source === '/(.*)');
  return Object.fromEntries((rule?.headers ?? []).map(({ key, value }) => [key, value]));
}

/** Origen https del sitio a partir de SITE_URL (no se inventa dominio: sin variable, sin canonical). */
function readSiteOrigin(): string | null {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error(`SITE_URL debe ser un origen https sin ruta (recibido: ${raw})`);
  }
  return url.origin;
}

/** Genera robots.txt siempre y, solo con SITE_URL, canonical, og:url y sitemap.xml. */
function siteMetadata(): Plugin {
  const origin = readSiteOrigin();
  return {
    name: 'site-metadata',
    transformIndexHtml() {
      if (!origin) return [];
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${origin}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:url', content: `${origin}/` }, injectTo: 'head' },
      ];
    },
    generateBundle() {
      const robots = [
        'User-agent: *',
        'Allow: /',
        ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : []),
      ];
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });
      if (origin) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source:
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            `  <url><loc>${origin}/</loc></url>\n` +
            '</urlset>\n',
        });
      }
    },
  };
}

/**
 * Precarga las dos fuentes autoalojadas (mismo origen) para que estén disponibles antes del primer
 * renderizado y se evite el cambio de métricas (swap) que reajusta el diseño y desplaza anclas/foco.
 */
function fontPreload(): Plugin {
  return {
    name: 'font-preload',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const files = Object.keys(context.bundle ?? {}).filter((file) =>
          /^assets\/(?:inter|jetbrains-mono)-latin-wght-normal-.+\.woff2$/.test(file),
        );
        return files.map((file) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            href: `/${file}`,
            crossorigin: '',
          },
          injectTo: 'head' as const,
        }));
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteMetadata(), fontPreload()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    sourcemap: false,
    // Sin data: URIs: la CSP solo permite recursos del propio origen.
    assetsInlineLimit: 0,
  },
  preview: { headers: readGlobalHeaders() },
});
