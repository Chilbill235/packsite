// components/Balance.tsx
export default function Balance({ amount, className = "" }: { amount?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 ${className}`}>
      <span className="text-amber-500 font-bold font-mono">{(amount ?? 0).toLocaleString()}</span>
      <span className="text-xs text-amber-500/70 uppercase">Coins</span>
    </div>
  );
}