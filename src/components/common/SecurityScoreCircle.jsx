import { PieChart, Pie, Cell } from "recharts";

const getColor = (score) => {
  if (score >= 71) return "#10b981";
  if (score >= 31) return "#f59e0b";
  return "#ef4444";
};

export default function SecurityScoreCircle({ score = 0, size = 48 }) {
  const color = getColor(score);
  const remainder = 100 - score;
  const data = [
    { value: score },
    { value: remainder },
  ];

  return (
    <div className="security-score-circle" style={{ width: size, height: size + 18 }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2 - 1}
          cy={size / 2 - 1}
          innerRadius={size * 0.3}
          outerRadius={size * 0.48}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={color} />
          <Cell fill="var(--border-color)" />
        </Pie>
      </PieChart>
      <span className="security-score-circle__value" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
