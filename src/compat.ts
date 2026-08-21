import { WorkspacePackage } from './types.js';

export function checkPackageCompatibility(packages: WorkspacePackage[]): string[] {
  const issues: string[] = [];

  for (const pkg of packages) {
    const json = pkg.packageJson;
    
    // Check missing name or version
    if (!json.name) {
      issues.push(`Package at ${pkg.path} is missing the "name" field.`);
    }
    if (!json.version) {
      issues.push(`Package "${json.name || pkg.path}" is missing the "version" field.`);
    }

    // Check main vs exports
    if (json.exports && !json.main) {
      // It's recommended to have main for backward compatibility if targeting Node < 12
    }

    // Check types
    if (!json.types && !json.main && !json.exports) {
      issues.push(`Package "${json.name}" has no entrypoint specified ("main", "module", "types", or "exports").`);
    }
  }

  return issues;
}
