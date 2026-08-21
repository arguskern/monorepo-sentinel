// Monorepo Sentinel Web Application Logic

// Mock Datasets
const DATASETS = {
  cosmos: generateCosmosDataset(),
  circular: getCircularDataset(),
  clean: getCleanDataset()
};

let currentData = DATASETS.cosmos;

// Tab Switching
const tabs = {
  cycles: { btn: 'tab-cycles', view: 'view-cycles' },
  mismatches: { btn: 'tab-mismatches', view: 'view-mismatches' },
  align: { btn: 'tab-align', view: 'view-align' }
};

Object.entries(tabs).forEach(([key, config]) => {
  document.getElementById(config.btn).addEventListener('click', () => {
    // Reset all tabs
    Object.values(tabs).forEach(c => {
      document.getElementById(c.btn).className = 'text-slate-400 hover:text-slate-200 pb-2';
      document.getElementById(c.view).classList.add('hidden');
    });
    // Activate clicked tab
    document.getElementById(config.btn).className = 'text-sky-400 border-b-2 border-sky-400 pb-2';
    document.getElementById(config.view).classList.remove('hidden');
  });
});

// Preset Selector
document.getElementById('preset-select').addEventListener('change', (e) => {
  const val = e.target.value;
  if (DATASETS[val]) {
    currentData = DATASETS[val];
    runAudit(currentData);
  }
});

document.getElementById('btn-run-audit').addEventListener('click', () => {
  runAudit(currentData);
});

// Initialize
runAudit(currentData);

function runAudit(data) {
  const packages = data.packages;
  
  // 1. Calculate stats
  document.getElementById('stat-packages').innerText = packages.length;
  
  // 2. Find circular dependencies
  const cycles = findCycles(packages);
  document.getElementById('stat-cycles').innerText = cycles.length;
  const cyclesSub = document.getElementById('stat-cycles-sub');
  if (cycles.length > 0) {
    cyclesSub.innerText = `${cycles.length} active cycle paths`;
    cyclesSub.className = 'text-rose-500/80 mt-1';
  } else {
    cyclesSub.innerText = 'Optimal stability';
    cyclesSub.className = 'text-emerald-500/80 mt-1';
  }

  // 3. Find mismatches
  const mismatches = findMismatches(packages);
  document.getElementById('stat-mismatches').innerText = mismatches.length;

  // 4. Calculate health score
  const healthScore = calculateHealthScore(packages.length, cycles.length, mismatches.length);
  const healthEl = document.getElementById('stat-health');
  healthEl.innerText = `${healthScore}%`;
  if (healthScore >= 90) {
    healthEl.className = 'text-3xl font-bold text-emerald-400 mt-1 font-mono';
  } else if (healthScore >= 60) {
    healthEl.className = 'text-3xl font-bold text-amber-400 mt-1 font-mono';
  } else {
    healthEl.className = 'text-3xl font-bold text-rose-400 mt-1 font-mono';
  }

  // Render Lists
  renderCyclesList(cycles);
  renderMismatchesList(mismatches);
  renderAlignmentCode(mismatches);

  // Render Graph
  renderGraph(packages, cycles);
}

// Cycle Detection (DFS)
function findCycles(packages) {
  const adj = new Map();
  const packageNames = new Set(packages.map(p => p.name));

  packages.forEach(pkg => {
    const deps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ];
    adj.set(pkg.name, deps.filter(d => packageNames.has(d)));
  });

  const cycles = [];
  const visited = new Set();
  const recStack = new Set();
  const path = [];

  function dfs(u) {
    visited.add(u);
    recStack.add(u);
    path.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        dfs(v);
      } else if (recStack.has(v)) {
        const cycleStartIdx = path.indexOf(v);
        if (cycleStartIdx !== -1) {
          cycles.push([...path.slice(cycleStartIdx), v]);
        }
      }
    }

    recStack.delete(u);
    path.pop();
  }

  for (const name of packageNames) {
    if (!visited.has(name)) {
      dfs(name);
    }
  }

  return cycles;
}

