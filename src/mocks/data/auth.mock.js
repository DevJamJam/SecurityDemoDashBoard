export const DEMO_ACCOUNTS = [
  {
    user_email: "admin@sedo.dev",
    user_pw: "Admin1234!",
    user_index: "usr-001",
    user_name: "관리자",
    value: 1,
    can_create_root: true,
    is_dept_leader: false,
    my_dept_id: ["dept-001"],
    manageable_dept_ids: ["dept-001", "dept-002", "dept-003", "dept-004"],
    user_bookmark: JSON.stringify({ CCE: [], CVE: [], COMMAND: [], DASHBOARD: [], ASSET: [] }),
  },
  {
    user_email: "user@sedo.dev",
    user_pw: "User1234!",
    user_index: "usr-002",
    user_name: "홍길동",
    value: 2,
    can_create_root: false,
    is_dept_leader: true,
    my_dept_id: ["dept-002"],
    manageable_dept_ids: ["dept-002"],
    user_bookmark: JSON.stringify({ CCE: [], CVE: [], COMMAND: [], DASHBOARD: [], ASSET: [] }),
  },
];

export const mockUser = DEMO_ACCOUNTS[0];
