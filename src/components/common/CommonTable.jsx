import { useState } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

export default function CommonTable({
  columns = [],
  data = [],
  onSort,
  onRowClick,
  rowKey = "id",
  noDataMessage = "데이터가 없습니다.",
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  useDescendingIndex = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const handleSort = (key) => {
    const dir = sortConfig.key === key && sortConfig.dir === "asc" ? "desc" : "asc";
    setSortConfig({ key, dir });
    onSort?.(key, dir);
  };

  const renderCell = (col, row, rowIndex) => {
    if (col.key === "index") {
      const offset = (currentPage - 1) * pageSize;
      const idx = useDescendingIndex
        ? totalCount - offset - rowIndex
        : offset + rowIndex + 1;
      return col.render ? col.render(idx, row, rowIndex) : idx;
    }
    if (col.render) return col.render(row[col.key], row, rowIndex);
    return row[col.key] ?? "-";
  };

  return (
    <div className="common-table-wrapper">
      <table className="common-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? "sortable" : ""}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="th-content">
                  {col.label}
                  {col.sortable && sortConfig.key === col.key && (
                    <span className="sort-icon">
                      {sortConfig.dir === "asc" ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="no-data">
                {noDataMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const key = row[rowKey] ?? rowIndex;
              return (
                <tr
                  key={key}
                  className={onRowClick ? "clickable" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        col.align ? `text-${col.align}` : "",
                        col.ellipsis ? "ellipsis" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      {renderCell(col, row, rowIndex)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
