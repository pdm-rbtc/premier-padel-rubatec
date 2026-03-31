export default function LiveBadge({ connected }) {
  if (!connected) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      En directo
    </span>
  )
}
