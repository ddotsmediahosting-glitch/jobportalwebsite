const PRIORITY_COLORS = {
  high: 'text-red-500 bg-red-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50',
}
const PRIORITY_LABELS = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' }

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date()

  return (
    <div className={`bg-white rounded-xl border p-4 flex gap-3 group transition ${task.completed ? 'opacity-60' : 'border-gray-200'} ${isOverdue ? 'border-red-200' : ''}`}>
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 transition flex items-center justify-center ${
          task.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {task.completed && <span className="text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-800 ${task.completed ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.due_date && (
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              📅 {new Date(task.due_date).toLocaleDateString()}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
