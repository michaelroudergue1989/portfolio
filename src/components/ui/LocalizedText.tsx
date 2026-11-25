import { Trans } from 'react-i18next';

/**
 * Texto traducible que puede contener fragmentos en otro idioma (WCAG 3.1.2, Idioma de las
 * partes). En las cadenas de i18n, los títulos oficiales que no se traducen se marcan con
 * `<es>…</es>` y aquí se convierten en `<span lang="es">…</span>`, de modo que los lectores de
 * pantalla los pronuncien con la voz correcta. Las cadenas sin marcas se muestran sin cambios.
 *
 * Usar solo en contenido de texto: las claves con marcas no deben usarse en atributos
 * (`aria-label`, `title`), donde las etiquetas se verían literalmente.
 */
export function LocalizedText({ i18nKey }: { i18nKey: string }) {
  return <Trans i18nKey={i18nKey} components={{ es: <span lang="es" /> }} />;
}
