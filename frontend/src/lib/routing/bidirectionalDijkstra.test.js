import {
  MinHeap,
  buildGraph,
  bidirectionalDijkstra,
  unidirectionalDijkstra,
  findAlternativeRoutes,
  compareRoutes
} from './bidirectionalDijkstra.js';
import { NER_NODES, NER_EDGES } from './nerGraphData.js';

export function runTests() {
  console.log('--- STARTING ROUTING ENGINE UNIT TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: MinHeap Priority Queue Correctness
  const heap = new MinHeap();
  heap.push({ id: 'C', dist: 30 });
  heap.push({ id: 'A', dist: 10 });
  heap.push({ id: 'B', dist: 20 });
  heap.push({ id: 'D', dist: 5 });

  assert(heap.size() === 4, 'MinHeap size should be 4');
  assert(heap.pop().id === 'D', 'MinHeap pop should return smallest (D: 5)');
  assert(heap.pop().id === 'A', 'MinHeap pop should return next smallest (A: 10)');
  assert(heap.pop().id === 'B', 'MinHeap pop should return next smallest (B: 20)');
  assert(heap.pop().id === 'C', 'MinHeap pop should return largest (C: 30)');
  assert(heap.isEmpty(), 'MinHeap should be empty');

  // TEST 2: 6-Node Hand-Computed Benchmark Graph
  // Nodes: S, A, B, C, D, T
  // Edges:
  // S -> A (7), S -> B (9), S -> F (14)
  // A -> C (10), A -> D (15)
  // B -> C (2), B -> D (11)
  // C -> T (6)
  // D -> T (9)
  // Shortest path: S -> B (9) -> C (2) -> T (6) = Total 17
  const testNodes = {
    S: { id: 'S', name: 'Start', lat: 0, lng: 0 },
    A: { id: 'A', name: 'Node A', lat: 0, lng: 0 },
    B: { id: 'B', name: 'Node B', lat: 0, lng: 0 },
    C: { id: 'C', name: 'Node C', lat: 0, lng: 0 },
    D: { id: 'D', name: 'Node D', lat: 0, lng: 0 },
    T: { id: 'T', name: 'Target', lat: 0, lng: 0 }
  };

  const testEdges = [
    { id: 'e1', from: 'S', to: 'A', distanceKm: 7, baseTimeMin: 7, riskScore: 0, bidirectional: true },
    { id: 'e2', from: 'S', to: 'B', distanceKm: 9, baseTimeMin: 9, riskScore: 0, bidirectional: true },
    { id: 'e3', from: 'S', to: 'D', distanceKm: 14, baseTimeMin: 14, riskScore: 0, bidirectional: true },
    { id: 'e4', from: 'A', to: 'C', distanceKm: 10, baseTimeMin: 10, riskScore: 0, bidirectional: true },
    { id: 'e5', from: 'A', to: 'D', distanceKm: 15, baseTimeMin: 15, riskScore: 0, bidirectional: true },
    { id: 'e6', from: 'B', to: 'C', distanceKm: 2, baseTimeMin: 2, riskScore: 0, bidirectional: true },
    { id: 'e7', from: 'B', to: 'D', distanceKm: 11, baseTimeMin: 11, riskScore: 0, bidirectional: true },
    { id: 'e8', from: 'C', to: 'T', distanceKm: 6, baseTimeMin: 6, riskScore: 0, bidirectional: true },
    { id: 'e9', from: 'D', to: 'T', distanceKm: 9, baseTimeMin: 9, riskScore: 0, bidirectional: true }
  ];

  const testGraph = buildGraph(testNodes, testEdges);
  const biResult = bidirectionalDijkstra(testGraph, 'S', 'T');
  const uniResult = unidirectionalDijkstra(testGraph, 'S', 'T');

  assert(biResult && biResult.path !== null, "Bidirectional Dijkstra's finds a path on 6-node graph");
  assert(biResult.totalWeight === 17, `Hand-computed path cost must be 17 (got ${biResult.totalWeight})`);
  assert(biResult.path.join('->') === 'S->B->C->T', `Optimal path must be S->B->C->T (got ${biResult.path.join('->')})`);
  assert(biResult.totalWeight === uniResult.totalWeight, `Bidirectional cost (${biResult.totalWeight}) matches Unidirectional cost (${uniResult.totalWeight})`);

  // TEST 3: Blocked Edge Handling
  // Block B->C (e6). Path should now fall back to S->B->D->T (9+11+9=29) or S->A->C->T (7+10+6=23) -> Optimal becomes S->A->C->T (23)
  const blockedGraph = buildGraph(testNodes, testEdges, { blockedEdgeIds: new Set(['e6']) });
  const blockedBi = bidirectionalDijkstra(blockedGraph, 'S', 'T');
  assert(['S->A->C->T', 'S->D->T'].includes(blockedBi.path.join('->')), `Blocked route follows valid cost-23 shortest path (got ${blockedBi.path.join('->')})`);

  // TEST 4: Unreachable Disconnected Node
  const isolatedNodes = {
    ...testNodes,
    ISOLATED: { id: 'ISOLATED', name: 'Island', lat: 0, lng: 0 }
  };
  const isolatedGraph = buildGraph(isolatedNodes, testEdges);
  const unreachableBi = bidirectionalDijkstra(isolatedGraph, 'S', 'ISOLATED');
  assert(unreachableBi.path === null, 'Unreachable node correctly returns path: null');
  assert(unreachableBi.error.includes('No viable connected corridor'), 'Unreachable node returns descriptive error');

  // TEST 5: NER Graph Real-World Equivalence Across Multiple Hubs
  const nerGraph = buildGraph(NER_NODES, NER_EDGES);
  const testPairs = [
    ['AS-KAM', 'ML-EKH'], // Guwahati -> Shillong
    ['AS-KAM', 'AS-CAC'], // Guwahati -> Silchar
    ['AS-KAM', 'NL-KOH'], // Guwahati -> Kohima
    ['AS-KAM', 'AR-PAP'], // Guwahati -> Itanagar
    ['AS-KAM', 'MN-IMP'], // Guwahati -> Imphal
    ['AS-KAM', 'TR-WST'], // Guwahati -> Agartala
    ['AS-KAM', 'SK-EAS']  // Guwahati -> Gangtok
  ];

  testPairs.forEach(([src, dst]) => {
    const bi = bidirectionalDijkstra(nerGraph, src, dst);
    const uni = unidirectionalDijkstra(nerGraph, src, dst);
    assert(
      bi && uni && bi.totalWeight === uni.totalWeight,
      `NER corridor ${src} -> ${dst}: Bidirectional cost (${bi.totalWeight}) === Unidirectional cost (${uni.totalWeight})`
    );
  });

  // TEST 6: Alternative Routes Diversity (Penalty Method)
  const altRoutes = findAlternativeRoutes(NER_NODES, NER_EDGES, 'AS-KAM', 'AS-CAC', 3);
  assert(altRoutes.length >= 2, `Should discover at least 2 distinct routes (found ${altRoutes.length})`);
  const uniquePaths = new Set(altRoutes.map(r => r.edges.map(e => e.id).join('->')));
  assert(uniquePaths.size === altRoutes.length, 'All generated alternative routes are distinct edge paths');

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  return failed === 0;
}

// Auto-run if executed via node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('bidirectionalDijkstra.test.js')) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}
