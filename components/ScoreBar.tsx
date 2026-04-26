interface Props {
  score: number;
  label?: string;
}

export default function ScoreBar({ score, label = "คะแนนรวม" }: Props) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[12px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink">{Math.round(pct)} / 100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
