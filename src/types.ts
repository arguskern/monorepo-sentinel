export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
  main?: string;
  module?: string;
  types?: string;
  exports?: any;
}

export interface WorkspacePackage {
  name: string;
  path: string;
  packageJson: PackageJson;
}

export interface DependencyMismatch {
  dependencyName: string;
  versions: Record<string, string[]>; // version -> package names
}

export interface AuditResult {
  packages: WorkspacePackage[];
  circularDependencies: string[][];
  mismatches: DependencyMismatch[];
  compatibilityIssues: string[];
}
