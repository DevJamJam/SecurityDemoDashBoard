import { FiChevronsLeft, FiChevronsRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({ currentPage, totalCount, pageSize = 10, onChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        onClick={() => onChange(1)}
        disabled={currentPage === 1}
        title="처음"
      >
        <FiChevronsLeft />
      </button>
      <button
        className="pagination__btn"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="이전"
      >
        <FiChevronLeft />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className={`pagination__btn${page === currentPage ? " active" : ""}`}
          onClick={() => onChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className="pagination__btn"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="다음"
      >
        <FiChevronRight />
      </button>
      <button
        className="pagination__btn"
        onClick={() => onChange(totalPages)}
        disabled={currentPage === totalPages}
        title="마지막"
      >
        <FiChevronsRight />
      </button>
    </div>
  );
}
