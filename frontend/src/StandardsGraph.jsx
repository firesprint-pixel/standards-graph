import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const RELATION_COLORS = {
  safety: '#ef4444',
  test_method: '#3b82f6',
  installation: '#22c55e',
  normative_reference: '#a855f7',
  terminology: '#eab308',
};

function buildGraphElements(bundle) {
  if (!bundle || !bundle.primary) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];

  // Primary standard — placed in the center
  nodes.push({
    id: bundle.primary.code,
    data: { label: `${bundle.primary.code}\n${bundle.primary.title}` },
    position: { x: 400, y: 250 },
    style: {
      background: '#1e293b',
      color: '#fff',
      border: '2px solid #fff',
      borderRadius: 8,
      padding: 10,
      width: 220,
      fontWeight: 'bold',
      whiteSpace: 'pre-line',
      fontSize: 12,
    },
  });

  // Related standards — placed in a circle around the primary
  const count = bundle.related.length;
  bundle.related.forEach((rel, i) => {
    const angle = (2 * Math.PI * i) / count;
    const radius = 300;
    const x = 400 + radius * Math.cos(angle);
    const y = 250 + radius * Math.sin(angle);

    nodes.push({
      id: rel.code,
      data: { label: `${rel.code}\n${rel.title}` },
      position: { x, y },
      style: {
        background: '#f8fafc',
        border: `2px solid ${RELATION_COLORS[rel.relation] || '#94a3b8'}`,
        borderRadius: 8,
        padding: 10,
        width: 200,
        whiteSpace: 'pre-line',
        fontSize: 11,
      },
    });

    edges.push({
      id: `${rel.code}-${bundle.primary.code}`,
      source: rel.code,
      target: bundle.primary.code,
      label: rel.relation,
      animated: true,
      style: { stroke: RELATION_COLORS[rel.relation] || '#94a3b8' },
      labelStyle: { fill: RELATION_COLORS[rel.relation] || '#94a3b8', fontWeight: 600 },
    });
  });

  return { nodes, edges };
}

export default function StandardsGraph({ bundle }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraphElements(bundle);
    setNodes(n);
    setEdges(e);
  }, [bundle, setNodes, setEdges]);

  const onNodeClick = useCallback((_, node) => {
    if (!bundle) return;
    if (node.id === bundle.primary.code) {
      setSelected({
        code: bundle.primary.code,
        title: bundle.primary.title,
        reason: 'This is the primary standard identified for the tender.',
      });
    } else {
      const rel = bundle.related.find((r) => r.code === node.id);
      setSelected(rel);
    }
  }, [bundle]);

  if (!bundle) {
    return <p style={{ color: '#94a3b8' }}>No standards bundle loaded yet.</p>;
  }

  return (
    <div style={{ display: 'flex', height: '600px', border: '1px solid #334155' }}>
      <div style={{ flex: 3 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <div style={{ flex: 1, padding: 16, background: '#0f172a', color: '#fff', overflowY: 'auto' }}>
        <h3>Details</h3>
        {selected ? (
          <>
            <p><strong>{selected.code}</strong></p>
            <p>{selected.title}</p>
            {selected.relation && <p><em>Relation:</em> {selected.relation}</p>}
            <p><em>Why:</em> {selected.reason}</p>
          </>
        ) : (
          <p style={{ color: '#94a3b8' }}>Click a node to see why it's connected.</p>
        )}
        {bundle.coverage_note && (
          <p style={{ marginTop: 20, fontSize: 12, color: '#facc15' }}>
            ⓘ {bundle.coverage_note}
          </p>
        )}
      </div>
    </div>
  );
}