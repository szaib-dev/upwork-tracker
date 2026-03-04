export default function StatCard({ label, value, color, sub }: any) {
  return (
    <div className="bg-[#0E1318] border border-[#1E2830] rounded-xl p-5 flex-1 min-w-[140px]">
      <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-[#2A3440] font-mono mt-1">{sub}</div>}
      <div className="text-[11px] text-[#4A5568] font-semibold uppercase tracking-wider mt-2">{label}</div>
    </div>
  );
}