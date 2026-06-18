import { useMemo, useState, useEffect } from "react";
import Button from "@/components/common/Button";
import "@/pages/dashboard/css/adminRoleHome-sidebar.css";

function TreeNode({
  node, selectedNodeId, expandedMap, onToggle, onSelect,
  onCreateChild, getCanCreateChild, getIsNodeSelectable, getIsNodeMuted, depth = 0,
}) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isExpanded = expandedMap[node.id];
  const isSelected = selectedNodeId === node.id;
  const isSelectable = getIsNodeSelectable ? getIsNodeSelectable(node) : true;
  const isMuted = getIsNodeMuted ? getIsNodeMuted(node) : false;
  const canCreateChild = getCanCreateChild ? getCanCreateChild(node) : false;

  const handleSelect = () => {
    if (!node.disabled && node.clickable && isSelectable) onSelect(node.id);
  };

  const handleCreateChild = (event) => {
    event.stopPropagation();
    if (typeof onCreateChild === "function" && canCreateChild) onCreateChild(node);
  };

  return (
    <li className={`admin-org-tree4__item ${depth > 0 ? "admin-org-tree4__item--child" : ""}`}>
      <div
        className={["admin-org-tree4__row", isSelected ? "selected" : "", node.disabled ? "disabled" : "", isMuted ? "is-muted" : ""].filter(Boolean).join(" ")}
      >
        <button
          type="button"
          className={`admin-org-tree4__toggle ${!hasChildren ? "empty" : ""}`}
          onClick={() => hasChildren && onToggle(node.id)}
          aria-label={hasChildren ? "하위 조직 열기 또는 닫기" : "말단 조직"}
        >
          {hasChildren ? (
            <span className="admin-org-tree4__toggle-symbol">{isExpanded ? "▼" : "▶"}</span>
          ) : (
            <span className="admin-org-tree4__dot" />
          )}
        </button>

        <button
          type="button"
          className="admin-org-tree4__label"
          onClick={handleSelect}
          disabled={node.disabled || !node.clickable || !isSelectable}
          title={isSelectable ? node.name : `${node.name} (선택 권한 없음)`}
        >
          <span className="admin-org-tree4__label-text">{node.name}</span>
        </button>

        {canCreateChild && !node.disabled && (
          <Button
            type="button"
            variant="coloroutGray"
            className="admin-org-tree4__add-action"
            onClick={handleCreateChild}
            title={`${node.name} 하위 조직 생성`}
            aria-label={`${node.name} 하위 조직 생성`}
          >
            +
          </Button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul className="admin-org-tree4__children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              expandedMap={expandedMap}
              onToggle={onToggle}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              getCanCreateChild={getCanCreateChild}
              getIsNodeSelectable={getIsNodeSelectable}
              getIsNodeMuted={getIsNodeMuted}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function collectExpandableIds(nodes, map = {}) {
  nodes.forEach((node) => {
    if (node.children?.length) {
      map[node.id] = true;
      collectExpandableIds(node.children, map);
    }
  });
  return map;
}

export default function AdminOrgTreeDesign4({
  tree = [], selectedNodeId, onSelectNode, onCreateChild,
  getCanCreateChild, getIsNodeSelectable, getIsNodeMuted, hideHeader = false,
}) {
  const initialExpandedMap = useMemo(() => collectExpandableIds(tree, {}), [tree]);
  const [expandedMap, setExpandedMap] = useState(initialExpandedMap);

  useEffect(() => {
    setExpandedMap(initialExpandedMap);
  }, [initialExpandedMap]);

  return (
    <div className="admin-org-tree4">
      {!hideHeader && (
        <div className="admin-panel__header admin-panel__header--tree">
          <div className="admin-panel__header-text"><h3>조직도</h3></div>
        </div>
      )}
      <ul className="admin-org-tree4__list">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            selectedNodeId={selectedNodeId}
            expandedMap={expandedMap}
            onToggle={(nodeId) => setExpandedMap((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))}
            onSelect={onSelectNode}
            onCreateChild={onCreateChild}
            getCanCreateChild={getCanCreateChild}
            getIsNodeSelectable={getIsNodeSelectable}
            getIsNodeMuted={getIsNodeMuted}
          />
        ))}
      </ul>
    </div>
  );
}
