import Button from "./Button";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

export default function SearchMenu({ items = [], values = {}, onChange, onSearch, onReset }) {
  const handleChange = (key, value) => {
    onChange?.({ ...values, [key]: value });
  };

  return (
    <div className="search-menu">
      <div className="search-menu__grid">
        {items.map((item) => {
          if (item.type === "input") {
            return (
              <div key={item.key} className="search-menu__field">
                {item.label && (
                  <label className="search-menu__label">{item.label}</label>
                )}
                <input
                  className="search-menu__input"
                  type="text"
                  placeholder={item.placeholder || ""}
                  value={values[item.key] || ""}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                />
              </div>
            );
          }
          if (item.type === "select") {
            return (
              <div key={item.key} className="search-menu__field">
                {item.label && (
                  <label className="search-menu__label">{item.label}</label>
                )}
                <select
                  className="search-menu__select"
                  value={values[item.key] || ""}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                >
                  <option value="">{item.placeholder || "전체"}</option>
                  {(item.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          return null;
        })}
        <div className="search-menu__actions">
          <Button variant="primary" size="sm" icon={<FiSearch />} onClick={onSearch}>
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