// Mismatches Detection
function findMismatches(packages) {
  const depMap = new Map();

  packages.forEach(pkg => {
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
      ...(pkg.peerDependencies || {})
    };

    for (const [depName, version] of Object.entries(allDeps)) {
      if (!depMap.has(depName)) {
        depMap.set(depName, new Map());
      }
      const versionMap = depMap.get(depName);
      if (!versionMap.has(version)) {
        versionMap.set(version, []);
      }
      versionMap.get(version).push(pkg.name);
    }
  });

  const mismatches = [];
  for (const [depName, versionMap] of depMap.entries()) {
    if (versionMap.size > 1) {
      const versionsObj = {};
      for (const [version, pkgList] of versionMap.entries()) {
        versionsObj[version] = pkgList;
      }
      mismatches.push({
        dependencyName: depName,
        versions: versionsObj
      });
    }
  }

  return mismatches;
}

function calculateHealthScore(pkgCount, cycleCount, mismatchCount) {
  if (pkgCount === 0) return 100;
  const cyclePenalty = cycleCount * 15;
  const mismatchPenalty = mismatchCount * 5;
  const score = 100 - cyclePenalty - mismatchPenalty;
  return Math.max(0, score);
}

// Render Lists
function renderCyclesList(cycles) {
  const container = document.getElementById('cycles-list');
  container.innerHTML = '';

  if (cycles.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
        ✓ No circular dependencies detected. Your dependency graph is a clean Directed Acyclic Graph (DAG).
      </div>
    `;
    return;
  }

  cycles.forEach((cycle, i) => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-lg bg-rose-500/5 border border-rose-500/10 flex flex-col space-y-2';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-mono text-rose-400 font-semibold">Cycle Path #${i + 1}</span>
        <span class="badge badge-danger">High Risk</span>
      </div>
      <div class="text-sm font-mono text-slate-200">
        ${cycle.join(' <span class="text-rose-500">→</span> ')}
      </div>
      <p class="text-xs text-slate-400 mt-1">
        <strong>Resolution:</strong> Break the cycle by extracting shared interfaces or utilities from <code class="text-rose-300">${cycle[cycle.length - 2]}</code> into a separate package, or use dependency injection.
      </p>
    `;
    container.appendChild(card);
  });
}

