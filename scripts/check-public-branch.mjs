#!/usr/bin/env node
/**
 * Verifica que una rama destinada a publicarse (p. ej. la futura rama huérfana saneada) NO
 * comparta historial con ninguna otra referencia local (ramas privadas, etiquetas, stash, refs
 * auxiliares de herramientas) y no arrastre commits antiguos. Solo LEE el repositorio: no
 * modifica ramas ni referencias y no hace push.
 *
 * Uso:  node scripts/check-public-branch.mjs <rama> [--max-commits=1]
 * Ver docs/PUBLICACION.md (procedimiento de rama huérfana).
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Evaluación pura.
 * @param {{
 *   branch: string,
 *   branchCommits: string[],
 *   rootCommits: string[],
 *   otherRefs: { name: string, commits: string[] }[],
 *   stashCount?: number,
 *   pushDefault?: string | null,
 *   maxCommits?: number,
 * }} input
 * @returns {{ errors: string[], warnings: string[], safePushCommand: string }}
 */
export function evaluatePublicBranch({
  branch,
  branchCommits,
  rootCommits,
  otherRefs,
  stashCount = 0,
  pushDefault = null,
  maxCommits = 1,
}) {
  const errors = [];
  const warnings = [];

  if (branchCommits.length === 0) errors.push(`La rama "${branch}" no tiene commits o no existe.`);
  if (branchCommits.length > maxCommits) {
    errors.push(
      `La rama "${branch}" tiene ${String(branchCommits.length)} commits (máximo permitido: ${String(maxCommits)}).`,
    );
  }
  if (rootCommits.length !== 1) {
    errors.push(
      `La rama "${branch}" debe tener exactamente una raíz sin padres (tiene ${String(rootCommits.length)}).`,
    );
  }

  const mine = new Set(branchCommits);
  for (const ref of otherRefs) {
    if (ref.name === `refs/heads/${branch}`) continue;
    const shared = ref.commits.filter((hash) => mine.has(hash));
    if (shared.length > 0) {
      errors.push(
        `La rama "${branch}" comparte ${String(shared.length)} commit(s) con ${ref.name}: el historial antiguo es ancestro de la rama pública.`,
      );
    }
  }

  const tags = otherRefs.filter((ref) => ref.name.startsWith('refs/tags/'));
  if (tags.length > 0) {
    warnings.push(
      `Existen ${String(tags.length)} etiqueta(s): no usar --tags ni --mirror; revisarlas antes de publicar.`,
    );
  }
  const auxiliary = otherRefs.filter(
    (ref) =>
      !ref.name.startsWith('refs/heads/') &&
      !ref.name.startsWith('refs/tags/') &&
      ref.name !== 'refs/stash',
  );
  if (auxiliary.length > 0) {
    warnings.push(
      `Hay ${String(auxiliary.length)} referencia(s) auxiliar(es) (${auxiliary.map((r) => r.name.split('/').slice(0, 2).join('/')).join(', ')}): ` +
        'nunca usar --mirror; publicar solo con un refspec explícito.',
    );
  }
  const privateBranches = otherRefs.filter(
    (ref) => ref.name.startsWith('refs/heads/') && ref.name !== `refs/heads/${branch}`,
  );
  if (privateBranches.length > 0) {
    warnings.push(
      `Ramas locales que NO deben publicarse: ${privateBranches.map((r) => r.name.replace('refs/heads/', '')).join(', ')} (nunca usar --all).`,
    );
  }
  if (stashCount > 0)
    warnings.push(
      `Hay ${String(stashCount)} stash(es); no se publican con un refspec explícito, pero revisarlos.`,
    );
  if (pushDefault !== 'nothing') {
    warnings.push(
      'push.default local no es "nothing": un "git push" sin argumentos podría publicar la rama actual.',
    );
  }

  return { errors, warnings, safePushCommand: `git push origin ${branch}:main` };
}

const git = (args, cwd) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);

function tryGit(args, cwd) {
  try {
    return git(args, cwd);
  } catch {
    return [];
  }
}

export function inspectRepository(branch, cwd = process.cwd(), maxCommits = 1) {
  const refs = tryGit(['for-each-ref', '--format=%(refname)'], cwd);
  const otherRefs = refs
    .filter((name) => name !== `refs/heads/${branch}`)
    .map((name) => ({ name, commits: tryGit(['rev-list', name], cwd) }));
  const pushDefault = tryGit(['config', '--local', '--get', 'push.default'], cwd)[0] ?? null;
  return evaluatePublicBranch({
    branch,
    branchCommits: tryGit(['rev-list', `refs/heads/${branch}`], cwd),
    rootCommits: tryGit(['rev-list', '--max-parents=0', `refs/heads/${branch}`], cwd),
    otherRefs,
    stashCount: tryGit(['stash', 'list'], cwd).length,
    pushDefault,
    maxCommits,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const branch = process.argv[2];
  if (!branch || branch.startsWith('--')) {
    console.error(
      'Uso: node scripts/check-public-branch.mjs <rama> [--max-commits=N] [--repo=<ruta>]',
    );
    process.exit(2);
  }
  const max = Number(/--max-commits=(\d+)/.exec(process.argv.join(' '))?.[1] ?? 1);
  // Por defecto, el directorio actual (npm lo fija en la raíz del proyecto); --repo permite
  // verificar otro repositorio, p. ej. el directorio de preparación de la publicación.
  const repo = process.argv.map((a) => /^--repo=(.+)$/.exec(a)?.[1]).find(Boolean);
  const cwd = resolve(repo ?? process.cwd());
  const { errors, warnings, safePushCommand } = inspectRepository(branch, cwd, max);
  for (const warning of warnings) console.warn(`⚠  ${warning}`);
  if (errors.length > 0) {
    console.error('\n✖ La rama NO es segura para publicar:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(`✔ La rama "${branch}" no comparte historial con otras referencias locales.`);
  console.log(`  Único comando de publicación permitido (tras autorización): ${safePushCommand}`);
  console.log('  Prohibido: git push --all | --mirror | --tags | git push sin argumentos.');
}
