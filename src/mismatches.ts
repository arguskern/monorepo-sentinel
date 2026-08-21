import { WorkspacePackage, DependencyMismatch } from './types.js';

export function findDependencyMismatches(packages: WorkspacePackage[]): DependencyMismatch[] {
  const depMap = new Map<string, Map<string, string[]>>(); // depName -> version -> packageNames[]

  for (const pkg of packages) {
    const allDeps = {
      ...(pkg.packageJson.dependencies || {}),
      ...(pkg.packageJson.devDependencies || {}),
      ...(pkg.packageJson.peerDependencies || {}),
    };

    for (const [depName, version] of Object.entries(allDeps)) {
      if (!depMap.has(depName)) {
        depMap.set(depName, new Map<string, string[]>());
      }
      const versionMap = depMap.get(depName)!;
      if (!versionMap.has(version)) {
        versionMap.set(version, []);
      }
      versionMap.get(version)!.push(pkg.name);
    }
  }

  const mismatches: DependencyMismatch[] = [];

  for (const [depName, versionMap] of depMap.entries()) {
    if (versionMap.size > 1) {
      const versionsObj: Record<string, string[]> = {};
      for (const [version, pkgList] of versionMap.entries()) {
        versionsObj[version] = pkgList;
      }
      mismatches.push({
        dependencyName: depName,
        versions: versionsObj,
      });
    }
  }

  return mismatches;
}
