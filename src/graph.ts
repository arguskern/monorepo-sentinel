import { WorkspacePackage } from './types.js';

export function findCircularDependencies(packages: WorkspacePackage[]): string[][] {
  const adj = new Map<string, string[]>();
  const packageNames = new Set(packages.map(p => p.name));

  for (const pkg of packages) {
    const deps = [
      ...Object.keys(pkg.packageJson.dependencies || {}),
      ...Object.keys(pkg.packageJson.devDependencies || {}),
      ...Object.keys(pkg.packageJson.peerDependencies || {}),
    ];
    // Only include dependencies that are part of the workspace
    adj.set(pkg.name, deps.filter(d => packageNames.has(d)));
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(u: string) {
    visited.add(u);
    recStack.add(u);
    path.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        dfs(v);
      } else if (recStack.has(v)) {
        // Cycle detected
        const cycleStartIdx = path.indexOf(v);
        cycles.push([...path.slice(cycleStartIdx), v]);
      }
    }

    recStack.delete(u);
    path.pop();
  }

  for (const pkgName of packageNames) {
    if (!visited.has(pkgName)) {
      dfs(pkgName);
    }
  }

  return cycles;
}
