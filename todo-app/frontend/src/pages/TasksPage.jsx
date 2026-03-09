import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import StatsBar from '../components/StatsBar'

export default function TasksPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 })
  const [filter, setFilter] = useState('all')
  const [priority, setPriority] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const params = {}
      if (filter !== 'all') params.filter = filter
      if (priority) params.priority = priority
      const [tasksRes, statsRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/tasks/stats')
      ])
      setTasks(tasksRes.data)
      setStats(statsRes.data)
    } catch (err) {
      if (err.response?.status === 401) { logout(); navigate('/login') }
    } finally {
      setLoading(false)
    }
  }, [filter, priority, logout, navigate])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleToggle(task) {
    await api.patch(`/tasks/${task.id}`, { completed: !task.completed })
    fetchTasks()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${id}`)
    fetchTasks()
  }

  function handleEdit(task) {
    setEditTask(task)
    setShowForm(true)
  }

  const filterBtns = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span className="font-bold text-gray-800 text-lg">TodoApp</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">👋 {user?.name}</span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 pt-6">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Header */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
          <button
            onClick={() => { setEditTask(null); setShowForm(true) }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-1"
          >
            <span>+</span> Add Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterBtns.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === btn.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-600 focus:outline-none focus:border-indigo-300"
          >
            <option value="">All priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>

        {/* Task Form Modal */}
        {showForm && (
          <TaskForm
            task={editTask}
            onSave={() => { setShowForm(false); setEditTask(null); fetchTasks() }}
            onClose={() => { setShowForm(false); setEditTask(null) }}
          />
        )}

        {/* Task List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500 font-medium">No tasks found</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Task" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
