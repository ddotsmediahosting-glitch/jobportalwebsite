export default function StatsBar({ stats }) {
  const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm text-gray-500">{percent}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-indigo-600">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Done</p>
        </div>
      </div>
    </div>
  )
}
