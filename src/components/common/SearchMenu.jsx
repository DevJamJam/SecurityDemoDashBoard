import Button from "./Button";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

// onSearch(values) — 현재 values를 인자로 전달해 stale closure 방지
// select 변경 시 즉시 검색 (select → onChange + onSearch)
// input Enter 또는 조회 버튼 클릭 시 검색
export default function SearchMenu({ items = [], values = {}, onChange, onSearch, onReset }) {
  const handleInputChange = (key, value) => {
    onChange?.({ ...values, [key]: value });
  };

  const handleSelectChange = (key, value) => {
    const newValues = { ...values, [key]: value };
    onChange?.(newValues);
    onSearch?.(newValues); // select는 선택 즉시 검색
  };

  return (
    <div className="search-menu">
      <div className="search-menu__grid">
        {items.map((item) => {
          if (item.type === "input") {
            return (
              <div key={item.key} className="search-menu__field">
                {item.label && <label className="search-menu__label">{item.label}</label>}
                <input
                  className="search-menu__input"
                  type="text"
                  placeholder={item.placeholder || ""}
                  value={values[item.key] || ""}
                  onChange={(e) => handleInputChange(item.key, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch?.(values)}
                />
              </div>
            );
          }
          if (item.type === "select") {
            return (
              <div key={item.key} className="search-menu__field">
                {item.label && <label className="search-menu__label">{item.label}</label>}
                <select
                  className="search-menu__select"
                  value={values[item.key] || ""}
                  onChange={(e) => handleSelectChange(item.key, e.target.value)}
                >
                  <option value="">{item.placeholder || "전체"}</option>
                  {(item.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          }
          return null;
        })}
        <div className="search-menu__actions">
          <Button variant="primary" size="sm" icon={<FiSearch />} onClick={() => onSearch?.(values)}>
            조회
          </Button>
          <Button variant="outline" size="sm" icon={<FiRefreshCw />} onClick={onReset}>
            초기화
          </Button>
        </div>
      </div>
    </div>
  );
}
