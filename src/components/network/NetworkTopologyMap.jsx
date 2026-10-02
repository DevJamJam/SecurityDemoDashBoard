import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MdRestartAlt } from "react-icons/md";
import "./NetworkTopologyMap.css";

// 망 연결 상태별 색상
const COLORS = {
  allow: "#16a34a",
  partial: "#d4a017",
  block: "#dc2626",
  alert: "#b91c1c",
  muted: "#94a3b8",
};

const NODE_W = 160;
const NODE_H = 72;

// 엣지 스타일 결정 — allow/block/total 기반
function buildEdgeStyle(counts, hasAlert) {
  if (hasAlert) return { color: COLORS.alert, strokeWidth: 3, dashed: false, cls: "topo-edge--alert" };
  if (counts.total === 0) return { color: COLORS.muted, strokeWidth: 1, dashed: true, cls: "" };
  if (counts.allow === counts.total) return { color: COLORS.allow, strokeWidth: 2, dashed: false, cls: "" };
  if (counts.allow === 0) return { color: COLORS.block, strokeWidth: 1.5, dashed: true, cls: "" };
  return { color: COLORS.partial, strokeWidth: 2, dashed: false, cls: "" };
}

// 원형 레이아웃 — dagre 없이도 깔끔한 배치
function circleLayout(nodes) {
  const cx = 400, cy = 300, r = 240;
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return { ...n, position: { x: cx + r * Math.cos(angle) - NODE_W / 2, y: cy + r * Math.sin(angle) - NODE_H / 2 } };
  });
}

