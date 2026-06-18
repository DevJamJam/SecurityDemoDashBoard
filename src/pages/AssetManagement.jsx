import { useEffect, useState } from "react";
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
      { value: "server", label: "서버" },
      { value: "db_server", label: "DB 서버" },
      { value: "network_device", label: "네트워크 장비" },
      { value: "cloud_instance", label: "클라우드 인스턴스" },
      { value: "pc", label: "PC" },
    ],
  },
  {
    key: "status",
    type: "select",
    label: "상태",
    placeholder: "전체",
    options: [
      { value: "active", label: "활성" },
      { value: "inactive", label: "비활성" },
    ],
  },
];

const TYPE_LABELS = {
  server: "서버",
  db_server: "DB 서버",
  network_device: "네트워크 장비",
  cloud_instance: "클라우드 인스턴스",
  pc: "PC",
};

const COLUMNS = [
  { key: "index", label: "No.", width: "60px", align: "center" },
  { key: "name", label: "자산명", ellipsis: true },
  { key: "ipAddress", label: "IP 주소", width: "140px" },
  {
    key: "type",
    label: "유형",
    width: "130px",
    align: "center",
    render: (v) => TYPE_LABELS[v] ?? v,
  },
  { key: "os", label: "OS", width: "130px" },
  { key: "location", label: "위치", width: "130px" },
  {
    key: "status",
    label: "상태",
    width: "80px",
    align: "center",
    render: (v) => <StatusBadge status={v} />,
  },
  { key: "lastScannedAt", label: "최근 점검", width: "120px", align: "center" },
];

const PAGE_SIZE = 10;

export default function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    getAssets()
      .then((res) => {
        const items = res.data.items || [];
        setAssets(items);
        setFiltered(items);
      })
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = (f) => {
    let result = assets;
    if (f.name) result = result.filter((a) => a.name.includes(f.name));
    if (f.type) result = result.filter((a) => a.type === f.type);
    if (f.status) result = result.filter((a) => a.status === f.status);
    setFiltered(result);
    setPage(1);
  };

  const handleSearch = () => applyFilters(filters);
  const handleReset = () => { setFilters({}); applyFilters({}); };

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-content">
      <PageHeader
        breadcrumb="인프라 관리"
        title="Assets"
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
      ) : (
        <>
          <CommonTable
            columns={COLUMNS}
            data={pageData}
            totalCount={filtered.length}
            currentPage={page}
            pageSize={PAGE_SIZE}
            noDataMessage="조회된 자산이 없습니다."
          />
          <Pagination
            currentPage={page}
            totalCount={filtered.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
