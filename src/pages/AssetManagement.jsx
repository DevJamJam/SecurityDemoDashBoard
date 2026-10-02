import { useEffect, useState } from "react";
import { FiX, FiServer } from "react-icons/fi";
import { getAssets } from "@/api/securityDemoApi";
import PageHeader from "@/components/layout/PageHeader";
import SearchMenu from "@/components/common/SearchMenu";
import CommonTable from "@/components/common/CommonTable";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";

const SEARCH_ITEMS = [
  { key: "name", type: "input", label: "자산명", placeholder: "자산명 검색" },
  {
    key: "type",
    type: "select",
    label: "유형",
    placeholder: "전체",
    options: [
      { value: "server",          label: "서버" },
      { value: "db_server",       label: "DB 서버" },
      { value: "network_device",  label: "네트워크 장비" },
      { value: "cloud_instance",  label: "클라우드 인스턴스" },
      { value: "pc",              label: "PC" },
    ],
  },
  {
    key: "status",
    type: "select",
    label: "상태",
    placeholder: "전체",
    options: [
      { value: "active",   label: "활성" },
      { value: "inactive", label: "비활성" },
    ],
  },
];

const TYPE_LABELS = {
  server:          "서버",
  db_server:       "DB 서버",
  network_device:  "네트워크 장비",
  cloud_instance:  "클라우드 인스턴스",
  pc:              "PC",
};

const COLUMNS = [
  { key: "index",        label: "No.",      width: "60px",  align: "center" },
  { key: "name",         label: "자산명",    ellipsis: true },
  { key: "ipAddress",    label: "IP 주소",   width: "140px" },
  { key: "type",         label: "유형",      width: "130px", align: "center", render: (v) => TYPE_LABELS[v] ?? v },
  { key: "os",           label: "OS",        width: "130px" },
  { key: "location",     label: "위치",      width: "130px" },
  { key: "status",       label: "상태",      width: "80px",  align: "center", render: (v) => <StatusBadge status={v} /> },
  { key: "lastScannedAt",label: "최근 점검", width: "120px", align: "center" },
];

const PAGE_SIZE = 10;

function AssetDetailModal({ asset, onClose }) {
  if (!asset) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiServer style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
            <h3 className="modal__title">{asset.name}</h3>
          </div>
          <button type="button" className="modal__close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal__body">
          <dl className="info-list">
            <div className="info-list__row"><dt>IP 주소</dt>    <dd><code>{asset.ipAddress}</code></dd></div>
            <div className="info-list__row"><dt>유형</dt>        <dd>{TYPE_LABELS[asset.type] ?? asset.type}</dd></div>
            <div className="info-list__row"><dt>OS</dt>          <dd>{asset.os || "–"}</dd></div>
            <div className="info-list__row"><dt>위치</dt>        <dd>{asset.location || "–"}</dd></div>
            <div className="info-list__row"><dt>상태</dt>        <dd><StatusBadge status={asset.status} /></dd></div>
            <div className="info-list__row"><dt>최근 점검</dt>  <dd>{asset.lastScannedAt || "–"}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default function AssetManagement() {
  const [assets,   setAssets]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filters,  setFilters]  = useState({});
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAssets()
      .then((res) => {
        const items = res.data.items || [];
        setAssets(items);
        setFiltered(items);
      })
      .catch(() => setError("자산 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = (f) => {
    let result = assets;
    if (f.name)   result = result.filter((a) => a.name.includes(f.name));
    if (f.type)   result = result.filter((a) => a.type === f.type);
    if (f.status) result = result.filter((a) => a.status === f.status);
    setFiltered(result);
    setPage(1);
  };

  const handleSearch = (f = filters) => applyFilters(f);
  const handleReset  = () => { setFilters({}); applyFilters({}); };

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-content">
      <PageHeader
        title="자산 관리"
        description="관리 자산 목록 및 현황"
      />

      <SearchMenu
        items={SEARCH_ITEMS}
        values={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {loading ? (
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p className="empty-state__message" style={{ color: "var(--status-danger)" }}>{error}</p>
        </div>
      ) : (
        <>
          <CommonTable
            columns={COLUMNS}
            data={pageData}
            totalCount={filtered.length}
            currentPage={page}
            pageSize={PAGE_SIZE}
            noDataMessage="조회된 자산이 없습니다."
            onRowClick={(row) => setSelected(row)}
          />
          <Pagination
            currentPage={page}
            totalCount={filtered.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}

      <AssetDetailModal asset={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
