import {
  evaluatePublicBranch,
  type PublicBranchInput,
} from '../../scripts/check-public-branch.mjs';

const base = (overrides: Partial<PublicBranchInput> = {}): PublicBranchInput => ({
  branch: 'publica',
  branchCommits: ['n1'],
  rootCommits: ['n1'],
  otherRefs: [{ name: 'refs/heads/main', commits: ['a1', 'a2', 'a3'] }],
  stashCount: 0,
  pushDefault: 'nothing',
  ...overrides,
});

describe('verificador de rama pública', () => {
  it('acepta una rama huérfana de un commit sin ancestros compartidos', () => {
    const result = evaluatePublicBranch(base());
    expect(result.errors).toEqual([]);
    expect(result.safePushCommand).toBe('git push origin publica:main');
  });

  it('rechaza una rama cuyo historial incluye commits de otra referencia', () => {
    const result = evaluatePublicBranch(
      base({ branchCommits: ['n1', 'a2'], rootCommits: ['a1'], maxCommits: 5 }),
    );
    expect(result.errors.join('\n')).toMatch(/comparte 1 commit\(s\) con refs\/heads\/main/);
  });

  it('rechaza una rama con más commits de los permitidos o sin raíz única', () => {
    expect(evaluatePublicBranch(base({ branchCommits: ['n1', 'n2'] })).errors.join('\n')).toMatch(
      /máximo permitido: 1/,
    );
    expect(evaluatePublicBranch(base({ rootCommits: ['n1', 'n0'] })).errors.join('\n')).toMatch(
      /exactamente una raíz/,
    );
    expect(
      evaluatePublicBranch(base({ branchCommits: [], rootCommits: [] })).errors.join('\n'),
    ).toMatch(/no tiene commits o no existe/);
  });

  it('avisa de etiquetas, ramas privadas, referencias auxiliares, stash y push.default', () => {
    const result = evaluatePublicBranch(
      base({
        otherRefs: [
          { name: 'refs/heads/main', commits: ['a1'] },
          { name: 'refs/heads/trabajo', commits: ['b1'] },
          { name: 'refs/tags/v1', commits: ['a1'] },
          { name: 'refs/herramienta/checkpoint/x', commits: [] },
        ],
        stashCount: 2,
        pushDefault: 'simple',
      }),
    );
    expect(result.errors).toEqual([]);
    const w = result.warnings.join('\n');
    expect(w).toMatch(/etiqueta/);
    expect(w).toMatch(/Ramas locales que NO deben publicarse: main, trabajo/);
    expect(w).toMatch(/referencia\(s\) auxiliar\(es\)/);
    expect(w).toMatch(/2 stash/);
    expect(w).toMatch(/push\.default/);
  });

  it('ignora la propia rama al comparar y no emite avisos con un repositorio limpio', () => {
    const result = evaluatePublicBranch(
      base({ otherRefs: [{ name: 'refs/heads/publica', commits: ['n1'] }] }),
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
