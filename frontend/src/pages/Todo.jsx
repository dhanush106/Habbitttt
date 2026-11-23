import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  CheckCheck,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getWeekStart, toDateKey } from '../lib/dates';
import { useAuthStore } from '../stores/authStore';
import { useTodoStore } from '../stores/todoStore';
import './Todo.css';

const categories = ['Study', 'Coding', 'Health', 'Personal', 'Work', 'Project', 'Other', 'Fitness', 'Development', 'DSA', 'DBMS', 'GATE', 'Break', 'Planning'];
const priorities = ['High', 'Medium', 'Low'];
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const fullDateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const atNoon = (key) => new Date(`${key}T12:00:00`);
const getMonthRange = (date) => ({
  start: toDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
  end: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
});
const getCalendarDays = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(date.getFullYear(), date.getMonth(), 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(day.getDate() + index);
    return day;
  });
};
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'H';

function TodoModal({ task, date, pending, error, onClose, onSubmit }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="todo-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.section
        className="todo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-modal-title"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
      >
        <header className="todo-modal-header">
          <div>
            <p className="todo-overline">{task ? 'TASK DETAILS' : 'NEW TASK'}</p>
            <h2 id="todo-modal-title">{task ? 'Edit task' : 'Create a task'}</h2>
          </div>
          <button className="todo-quiet-icon" type="button" onClick={onClose} aria-label="Close dialog"><X size={17} /></button>
        </header>
        <form className="todo-form" onSubmit={onSubmit}>
          <label className="todo-field todo-field-wide">Task name
            <input autoFocus defaultValue={task?.title || ''} maxLength="140" name="title" placeholder="What needs your attention?" required />
          </label>
          <label className="todo-field todo-field-wide">Description <span className="todo-optional">Optional</span>
            <textarea defaultValue={task?.notes || ''} maxLength="1000" name="notes" placeholder="Add a little context" rows="3" />
          </label>
          <label className="todo-field">Category
            <select defaultValue={task?.category || 'Study'} name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select>
          </label>
          <label className="todo-field">Priority
            <select defaultValue={task?.priority || 'Medium'} name="priority">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
          </label>
          <label className="todo-field">Date
            <input defaultValue={task?.date || date} name="date" required type="date" />
          </label>
          <label className="todo-field">Due time
            <input defaultValue={task?.startTime || '09:00'} name="startTime" required type="time" />
          </label>
          <label className="todo-field">Duration
            <select defaultValue={task?.durationMinutes || 60} name="durationMinutes">
              {[15, 30, 45, 60, 90, 120, 180].map((minutes) => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}
            </select>
          </label>
          {error && <p className="todo-inline-error" role="alert">{error}</p>}
          <div className="todo-form-actions">
            <button className="todo-secondary-button" onClick={onClose} type="button">Cancel</button>
            <button className="todo-primary-button" disabled={pending} type="submit"><Check size={15} />{pending ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}

function Todo() {
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [editingTask, setEditingTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const tasks = useTodoStore((state) => state.tasks);
  const dailyGoals = useTodoStore((state) => state.dailyGoals);
  const summary = useTodoStore((state) => state.summary);
  const metrics = useTodoStore((state) => state.metrics);
  const activity = useTodoStore((state) => state.activity);
  const loading = useTodoStore((state) => state.loading);
  const error = useTodoStore((state) => state.error);
  const loadDashboard = useTodoStore((state) => state.loadDashboard);
  const clearError = useTodoStore((state) => state.clearError);
  const createTask = useTodoStore((state) => state.createTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  const createDailyGoal = useTodoStore((state) => state.createDailyGoal);
  const updateDailyGoal = useTodoStore((state) => state.updateDailyGoal);
  const deleteDailyGoal = useTodoStore((state) => state.deleteDailyGoal);

  const selectedDateObject = atNoon(selectedDate);
  const todayKey = toDateKey(new Date());
  const monthRange = getMonthRange(selectedDateObject);
  const monthLabel = monthFormatter.format(selectedDateObject);
  const calendarDays = getCalendarDays(selectedDateObject);
  const selectedTasks = useMemo(() => tasks
    .filter((task) => task.date === selectedDate)
    .filter((task) => categoryFilter === 'All categories' || task.category === categoryFilter)
    .filter((task) => priorityFilter === 'All priorities' || task.priority === priorityFilter)
    .filter((task) => {
      const term = search.trim().toLowerCase();
      return !term || `${task.title} ${task.notes} ${task.category} ${(task.tags || []).join(' ')}`.toLowerCase().includes(term);
    }), [categoryFilter, priorityFilter, search, selectedDate, tasks]);
  const totalGoals = dailyGoals.length;
  const completedGoals = dailyGoals.filter((goal) => goal.completed).length;
  const completedTasks = summary.completedTasks || 0;
  const totalTasks = summary.totalTasks || 0;
  const pendingTasks = summary.pendingTasks || 0;
  const productivityPercent = summary.productivityPercent || 0;
  const weeklyPercent = metrics?.weekly?.percentage || 0;
  const productiveDays = metrics?.monthly?.productiveDays || 0;
  const daysInMonth = metrics?.monthly?.goalDays || new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth() + 1, 0).getDate();
  const currentStreak = metrics?.currentStreak || 0;

  useEffect(() => {
    loadDashboard(monthRange.start, monthRange.end, selectedDate).catch(() => {});
  }, [loadDashboard, monthRange.end, monthRange.start, selectedDate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const runAction = async (action, successMessage) => {
    setPending(true);
    setActionError('');
    clearError();
    try {
      await action();
      if (successMessage) setToast(successMessage);
      return true;
    } catch (actionErrorValue) {
      setActionError(actionErrorValue.message);
      return false;
    } finally {
      setPending(false);
    }
  };

  const changeDate = (amount) => {
    const next = atNoon(selectedDate);
    next.setDate(next.getDate() + amount);
    setSelectedDate(toDateKey(next));
  };

  const changeMonth = (amount) => {
    const next = new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth() + amount, 1);
    setSelectedDate(toDateKey(next));
  };

  const openCreate = () => {
    setEditingTask(null);
    setActionError('');
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setActionError('');
    setModalOpen(true);
  };

  const submitTask = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      title: form.get('title'),
      notes: form.get('notes'),
      date: form.get('date'),
      startTime: form.get('startTime'),
      durationMinutes: Number(form.get('durationMinutes')),
      category: form.get('category'),
      priority: form.get('priority'),
      tags: editingTask?.tags || [],
    };
    const ok = await runAction(
      () => editingTask ? updateTask(editingTask._id, values) : createTask(values),
      editingTask ? 'Task updated' : 'Task created',
    );
    if (ok) setModalOpen(false);
  };

  const quickAdd = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    const ok = await runAction(() => createTask({
      title,
      notes: '',
      date: selectedDate,
      startTime: form.get('startTime'),
      durationMinutes: Number(form.get('durationMinutes')),
      category: form.get('category'),
      priority: form.get('priority'),
      tags: [],
    }), 'Task added to your day');
    if (ok) event.currentTarget.reset();
  };

  const toggleTask = (task) => runAction(
    () => updateTask(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' }),
    task.status === 'completed' ? 'Task marked as pending' : 'Task completed',
  );

  const deleteTaskAction = (task) => runAction(
    () => deleteTask(task._id),
    'Task deleted',
  );

  const addGoal = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    if (await runAction(() => createDailyGoal({ title, date: selectedDate }), 'Daily goal added')) event.currentTarget.reset();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const progressLabel = productivityPercent === 100 ? 'Everything checked off' : `${pendingTasks} ${pendingTasks === 1 ? 'task' : 'tasks'} left to go`;

  return (
    <div className="todo-app">
      <aside className="todo-nav">
        <Link className="todo-brand" to="/tracker" aria-label="Habbittt dashboard">
          <span className="todo-brand-mark"><Check size={18} strokeWidth={3} /></span>
          <span>Habbittt<small>YOUR DAILY SPACE</small></span>
        </Link>
        <p className="todo-nav-label">WORKSPACE</p>
        <nav className="todo-nav-links" aria-label="Workspace navigation">
          <Link className="todo-nav-link" to="/tracker"><LayoutDashboard size={17} />Dashboard</Link>
          <Link className="todo-nav-link active" aria-current="page" to="/todo"><CheckSquare size={17} />Daily Todo</Link>
          <Link className="todo-nav-link" to="/tracker"><CheckCheck size={17} />Habits</Link>
          <span className="todo-nav-link unavailable" aria-disabled="true" title="Analytics is coming soon"><ChartNoAxesColumn size={17} />Analytics</span>
          <span className="todo-nav-link unavailable" aria-disabled="true" title="Goals is coming soon"><Target size={17} />Goals</span>
          <span className="todo-nav-link unavailable" aria-disabled="true" title="Settings is coming soon"><Settings size={17} />Settings</span>
        </nav>
        <div className="todo-nav-bottom">
          <div className="todo-profile">
            <span className="todo-profile-avatar">{initials(user?.name)}</span>
            <span className="todo-profile-name">{user?.name || 'Your account'}<small>Personal workspace</small></span>
            <button className="todo-quiet-icon" type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="todo-workspace">
        <header className="todo-page-header">
          <div className="todo-title-block">
            <span className="todo-page-icon"><ListTodo size={18} /></span>
            <div><h1>Daily Todo</h1><p>Plan <span>·</span> Do <span>·</span> Track <span>·</span> Grow</p></div>
          </div>
          <div className="todo-date-controls">
            <button className="todo-quiet-icon" onClick={() => changeDate(-1)} type="button" aria-label="Previous day"><ArrowLeft size={16} /></button>
            <span className="todo-date-label">{dateFormatter.format(selectedDateObject)}</span>
            <button className="todo-quiet-icon" onClick={() => changeDate(1)} type="button" aria-label="Next day"><ArrowRight size={16} /></button>
            <button className={`todo-today-button${selectedDate === todayKey ? ' is-today' : ''}`} onClick={() => setSelectedDate(todayKey)} type="button">Today</button>
          </div>
        </header>

        <AnimatePresence>
          {(error || actionError) && (
            <motion.div className="todo-error-banner" role="alert" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span>{actionError || error}</span>
              <button type="button" onClick={() => { setActionError(''); clearError(); }} aria-label="Dismiss error"><X size={15} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="todo-content-grid">
          <section className="todo-primary-column">
            <section className="todo-card todo-task-panel">
              <header className="todo-section-header">
                <div>
                  <p className="todo-overline">{selectedDate === todayKey ? 'YOUR FOCUS FOR TODAY' : weekdayFormatter.format(selectedDateObject).toUpperCase()}</p>
                  <h2>{selectedDate === todayKey ? 'Today’s tasks' : `${weekdayFormatter.format(selectedDateObject)}’s tasks`} <span className="todo-count-pill">{summary.totalTasks || 0}</span></h2>
                </div>
                <button className="todo-primary-button" onClick={openCreate} type="button"><Plus size={16} /> New task</button>
              </header>

              <div className="todo-toolbar">
                <label className="todo-search"><Search size={16} /><input aria-label="Search daily tasks" onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." value={search} /><kbd>⌘ K</kbd></label>
                <label className="todo-select-wrap"><span className="sr-only">Filter by category</span><select aria-label="Filter by category" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="todo-select-wrap"><span className="sr-only">Filter by priority</span><select aria-label="Filter by priority" onChange={(event) => setPriorityFilter(event.target.value)} value={priorityFilter}><option>All priorities</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              </div>

              <div className="todo-table-wrap">
                <table className="todo-table">
                  <thead><tr><th className="todo-check-column"><span className="sr-only">Complete</span></th><th>Task</th><th>Category</th><th>Priority</th><th>Status</th><th className="todo-action-column">Actions</th></tr></thead>
                  <tbody>
                    {loading && !tasks.length && <tr><td className="todo-table-message" colSpan="6"><span className="todo-spinner" /> Loading your tasks…</td></tr>}
                    {!loading && selectedTasks.length === 0 && (
                      <tr><td className="todo-table-message" colSpan="6">
                        <div className="todo-empty-state"><span><CalendarDays size={20} /></span><strong>{totalTasks ? 'No matching tasks' : 'A clear day starts here'}</strong><p>{totalTasks ? 'Try another search or filter.' : 'Make some space for what matters.'}</p>{!totalTasks && <button className="todo-text-button" type="button" onClick={openCreate}><Plus size={14} /> Create your first task</button>}</div>
                      </td></tr>
                    )}
                    {selectedTasks.map((task) => (
                      <tr className={task.status === 'completed' ? 'is-completed' : ''} key={task._id}>
                        <td className="todo-check-column"><button className={`todo-task-checkbox${task.status === 'completed' ? ' checked' : ''}`} type="button" role="checkbox" aria-checked={task.status === 'completed'} aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} ${task.title}`} disabled={pending} onClick={() => void toggleTask(task)}>{task.status === 'completed' && <Check size={13} />}</button></td>
                        <td className="todo-task-name"><strong>{task.title}</strong>{task.notes && <small>{task.notes}</small>}<span className="todo-task-time"><Clock3 size={12} />{task.startTime}{task.durationMinutes ? ` · ${formatDuration(task.durationMinutes)}` : ''}</span></td>
                        <td><span className={`todo-category-chip category-${task.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{task.category}</span></td>
                        <td><span className={`todo-priority priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span></td>
                        <td><span className={`todo-status status-${task.status === 'completed' ? 'completed' : 'pending'}`}>{task.status === 'completed' ? 'Completed' : 'Pending'}</span></td>
                        <td className="todo-row-actions"><button className="todo-quiet-icon" type="button" aria-label={`Edit ${task.title}`} title="Edit task" onClick={() => openEdit(task)}><Pencil size={14} /></button><button className="todo-quiet-icon delete-action" type="button" aria-label={`Delete ${task.title}`} title="Delete task" disabled={pending} onClick={() => void deleteTaskAction(task)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form className="todo-quick-add" onSubmit={quickAdd}>
                <span className="todo-quick-add-icon"><Plus size={17} /></span>
                <input aria-label="New task title" maxLength="140" name="title" placeholder="Add a task to your day..." required />
                <select aria-label="New task category" defaultValue="Study" name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select>
                <select aria-label="New task priority" defaultValue="Medium" name="priority">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
                <input aria-label="New task due time" defaultValue="09:00" name="startTime" type="time" />
                <input aria-label="New task duration in minutes" defaultValue="60" max="1440" min="1" name="durationMinutes" type="number" />
                <button className="todo-primary-button" disabled={pending} type="submit">Add task <ArrowRight size={14} /></button>
              </form>
              <p className="todo-quick-hint">Press the button to add your task. You can edit all details any time.</p>
            </section>

            <section className="todo-summary-grid" aria-label="Productivity summary">
              <article className="todo-card todo-summary-card">
                <span className="todo-summary-icon purple"><CheckSquare size={17} /></span><span className="todo-summary-label">Tasks this day</span>
                <strong>{completedTasks}<small> / {totalTasks}</small></strong>
                <div className="todo-summary-progress"><i style={{ width: `${productivityPercent}%` }} /></div>
                <p>{progressLabel}</p>
              </article>
              <article className="todo-card todo-summary-card">
                <span className="todo-summary-icon orange"><Flame size={17} /></span><span className="todo-summary-label">Current streak</span>
                <strong>{currentStreak}<small> {currentStreak === 1 ? 'day' : 'days'}</small></strong><p>Consecutive productive days</p>
              </article>
              <article className="todo-card todo-summary-card">
                <span className="todo-summary-icon blue"><ChartNoAxesColumn size={17} /></span><span className="todo-summary-label">Weekly progress</span>
                <strong>{weeklyPercent}<small>%</small></strong>
                <div className="todo-summary-progress"><i style={{ width: `${weeklyPercent}%` }} /></div>
                <p>Tasks completed this week</p>
              </article>
              <article className="todo-card todo-summary-card">
                <span className="todo-summary-icon green"><Target size={17} /></span><span className="todo-summary-label">Monthly goal</span>
                <strong>{productiveDays}<small> / {daysInMonth} days</small></strong>
                <div className="todo-summary-progress"><i style={{ width: `${daysInMonth ? Math.min(100, (productiveDays / daysInMonth) * 100) : 0}%` }} /></div>
                <p>Days with a completed task</p>
              </article>
            </section>

            <section className="todo-card todo-goals-panel">
              <header className="todo-section-header">
                <div><p className="todo-overline">ONE STEP AT A TIME</p><h2>Daily goals <span className="todo-count-pill">{completedGoals}/{totalGoals}</span></h2></div>
                <span className="todo-goal-percent">{totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0}% complete</span>
              </header>
              <form className="todo-goal-add" onSubmit={addGoal}><input aria-label="New daily goal" maxLength="140" name="title" placeholder="Add a small goal for the day..." required /><button className="todo-quiet-icon" type="submit" disabled={pending} aria-label="Add daily goal"><Plus size={17} /></button></form>
              <div className="todo-goal-list">
                {dailyGoals.map((goal) => <div className={`todo-goal-row${goal.completed ? ' is-completed' : ''}`} key={goal._id}><button className={`todo-task-checkbox${goal.completed ? ' checked' : ''}`} type="button" role="checkbox" aria-checked={goal.completed} aria-label={`${goal.completed ? 'Reopen' : 'Complete'} ${goal.title}`} disabled={pending} onClick={() => void runAction(() => updateDailyGoal(goal._id, !goal.completed), goal.completed ? 'Daily goal reopened' : 'Daily goal completed')}>{goal.completed && <Check size={13} />}</button><span>{goal.title}</span><button className="todo-quiet-icon delete-action" type="button" title="Delete goal" aria-label={`Delete ${goal.title}`} disabled={pending} onClick={() => void runAction(() => deleteDailyGoal(goal._id), 'Daily goal deleted')}><Trash2 size={14} /></button></div>)}
                {!totalGoals && <p className="todo-goals-empty"><Circle size={14} />Your important goals for this day will appear here.</p>}
              </div>
            </section>
          </section>

          <aside className="todo-right-column">
            <section className="todo-card todo-calendar-panel">
              <header className="todo-calendar-heading"><div><p className="todo-overline">YOUR SCHEDULE</p><h2>{monthLabel}</h2></div><div className="todo-calendar-controls"><button className="todo-quiet-icon" onClick={() => changeMonth(-1)} type="button" aria-label="Previous month"><ChevronLeft size={16} /></button><button className="todo-quiet-icon" onClick={() => changeMonth(1)} type="button" aria-label="Next month"><ChevronRight size={16} /></button></div></header>
              <div className="todo-calendar-grid" role="grid" aria-label={monthLabel}>
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span className="todo-weekday" key={day} role="columnheader">{day}</span>)}
                {calendarDays.map((day) => {
                  const key = toDateKey(day);
                  const dayActivity = activity.find((item) => item.date === key);
                  const hasPending = dayActivity?.pending > 0;
                  const hasCompleted = dayActivity?.completed > 0;
                  const isSelected = key === selectedDate;
                  const isToday = key === todayKey;
                  return (
                    <button
                      className={`todo-calendar-day${day.getMonth() !== selectedDateObject.getMonth() ? ' outside' : ''}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                      key={key}
                      type="button"
                      role="gridcell"
                      aria-current={isToday ? 'date' : undefined}
                      aria-pressed={isSelected}
                      aria-label={`${fullDateFormatter.format(day)}${dayActivity ? `, ${dayActivity.tasks} ${dayActivity.tasks === 1 ? 'task' : 'tasks'}` : ''}`}
                      onClick={() => setSelectedDate(key)}
                    >
                      <span>{day.getDate()}</span>
                      {(hasPending || hasCompleted) && <i className={`todo-day-indicator${hasPending && hasCompleted ? ' mixed' : hasCompleted ? ' completed' : ''}`} />}
                    </button>
                  );
                })}
              </div>
              <div className="todo-calendar-legend"><span><i className="legend-completed" />Completed</span><span><i className="legend-pending" />Pending</span><span><i className="legend-today" />Today</span></div>
            </section>

            <section className="todo-card todo-metrics-panel">
              <header className="todo-section-header"><div><p className="todo-overline">DAILY METRICS</p><h2>Day in focus</h2></div><span className="todo-metric-date">{weekdayFormatter.format(selectedDateObject)}</span></header>
              <div className="todo-daily-progress">
                <div className="todo-donut" style={{ '--todo-progress': productivityPercent }} role="img" aria-label={`${productivityPercent}% of tasks completed`}><span><strong>{productivityPercent}%</strong><small>complete</small></span></div>
                <div className="todo-progress-copy"><strong>{progressLabel}</strong><span>Keep building momentum.</span></div>
              </div>
              <div className="todo-daily-stats">
                <div><span><i className="metric-dot done" />Completed</span><strong>{completedTasks}</strong></div>
                <div><span><i className="metric-dot pending" />Pending</span><strong>{pendingTasks}</strong></div>
                <div><span><i className="metric-dot total" />Total tasks</span><strong>{totalTasks}</strong></div>
                <div><span><i className="metric-dot focus" />Focus time</span><strong>{formatDuration(summary.focusMinutes || 0)}</strong></div>
                <div><span><i className="metric-dot streak" />Current streak</span><strong>{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</strong></div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {modalOpen && <TodoModal key={editingTask?._id || 'new-task'} task={editingTask} date={selectedDate} pending={pending} error={actionError} onClose={() => setModalOpen(false)} onSubmit={submitTask} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <motion.div className="todo-toast" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><Check size={15} />{toast}</motion.div>}
      </AnimatePresence>
    </div>
  );
}

export default Todo;
