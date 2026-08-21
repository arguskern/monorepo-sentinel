import * as fs from 'fs';
import * as path from 'path';
import { WorkspacePackage, PackageJson } from './types.js';

export function scanWorkspace(rootDir: string): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];
  const visitedDirs = new Set<string>();

  function search(dir: string, depth = 0) {
    if (depth > 5 || visitedDirs.has(dir)) return;
    visitedDirs.add(dir);

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        const subDir = path.join(dir, entry.name);
        const pkgJsonPath = path.join(subDir, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          try {
            const content = fs.readFileSync(pkgJsonPath, 'utf-8');
            const pkgJson = JSON.parse(content) as PackageJson;
            if (pkgJson.name) {
              packages.push({
                name: pkgJson.name,
                path: path.relative(rootDir, subDir) || '.',
                packageJson: pkgJson,
              });
            }
          } catch (e) {
            // Ignore malformed JSON
          }
        }
        search(subDir, depth + 1);
      }
    }
  }

  // Also check root package.json
  const rootPkgJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(rootPkgJsonPath)) {
    try {
      const content = fs.readFileSync(rootPkgJsonPath, 'utf-8');
      const pkgJson = JSON.parse(content) as PackageJson;
      if (pkgJson.name) {
        packages.push({
          name: pkgJson.name,
          path: '.',
          packageJson: pkgJson,
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  search(rootDir);
  return packages;
}
