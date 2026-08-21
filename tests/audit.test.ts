import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { findCircularDependencies } from '../src/graph.js';
import { findDependencyMismatches } from '../src/mismatches.js';
import { checkPackageCompatibility } from '../src/compat.js';
import { WorkspacePackage } from '../src/types.js';

describe('Monorepo Sentinel Core Suite', () => {
  it('should detect circular dependencies accurately', () => {
    const packages: WorkspacePackage[] = [
      {
        name: 'pkg-a',
        path: 'packages/a',
        packageJson: {
          name: 'pkg-a',
          version: '1.0.0',
          dependencies: { 'pkg-b': '1.0.0' }
        }
      },
      {
        name: 'pkg-b',
        path: 'packages/b',
        packageJson: {
          name: 'pkg-b',
          version: '1.0.0',
          dependencies: { 'pkg-c': '1.0.0' }
        }
      },
      {
        name: 'pkg-c',
        path: 'packages/c',
        packageJson: {
          name: 'pkg-c',
          version: '1.0.0',
          dependencies: { 'pkg-a': '1.0.0' }
        }
      }
    ];

    const cycles = findCircularDependencies(packages);
    assert.strictEqual(cycles.length >= 1, true);
    assert.deepStrictEqual(cycles[0], ['pkg-a', 'pkg-b', 'pkg-c', 'pkg-a']);
  });

  it('should not detect false positives in acyclic graphs', () => {
    const packages: WorkspacePackage[] = [
      {
        name: 'pkg-a',
        path: 'packages/a',
        packageJson: {
          name: 'pkg-a',
          version: '1.0.0',
          dependencies: { 'pkg-b': '1.0.0', 'pkg-c': '1.0.0' }
        }
      },
      {
        name: 'pkg-b',
        path: 'packages/b',
        packageJson: {
          name: 'pkg-b',
          version: '1.0.0',
          dependencies: { 'pkg-c': '1.0.0' }
        }
      },
      {
        name: 'pkg-c',
        path: 'packages/c',
        packageJson: {
          name: 'pkg-c',
          version: '1.0.0'
        }
      }
    ];

    const cycles = findCircularDependencies(packages);
    assert.strictEqual(cycles.length, 0);
  });

  it('should detect dependency version mismatches across packages', () => {
    const packages: WorkspacePackage[] = [
      {
        name: 'app-web',
        path: 'apps/web',
        packageJson: {
          name: 'app-web',
          version: '1.0.0',
          dependencies: { 'react': '^18.2.0', 'lodash': '4.17.21' }
        }
      },
      {
        name: 'app-admin',
        path: 'apps/admin',
        packageJson: {
          name: 'app-admin',
          version: '1.0.0',
          dependencies: { 'react': '^18.3.1', 'lodash': '4.17.21' }
        }
      }
    ];

    const mismatches = findDependencyMismatches(packages);
    assert.strictEqual(mismatches.length, 1);
    assert.strictEqual(mismatches[0].dependencyName, 'react');
    assert.strictEqual(Object.keys(mismatches[0].versions).length, 2);
  });

  it('should report package compatibility issues', () => {
    const packages: WorkspacePackage[] = [
      {
        name: '',
        path: 'packages/empty',
        packageJson: {
          name: '',
          version: ''
        }
      }
    ];

    const issues = checkPackageCompatibility(packages);
    assert.strictEqual(issues.length >= 2, true);
  });
});
