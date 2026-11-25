import { resume } from '@/data/resume';
import { enabledResume as enable } from '@/test/resumeHelpers';
import { isDownloadable, RESUME_PATH_PATTERN, resumeFileName } from './resume';

describe('resume', () => {
  it('existe un único currículum público con la ruta acordada', () => {
    expect(resume.path).toBe('/cv/michael-roudergue-cv.pdf');
    expect(resume.path).toMatch(RESUME_PATH_PATTERN);
  });

  it('declara los metadatos verificados del documento', () => {
    expect(resume.language).toBe('es');
    expect(resume.pages).toBe(2);
    expect(resume.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('el manifiesto real está disponible y es descargable', () => {
    expect(resume.available).toBe(true);
    expect(isDownloadable(resume)).toBe(true);
  });

  it('es descargable solo con disponibilidad, ruta válida y metadatos coherentes', () => {
    expect(isDownloadable(enable())).toBe(true);
    expect(isDownloadable(enable({ available: false }))).toBe(false);
    expect(isDownloadable(enable({ path: '/cv/../x.pdf' }))).toBe(false);
    expect(isDownloadable(enable({ path: '/cv/archivo.docx' }))).toBe(false);
    expect(isDownloadable(enable({ path: 'https://example.com/cv.pdf' }))).toBe(false);
    expect(isDownloadable(enable({ updatedAt: '2026-11' }))).toBe(false);
    expect(isDownloadable(enable({ pages: 0 }))).toBe(false);
    expect(isDownloadable(enable({ pages: 1.5 }))).toBe(false);
  });

  it('obtiene el nombre de archivo de la ruta', () => {
    expect(resumeFileName(resume)).toBe('michael-roudergue-cv.pdf');
  });
});
