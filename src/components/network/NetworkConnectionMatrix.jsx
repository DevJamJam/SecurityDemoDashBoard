import { useMemo, useState } from "react";
import "./NetworkConnectionMatrix.css";

const CELL_STATUS = {
  allow:   { cls: "matrix-cell--allow",   label: "허용" },
  partial: { cls: "matrix-cell--partial", label: "일부" },
  block:   { cls: "matrix-cell--block",   label: "차단" },
  alert:   { cls: "matrix-cell--alert",   label: "경보" },
  none:    { cls: "matrix-cell--none",    label: "-"    },
};

function getCellStatus(conn) {
  if (!conn) return "none";
  if (conn.hasAlert) return "alert";
  if (conn.counts.allow === conn.counts.total) return "allow";
  if (conn.counts.allow === 0) return "block";
  return "partial";
}

export default function NetworkConnectionMatrix({ segments = [], connections = [] }) {
  const [hoverRow, setHoverRow] = useState(null);
  const [hoverCol, setHoverCol] = useState(null);

  // 등장하는 모든 망 이름 수집 (세그먼트 + 연결에 쓰인 이름 모두 포함)
  const names = useMemo(() => {
    const set = new Set([
      ...segments.map((s) => s.name),
      ...connections.flatMap((c) => [c.src, c.dst]),
    ]);
    return [...set];
  }, [segments, connections]);

  // 빠른 조회용 맵: connMap[src][dst] = connection
  const connMap = useMemo(() => {
    const map = {};
    for (const c of connections) {
      if (!map[c.src]) map[c.src] = {};
      map[c.src][c.dst] = c;
    }
    return map;
  }, [connections]);

  // 세그먼트명 → 한글명 조회
  const nameKoMap = useMemo(() => {
    const m = {};
    for (const s of segments) m[s.name] = s.nameKo || s.name;
    return m;
  }, [segments]);

  const isEmpty = connections.length === 0;

  if (isEmpty) {
    return (
      <div className="matrix-empty">
        <p>연결 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="matrix-wrap">
      <div className="matrix-legend">
        {Object.entries(CELL_STATUS).filter(([k]) => k !== "none").map(([key, v]) => (
          <span key={key} className={`matrix-legend__item ${v.cls}`}>{v.label}</span>
        ))}
        <span className="matrix-legend__hint">행 = 출발 망 · 열 = 도착 망 · 셀 = 허용/전체 건수</span>
      </div>

      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-th matrix-th--corner">출발 ＼ 도착</th>
              {names.map((dst) => (
                <th
                  key={dst}
                  className={`matrix-th${hoverCol === dst ? " is-highlight" : ""}`}
                  onMouseEnter={() => setHoverCol(dst)}
                  onMouseLeave={() => setHoverCol(null)}
                >
                  <span className="matrix-th__ko">{nameKoMap[dst] || dst}</span>
                  <span className="matrix-th__en">{dst}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((src) => (
              <tr
                key={src}
                className={hoverRow === src ? "is-highlight" : ""}
                onMouseEnter={() => setHoverRow(src)}
                onMouseLeave={() => setHoverRow(null)}
              >
                <th className="matrix-row-header">
                  <span className="matrix-th__ko">{nameKoMap[src] || src}</span>
                  <span className="matrix-th__en">{src}</span>
                </th>
                {names.map((dst) => {
                  if (src === dst) {
                    return <td key={dst} className="matrix-cell matrix-cell--self">—</td>;
                  }
                  const conn = connMap[src]?.[dst];
                  const status = getCellStatus(conn);
                  const { cls } = CELL_STATUS[status];
                  const isHovered = hoverRow === src || hoverCol === dst;
                  return (
                    <td
                      key={dst}
                      className={`matrix-cell ${cls}${isHovered ? " is-hover" : ""}`}
                      title={conn ? `${src} → ${dst}: 허용 ${conn.counts.allow}/${conn.counts.total}건${conn.hasAlert ? " ⚠ 갑자기 열린 통신" : ""}` : `${src} → ${dst}: 연결 없음`}
                    >
                      {conn
                        ? <><strong>{conn.counts.allow}</strong><span>/{conn.counts.total}</span></>
                        : <span className="matrix-cell__dash">-</span>
                      }
                      {conn?.hasAlert && <span className="matrix-cell__alert-dot" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
