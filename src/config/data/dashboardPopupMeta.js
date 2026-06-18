const UNCHECKED_CATEGORY_LABELS = {
  cce_only: "CCE 미점검 자산",
  cve_only: "CVE 미점검 자산",
  both: "CCE·CVE 모두 미점검 자산",
  all: "전체 미점검 자산",
};

export const getUncheckedCategoryLabel = (category) => {
  return UNCHECKED_CATEGORY_LABELS[category] || "미점검 자산";
};