function buildGraph(segments, connections) {
  // 연결에 등장하는 노드 ID 수집 (src/dst는 segment.name 기준)
  const names = Array.from(new Set([
    ...segments.map((s) => s.name),
    ...connections.flatMap((c) => [c.src, c.dst]),
  ]));

  const nodes = names.map((name) => {
    const seg = segments.find((s) => s.name === name);
    const riskColor = seg?.riskLevel === "high" ? "#dc2626" : seg?.riskLevel === "medium" ? "#d4a017" : "#16a34a";
    return {
      id: name,
      type: "default",
      data: {
        label: (
          <div className="topo-node">
            <strong className="topo-node__name">{seg ? (seg.nameKo || seg.name) : name}</strong>
            {seg && <span className="topo-node__cidr">{seg.cidr}</span>}
            {seg && (
              <span className="topo-node__risk" style={{ color: riskColor }}>
                자산 {seg.assetCount}개 · 위험 {seg.riskScore ?? "–"}점
              </span>
            )}
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: "var(--panel-color, #fff)",
        border: `1.5px solid var(--border-color, #d9e2ec)`,
        borderRadius: 10,
        width: NODE_W,
        height: NODE_H,
        padding: 0,
        fontSize: 12,
      },
    };
  });

  const edges = connections.map((conn) => {
    const style = buildEdgeStyle(conn.counts, conn.hasAlert);
    return {
      id: `${conn.src}->${conn.dst}`,
      source: conn.src,
      target: conn.dst,
      type: "default",
      label: `${conn.counts.allow}/${conn.counts.total}`,
      labelStyle: { fontSize: 10, fontWeight: 700, fill: style.color },
      labelBgStyle: { fill: "var(--panel-color, #fff)", opacity: 0.88 },
      labelBgPadding: [3, 2],
      labelBgBorderRadius: 3,
      style: {
        stroke: style.color,
        strokeWidth: style.strokeWidth,
        strokeDasharray: style.dashed ? "6 4" : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: style.color,
        width: 16,
        height: 16,
      },
      data: { cls: style.cls },
    };
  });

  return { nodes: circleLayout(nodes), edges };
}

// 선택 기반 엣지 className 계산
function edgeCls(edge, selEdge, selNodes) {
  const base = edge.data?.cls || "";
  if (!selEdge && selNodes.size === 0) return base;
  if (selEdge) return edge.id === selEdge ? `${base} topo-edge--sel` : `${base} topo-edge--dim`;
  if (selNodes.size === 1) {
    const id = [...selNodes][0];
    return (edge.source === id || edge.target === id) ? `${base} topo-edge--sel` : `${base} topo-edge--dim`;
  }
  const both = selNodes.has(edge.source) && selNodes.has(edge.target);
  return both ? `${base} topo-edge--sel` : `${base} topo-edge--dim`;
}

function nodeCls(node, selEdge, selNodes, edges) {
  if (!selEdge && selNodes.size === 0) return "";
  if (selEdge) {
    const e = edges.find((x) => x.id === selEdge);
    if (!e) return "";
    return node.id === e.source || node.id === e.target ? "topo-node--sel" : "topo-node--dim";
  }
  if (selNodes.has(node.id)) return "topo-node--sel";
  if (selNodes.size === 1) {
    const id = [...selNodes][0];
    const connected = edges.some((e) => (e.source === id && e.target === node.id) || (e.target === id && e.source === node.id));
    return connected ? "topo-node--conn" : "topo-node--dim";
  }
  return "topo-node--dim";
}

// 선택된 두 망 사이 연결 필터 표시
function PairFilter({ segments, selectedNodes, onClear }) {
  if (selectedNodes.size === 0) return null;
  const ids = [...selectedNodes];
  return (
    <div className="topo-pair-filter">
      <span className="topo-pair-filter__label">
        {ids.length === 1 ? `${ids[0]} 관련 연결 강조 중` : `${ids[0]} ↔ ${ids[1]} 연결 필터링 중`}
      </span>
      <button type="button" className="topo-pair-filter__clear" onClick={onClear}>
        <MdRestartAlt /> 전체 보기
      </button>
    </div>
  );
}

export default function NetworkTopologyMap({ segments = [], connections = [] }) {
  const [selEdge, setSelEdge] = useState(null);
  const [selNodes, setSelNodes] = useState(() => new Set());

  const { initNodes, initEdges } = useMemo(() => {
    const { nodes, edges } = buildGraph(segments, connections);
    return { initNodes: nodes, initEdges: edges };
  }, [segments, connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  useEffect(() => { setNodes(initNodes); setEdges(initEdges); }, [initNodes, initEdges, setNodes, setEdges]);

  // 선택 변경 시 className 업데이트
  useEffect(() => {
    setEdges((prev) => prev.map((e) => ({ ...e, className: edgeCls(e, selEdge, selNodes) })));
    setNodes((prev) => prev.map((n) => ({ ...n, className: nodeCls(n, selEdge, selNodes, initEdges) })));
  }, [selEdge, selNodes, initEdges, setEdges, setNodes]);

  const handleEdgeClick = useCallback((_, edge) => {
    setSelEdge(edge.id);
    setSelNodes(new Set());
  }, []);

  const handleNodeClick = useCallback((_, node) => {
    setSelEdge(null);
    setSelNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) next.delete(node.id);
      else {
        // 최대 2개 노드 선택 (두 망 비교)
        if (next.size >= 2) next.clear();
        next.add(node.id);
      }
      return next;
    });
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelEdge(null);
    setSelNodes(new Set());
  }, []);

  const clearSel = () => { setSelEdge(null); setSelNodes(new Set()); };

  const isEmpty = connections.length === 0;

  return (
    <div className="topo-wrap">
      <div className="topo-legend">
        <span><i className="topo-legend-line topo-legend-line--allow" /> 모두 허용</span>
        <span><i className="topo-legend-line topo-legend-line--partial" /> 일부 허용</span>
        <span><i className="topo-legend-line topo-legend-line--block" /> 모두 차단</span>
        <span><i className="topo-legend-line topo-legend-line--alert" /> ⚠ 갑자기 열린 통신</span>
        <span className="topo-legend-hint">노드 클릭(최대 2개) = 해당 망 연결만 강조 · 엣지 클릭 = 단일 연결 · 빈 영역 클릭 = 초기화</span>
      </div>

      <PairFilter segments={segments} selectedNodes={selNodes} onClear={clearSel} />

      <div className="topo-stage">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
          edgesFocusable
        >
          <Background gap={20} color="var(--border-color, #e2e8f0)" />
          <Controls showInteractive={false} />
        </ReactFlow>
        {isEmpty && (
          <div className="topo-empty-overlay">
            <div className="topo-empty-box">
              <div className="topo-empty-title">측정된 연결 정보가 없습니다.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