function renderMismatchesList(mismatches) {
  const container = document.getElementById('mismatches-list');
  container.innerHTML = '';

  if (mismatches.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
        ✓ All third-party dependency versions are perfectly aligned across your workspace.
      </div>
    `;
    return;
  }

  mismatches.forEach(m => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 flex flex-col space-y-3';
    
    let versionsHtml = '';
    Object.entries(m.versions).forEach(([version, pkgs]) => {
      versionsHtml += `
        <div class="flex items-start space-x-2 text-xs font-mono">
          <span class="text-amber-400 font-semibold w-20">${version}</span>
          <span class="text-slate-400">used by: ${pkgs.join(', ')}</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-mono text-slate-200 font-semibold">${m.dependencyName}</span>
        <span class="badge badge-warning">Version Drift</span>
      </div>
      <div class="space-y-1.5">
        ${versionsHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderAlignmentCode(mismatches) {
  const codeEl = document.getElementById('align-code');
  if (mismatches.length === 0) {
    codeEl.innerText = '// No alignments needed. Your workspace is fully optimized.';
    return;
  }

  let code = `// Monorepo Sentinel Alignment Recommendations\n`;
  code += `// Run the following alignment updates to unify dependency versions:\n\n`;
  
  mismatches.forEach(m => {
    const versions = Object.keys(m.versions);
    // Pick the highest version as the target
    const targetVersion = versions.sort().pop();
    code += `// Align "${m.dependencyName}" to target version: ${targetVersion}\n`;
    code += `const align_${m.dependencyName.replace(/[^a-zA-Z0-9]/g, '_')} = {\n`;
    code += `  "dependency": "${m.dependencyName}",\n`;
    code += `  "target": "${targetVersion}",\n`;
    code += `  "packagesToUpdate": ${JSON.stringify(versions.filter(v => v !== targetVersion).flatMap(v => m.versions[v]), null, 2)}\n`;
    code += `};\n\n`;
  });

  codeEl.innerText = code;
}

// D3 Graph Visualization
function renderGraph(packages, cycles) {
  const svg = d3.select('#dep-graph');
  svg.selectAll('*').remove();

  const width = document.getElementById('graph-wrapper').clientWidth;
  const height = 480;

  // Build nodes and links
  const nodes = packages.map(p => ({
    id: p.name,
    group: p.name.includes('app') ? 1 : p.name.includes('lib') ? 2 : 3,
    isCyclic: cycles.some(c => c.includes(p.name))
  }));

  const links = [];
  const packageNames = new Set(packages.map(p => p.name));

  packages.forEach(pkg => {
    const deps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ];
    deps.forEach(dep => {
      if (packageNames.has(dep)) {
        // Check if this link is part of any cycle
        const isCycleEdge = cycles.some(cycle => {
          for (let i = 0; i < cycle.length - 1; i++) {
            if (cycle[i] === pkg.name && cycle[i+1] === dep) return true;
          }
          return false;
        });

        links.push({
          source: pkg.name,
          target: dep,
          isCycleEdge
        });
      }
    });
  });

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-150))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(35));

  // Add arrow markers for directed graph
  svg.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#475569');

  svg.append('defs').append('marker')
    .attr('id', 'arrow-cycle')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#f43f5e');

  // Draw links
  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('class', d => d.isCycleEdge ? 'link cycle-edge' : 'link')
    .attr('marker-end', d => d.isCycleEdge ? 'url(#arrow-cycle)' : 'url(#arrow)');

  // Draw nodes
  const node = svg.append('g')
    .selectAll('g')
    .data(nodes)
    .enter().append('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  node.append('circle')
    .attr('r', 12)
    .attr('fill', d => d.isCyclic ? '#f43f5e' : d.group === 1 ? '#38bdf8' : d.group === 2 ? '#10b981' : '#a855f7')
    .attr('stroke', d => d.isCyclic ? '#fda4af' : '#1e293b')
    .attr('stroke-width', 2);

  node.append('text')
    .attr('dx', 16)
    .attr('dy', 4)
    .text(d => d.id)
    .attr('fill', '#f1f5f9')
    .attr('font-size', '10px')
    .attr('font-family', 'monospace');

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('transform', d => `translate(${d.x},${d.y})`);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

// Dataset Generators
function generateCosmosDataset() {
  const packages = [
    { name: 'web-app', dependencies: { 'api-gateway': '1.0.0', 'shared-ui': '1.0.0', 'react': '^18.2.0', 'zod': '^3.22.4' } },
    { name: 'admin-portal', dependencies: { 'api-gateway': '1.0.0', 'shared-ui': '1.0.0', 'react': '^18.3.1', 'zod': '^3.23.8' } },
    { name: 'api-gateway', dependencies: { 'auth-service': '1.0.0', 'billing-service': '1.0.0', 'shared-utils': '1.0.0' } },
    { name: 'auth-service', dependencies: { 'api-gateway': '1.0.0', 'db-client': '1.0.0' } },
    { name: 'billing-service', dependencies: { 'notification-service': '1.0.0', 'db-client': '1.0.0' } },
    { name: 'notification-service', dependencies: { 'shared-ui': '1.0.0' } },
    { name: 'shared-ui', dependencies: { 'shared-utils': '1.0.0', 'react': '^17.0.2', 'billing-service': '1.0.0' } },
    { name: 'shared-utils', dependencies: { 'lodash': '4.17.19' } },
    { name: 'db-client', dependencies: { 'shared-utils': '1.0.0', 'lodash': '4.17.21' } }
  ];

  // Generate 51 more packages programmatically to reach exactly 60 packages!
  for (let i = 1; i <= 51; i++) {
    packages.push({
      name: `package-addon-${i}`,
      dependencies: {
        'shared-utils': '1.0.0',
        'lodash': i % 2 === 0 ? '4.17.21' : '4.17.19'
      }
    });
  }

  return { packages };
}

function getCircularDataset() {
  return {
    packages: [
      { name: '@core/auth', dependencies: { '@core/api': '1.0.0' } },
      { name: '@core/api', dependencies: { '@core/utils': '1.0.0' } },
      { name: '@core/utils', dependencies: { '@core/auth': '1.0.0' } },
      { name: '@core/ui', dependencies: { '@core/utils': '1.0.0' } }
    ]
  };
}

function getCleanDataset() {
  return {
    packages: [
      { name: 'app-web', dependencies: { 'lib-auth': '1.0.0', 'lib-ui': '1.0.0', 'react': '^18.2.0' } },
      { name: 'lib-auth', dependencies: { 'lib-db': '1.0.0', 'react': '^18.2.0' } },
      { name: 'lib-ui', dependencies: { 'react': '^18.2.0' } },
      { name: 'lib-db', dependencies: { 'lodash': '4.17.21' } },
      { name: 'lib-utils', dependencies: { 'lodash': '4.17.21' } }
    ]
  };
}
