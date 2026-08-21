import { scanWorkspace } from './scanner.js';
import { findCircularDependencies } from './graph.js';
import { findDependencyMismatches } from './mismatches.js';
import { checkPackageCompatibility } from './compat.js';
import * as path from 'path';

export function runCli() {
  const args = process.argv.slice(2);
  const rootDir = args[0] || process.cwd();
  const absoluteRootDir = path.resolve(rootDir);

  console.log(`\n🔍 Scanning monorepo at: ${absoluteRootDir}\n`);

  const packages = scanWorkspace(absoluteRootDir);
  console.log(`📦 Found ${packages.length} packages.\n`);

  const circular = findCircularDependencies(packages);
  if (circular.length > 0) {
    console.log(`❌ Found ${circular.length} circular dependencies:`);
    circular.forEach((cycle, i) => {
      console.log(`   ${i + 1}. ${cycle.join(' -> ')}`);
    });
    console.log('');
  } else {
    console.log(`✅ No circular dependencies found.\n`);
  }

  const mismatches = findDependencyMismatches(packages);
  if (mismatches.length > 0) {
    console.log(`⚠️ Found ${mismatches.length} dependency version mismatches:`);
    mismatches.forEach(m => {
      console.log(`   - ${m.dependencyName}:`);
      for (const [version, pkgList] of Object.entries(m.versions)) {
        console.log(`     ${version} used by: ${pkgList.join(', ')}`);
      }
    });
    console.log('');
  } else {
    console.log(`✅ All dependency versions are aligned.\n`);
  }

  const issues = checkPackageCompatibility(packages);
  if (issues.length > 0) {
    console.log(`⚠️ Found ${issues.length} compatibility issues:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  } else {
    console.log(`✅ No package compatibility issues found.\n`);
  }

  if (circular.length > 0) {
    process.exit(1);
  }
}
