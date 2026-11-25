import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Monogram } from '@/components/ui/Monogram';
import { profile } from '@/data/profile';
import type { ProfilePhoto } from '@/types/portfolio';

/**
 * Composición del Hero: marco con trama de puntos y tres arcos, uno por área profesional
 * (azul, verde azulado, violeta). Muestra la fotografía profesional si existe (`photo` o
 * `profile.photo`); de lo contrario, el monograma. Nunca se genera una imagen ficticia.
 * La foto lleva texto alternativo traducido, dimensiones explícitas (sin saltos de layout)
 * y decodificación asíncrona. Ver docs/PUBLICACION.md para incorporar una foto real.
 */
export function HeroVisual({ photo = profile.photo }: { photo?: ProfilePhoto | undefined }) {
  const { t } = useTranslation();
  const patternId = useId();

  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-sm items-center justify-center lg:flex">
      <svg
        viewBox="0 0 360 360"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full"
      >
        <defs>
          <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="currentColor" />
          </pattern>
        </defs>
        <rect
          x="30"
          y="30"
          width="300"
          height="300"
          rx="36"
          fill={`url(#${patternId})`}
          className="text-border-strong opacity-40"
        />
        <circle
          cx="180"
          cy="180"
          r="112"
          stroke="currentColor"
          strokeWidth="1.5"
          pathLength="100"
          strokeDasharray="0.5 3.5"
          className="text-border-strong"
        />
        {[
          { cls: 'text-area-software', rotate: -105 },
          { cls: 'text-area-leadership', rotate: 15 },
          { cls: 'text-area-security', rotate: 135 },
        ].map(({ cls, rotate }) => (
          <circle
            key={cls}
            cx="180"
            cy="180"
            r="146"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="26 74"
            transform={`rotate(${String(rotate)} 180 180)`}
            className={cls}
          />
        ))}
      </svg>

      {photo ? (
        <img
          src={photo.src}
          alt={t(photo.altKey)}
          width={photo.width}
          height={photo.height}
          decoding="async"
          className="relative size-52 rounded-3xl border border-border-strong object-cover shadow-raised"
        />
      ) : (
        <div role="img" aria-label={t('hero.visualLabel')} className="relative">
          <Monogram size="lg" className="shadow-raised" />
        </div>
      )}
    </div>
  );
}
