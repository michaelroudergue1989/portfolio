export interface PublicBranchInput {
  branch: string;
  branchCommits: string[];
  rootCommits: string[];
  otherRefs: { name: string; commits: string[] }[];
  stashCount?: number;
  pushDefault?: string | null;
  maxCommits?: number;
}

export interface PublicBranchResult {
  errors: string[];
  warnings: string[];
  safePushCommand: string;
}

export function evaluatePublicBranch(input: PublicBranchInput): PublicBranchResult;
export function inspectRepository(
  branch: string,
  cwd?: string,
  maxCommits?: number,
): PublicBranchResult;
