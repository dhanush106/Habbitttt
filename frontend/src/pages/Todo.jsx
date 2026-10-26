import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  CodeXml,
  Coffee,
  Dumbbell,
  ListTodo,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Sun,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { getWeekStart, toDateKey } from '../lib/dates';
import { useTodoStore } from '../stores/todoStore';
import './Todo.css';

const categories = ['Personal', 'Fitness', 'Study', 'Development', 'DSA', 'DBMS', 'GATE', 'Break', 'Planning'];
const priorities = ['Low', 'Medium', 'High'];
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const categoryIcon = { Personal: Coffee, Fitness: Dumbbell, Study: BookOpen, Development: BriefcaseBusiness, DSA: CodeXml, DBMS: ListTodo, GATE: Target, Break: Moon, Planning: Zap };
const categoryClass = (category) => (category || 'Personal').toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
const hourLabel = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
const endTimeFor = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const end = new Date(2000, 0, 1, hours, minutes + durationMinutes);
  return end.toLocaleTimeString('en-US', { hour: 'numeric', minute: end.getMinutes() ? '2-digit' : undefined });
};
const timeRange = (task) => `${new Date(`2000-01-01T${task.startTime}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: task.startTime.endsWith(':00') ? undefined : '2-digit' })} – ${endTimeFor(task.startTime, task.durationMinutes)}`;

function TodoModal({ title, onClose, children }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="todo-modal-title" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}>
        <header className="modal-header"><h2 id="todo-modal-title">{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={17} /></button></header>
        {children}
      </motion.section>
    </motion.div>
  );
}

function Todo() {
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [view, setView] = useState('Day');
  const [modal, setModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const tasks = useTodoStore((state) => state.tasks);
  const dailyGoals = useTodoStore((state) => state.dailyGoals);
  const summary = useTodoStore((state) => state.summary);
  const summaryCategories = useTodoStore((state) => state.categories);
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
  const calendarDays = getCalendarDays(selectedDateObject);
  const monthLabel = monthFormatter.format(selectedDateObject);
  const selectedTasks = tasks.filter((task) => task.date === selectedDate);
  const completedGoals = dailyGoals.filter((goal) => goal.completed).length;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    loadDashboard(monthRange.start, monthRange.end, selectedDate).catch(() => {});
  }, [loadDashboard, monthRange.end, monthRange.start, selectedDate]);

  const weekStart = getWeekStart(selectedDateObject);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(weekEnd);
  const weekTasks = tasks.filter((task) => task.date >= weekStartKey && task.date <= weekEndKey);

  const listTasks = useMemo(() => tasks.filter((task) => {
    const term = search.trim().toLowerCase();
    return !term || `${task.title} ${task.category} ${task.tags.join(' ')}`.toLowerCase().includes(term);
  }), [search, tasks]);

  const runAction = async (action) => {
    setPending(true);
    setFormError('');
    clearError();
    try {
      await action();
      return true;
    } catch (actionError) {
      setFormError(actionError.message);
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

  const submitTask = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await runAction(() => createTask({
      title: form.get('title'),
      notes: form.get('notes'),
      date: form.get('date'),
      startTime: form.get('startTime'),
      durationMinutes: Number(form.get('durationMinutes')),
      category: form.get('category'),
      priority: form.get('priority'),
      tags: String(form.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    }));
    if (ok) setModal(false);
  };

  const quickAdd = async (event) => {
    event.preventDefault();
    if (!quickTitle.trim()) return;
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const startTime = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
    const ok = await runAction(() => createTask({
      title: quickTitle.trim(), date: selectedDate, startTime, durationMinutes: 60,
      category: 'Personal', priority: 'Medium', tags: [],
    }));
    if (ok) setQuickTitle('');
  };

  const quickGoal = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    if (await runAction(() => createDailyGoal({ title, date: selectedDate }))) event.currentTarget.reset();
  };

  const toggleTask = (task) => runAction(() => updateTask(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' }));
  const displayedTasks = view === 'Day' ? selectedTasks : view === 'Week' ? weekTasks : listTasks;
  const hourKeys = [...new Set([...Array.from({ length: 19 }, (_, index) => index + 5), ...selectedTasks.map((task) => Number(task.startTime.slice(0, 2)))])].sort((a, b) => a - b);

  return (
    <main className="todo-page">
      <div className="todo-topline">
        <label className="todo-search"><Search size={15} /><input aria-label="Search tasks" onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, categories, or tags" value={search} /><kbd>Ctrl K</kbd></label>
        <div className="todo-top-actions"><button className="icon-button" onClick={() => changeDate(-1)} type="button" title="Previous day" aria-label="Previous day"><ArrowLeft size={15} /></button><span className="todo-date-chip">{dateFormatter.format(selectedDateObject)}</span><button className="icon-button" onClick={() => changeDate(1)} type="button" title="Next day" aria-label="Next day"><ArrowRight size={15} /></button><button className="text-button" onClick={() => setSelectedDate(todayKey)} type="button">Today</button><button className="todo-icon-button" type="button" title="Day mode" aria-label="Day mode"><Sun size={15} /></button><button className="todo-icon-button" type="button" title="Night mode" aria-label="Night mode"><Moon size={15} /></button><span className="todo-avatar">{useTodoInitial()}</span></div>
      </div>

      <header className="todo-heading">
        <div><p className="todo-eyebrow">YOUR SPACE, YOUR PACE</p><h1>{greeting}, plan for a great day <Moon className="greeting-moon" size={22} /></h1><p>Set your plan for tomorrow and stay ahead.</p></div>
        <div className="todo-quote"><span>“</span><p>A well-planned day is a step closer<br />to the life you want.</p></div>
        <button className="primary-button todo-add-task" onClick={() => { setFormError(''); setModal(true); }} type="button"><Plus size={15} /> Add task</button>
      </header>

      <AnimatePresence>{(error || formError) && <motion.div className="notice notice-error" role="alert" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{formError || error}<button onClick={() => { setFormError(''); clearError(); }} type="button" aria-label="Dismiss error"><X size={15} /></button></motion.div>}</AnimatePresence>

      <section className="todo-summary-grid">
        <article className="todo-stat todo-stat-purple"><span className="todo-stat-icon"><CalendarDays size={18} /></span><span>Total tasks</span><strong>{summary.totalTasks}</strong><small>for {selectedDate === todayKey ? 'today' : weekdayFormatter.format(selectedDateObject)}</small></article>
        <article className="todo-stat todo-stat-green"><span className="todo-stat-icon"><CheckCircle2 size={18} /></span><span>Focused hours</span><strong>{summary.focusHours} hrs</strong><small>{summary.focusMinutes ? `${summary.focusMinutes} scheduled minutes` : 'Build time for your priorities'}</small></article>
        <article className="todo-stat todo-stat-orange"><span className="todo-stat-icon"><Target size={18} /></span><span>Categories</span><strong>{summary.categoryCount}</strong><small>{summary.categories?.map((item) => item.category).slice(0, 3).join(' · ') || 'Personal · Study · Work'}</small></article>
        <article className="todo-stat todo-stat-blue"><span className="todo-stat-icon"><Zap size={18} /></span><span>Productivity goal</span><strong>{summary.productivityPercent}%</strong><small>{summary.completedTasks} of {summary.totalTasks} tasks complete</small><span className="todo-stat-track"><i style={{ width: `${summary.productivityPercent}%` }} /></span></article>
      </section>

      <div className="todo-main-grid">
        <section className="todo-panel schedule-panel">
          <header className="todo-panel-heading">
            <div><span className="todo-panel-icon"><CalendarDays size={17} /></span><span><h2>{view === 'Day' ? `${selectedDate === todayKey ? "Today's" : weekdayFormatter.format(selectedDateObject) + "'s"} schedule` : view === 'Week' ? 'This week' : 'Task list'}</h2><small>{dateFormatter.format(selectedDateObject)}</small></span></div>
            <div className="todo-view-controls" role="tablist" aria-label="Task view">
              {['Day', 'Week', 'List'].map((mode) => <button aria-selected={view === mode} className={view === mode ? 'selected' : ''} key={mode} onClick={() => setView(mode)} role="tab" type="button">{mode}</button>)}
              <button className="icon-button filter-button" title="Filter tasks" aria-label="Filter tasks" type="button"><ListTodo size={14} /></button>
            </div>
          </header>

          {view === 'Day' ? <div className="todo-timeline">
            {hourKeys.map((hour) => {
              const hourTasks = selectedTasks.filter((task) => Number(task.startTime.slice(0, 2)) === hour);
              return <div className="timeline-hour" key={hour}><time>{hourLabel(hour)}</time><div className="timeline-items">{hourTasks.map((task) => <TaskCard key={task._id} task={task} onComplete={() => void toggleTask(task)} onDelete={() => void runAction(() => deleteTask(task._id))} />)}</div></div>;
            })}
            {!loading && !selectedTasks.length && <div className="todo-empty-schedule"><CalendarDays size={23} /><strong>No tasks scheduled.</strong><button className="text-button" onClick={() => setModal(true)} type="button"><Plus size={14} /> Add your first task</button></div>}
            {loading && <div className="todo-empty-schedule">Loading schedule…</div>}
          </div> : <div className="todo-list-view">
            {displayedTasks.length ? displayedTasks.map((task) => <TaskCard compact key={task._id} task={task} onComplete={() => void toggleTask(task)} onDelete={() => void runAction(() => deleteTask(task._id))} showDate={view !== 'Day'} />) : <div className="todo-empty-schedule">{loading ? 'Loading tasks…' : 'No tasks match this view.'}</div>}
          </div>}
        </section>

        <aside className="todo-sidebar">
          <section className="todo-panel calendar-panel">
            <header className="calendar-heading"><h2>{monthLabel}</h2><div><button className="icon-button" onClick={() => changeMonth(-1)} type="button" aria-label="Previous month"><ArrowLeft size={13} /></button><button className="icon-button" onClick={() => changeMonth(1)} type="button" aria-label="Next month"><ArrowRight size={13} /></button></div></header>
            <div className="todo-calendar-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span className="calendar-weekday" key={day}>{day}</span>)}
              {calendarDays.map((day) => {
                const key = toDateKey(day);
                const count = activity.find((item) => item.date === key)?.tasks || 0;
                return <button className={`calendar-date${day.getMonth() !== selectedDateObject.getMonth() ? ' outside' : ''}${key === selectedDate ? ' selected' : ''}${key === todayKey ? ' today' : ''}`} key={key} onClick={() => setSelectedDate(key)} type="button"><span>{day.getDate()}</span>{count > 0 && <i className={count > 3 ? 'busy' : ''} />}</button>;
              })}
            </div>
          </section>

          <section className="todo-panel overview-panel">
            <header className="todo-panel-heading"><div><span><h2>Day overview</h2><small>Tasks and time planned</small></span></div></header>
            <div className="todo-overview-body"><div className="todo-donut" style={{ '--todo-progress': summary.productivityPercent }}><span><strong>{summary.focusHours}</strong><small>of {summary.focusHours} hrs</small></span></div><div className="todo-legend"><span><i className="legend-done" />Completed <strong>{summary.completedTasks}</strong></span><span><i className="legend-progress" />In progress <strong>{summary.inProgressTasks}</strong></span><span><i className="legend-pending" />Pending <strong>{summary.pendingTasks}</strong></span></div></div>
          </section>

          <section className="todo-panel category-panel">
            <header className="todo-panel-heading"><div><span className="todo-panel-icon category-title-icon"><Target size={16} /></span><span><h2>Categories</h2><small>Time across your plan</small></span></div><button className="icon-button" type="button" aria-label="Category details"><ArrowRight size={14} /></button></header>
            <div className="todo-category-list">{summaryCategories.length ? summaryCategories.slice(0, 5).map((item) => <div className="todo-category-row" key={item.category}><span className={`category-color category-${categoryClass(item.category)}`} /><strong>{item.category}</strong><span className="category-hours">{item.hours} h</span><span className="category-track"><i className={`category-${categoryClass(item.category)}`} style={{ width: `${item.percentage}%` }} /></span><small>{item.percentage}%</small></div>) : <p className="todo-small-empty">Categories appear once tasks are scheduled.</p>}</div>
          </section>

          <section className="todo-panel quick-add-panel">
            <header className="todo-panel-heading"><div><span><h2>Quick add</h2><small>Add a task to your schedule</small></span></div></header>
            <form className="quick-add-form" onSubmit={quickAdd}><input aria-label="Quick task title" maxLength="140" onChange={(event) => setQuickTitle(event.target.value)} placeholder="What do you want to do?" value={quickTitle} /><button className="primary-button" disabled={pending || !quickTitle.trim()} type="submit">Add</button></form>
            <div className="quick-category-chips">{['Study', 'Fitness', 'Development', 'Personal'].map((category) => <button key={category} onClick={() => { setQuickTitle(`${category} task`); }} type="button"><CategoryIcon category={category} />{category}</button>)}</div>
          </section>

          <section className="todo-panel checklist-panel">
            <header className="todo-panel-heading"><div><span className="todo-panel-icon"><Target size={16} /></span><span><h2>Important goals</h2><small>{completedGoals} of {dailyGoals.length} complete</small></span></div><span className="checklist-progress">{dailyGoals.length ? Math.round((completedGoals / dailyGoals.length) * 100) : 0}%</span></header>
            <form className="quick-goal-form" onSubmit={quickGoal}><input aria-label="New daily goal" maxLength="140" name="title" placeholder="Add an important task" /><button className="icon-button" type="submit" aria-label="Add daily goal"><Plus size={15} /></button></form>
            <div className="todo-goal-list">{dailyGoals.map((goal) => <div className={`todo-goal-row${goal.completed ? ' complete' : ''}`} key={goal._id}><button className="goal-checkbox" type="button" role="checkbox" aria-checked={goal.completed} aria-label={`${goal.completed ? 'Reopen' : 'Complete'} ${goal.title}`} onClick={() => void runAction(() => updateDailyGoal(goal._id, !goal.completed))}>{goal.completed && <Check size={12} />}</button><span>{goal.title}</span><button className="row-action" type="button" title="Delete goal" aria-label={`Delete ${goal.title}`} onClick={() => void runAction(() => deleteDailyGoal(goal._id))}><Trash2 size={13} /></button></div>)}{!dailyGoals.length && <p className="todo-small-empty">Your daily checklist will show here.</p>}</div>
          </section>
        </aside>
      </div>

      <AnimatePresence>{modal && <TodoModal title="Add a scheduled task" onClose={() => setModal(false)}><form className="modal-form" onSubmit={submitTask}>
        <label className="field-label">Task title<input autoFocus className="dashboard-input" maxLength="140" name="title" placeholder="What needs your attention?" required /></label>
        <label className="field-label">Notes <span className="field-optional">Optional</span><textarea className="dashboard-input todo-notes-input" maxLength="1000" name="notes" placeholder="Add a little context" rows="2" /></label>
        <div className="form-grid"><label className="field-label">Date<input className="dashboard-input" defaultValue={selectedDate} name="date" required type="date" /></label><label className="field-label">Start time<input className="dashboard-input" defaultValue="09:00" name="startTime" required type="time" /></label></div>
        <div className="form-grid"><label className="field-label">Duration (minutes)<input className="dashboard-input" defaultValue="60" min="1" max="1440" name="durationMinutes" required type="number" /></label><label className="field-label">Priority<select className="dashboard-input" defaultValue="Medium" name="priority">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label></div>
        <div className="form-grid"><label className="field-label">Category<select className="dashboard-input" defaultValue="Personal" name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="field-label">Tags <span className="field-optional">Comma separated</span><input className="dashboard-input" name="tags" placeholder="Routine, Focus" /></label></div>
        {formError && <p className="inline-error">{formError}</p>}
        <div className="modal-actions"><button className="text-button" onClick={() => setModal(false)} type="button">Cancel</button><button className="primary-button" disabled={pending} type="submit">{pending ? 'Saving…' : <><Plus size={14} /> Add task</>}</button></div>
      </form></TodoModal>}</AnimatePresence>
    </main>
  );
}

function CategoryIcon({ category }) {
  const Icon = categoryIcon[category] || Bell;
  return <Icon size={12} />;
}

function TaskCard({ task, onComplete, onDelete, compact = false, showDate = false }) {
  const Icon = categoryIcon[task.category] || Bell;
  return (
    <article className={`todo-task-card task-${categoryClass(task.category)} priority-${task.priority.toLowerCase()}${task.status === 'completed' ? ' task-complete' : ''}${compact ? ' compact' : ''}`}>
      <span className="task-color-bar" />
      <span className="task-category-icon"><Icon size={15} /></span>
      <div className="task-content"><strong>{task.title}</strong><div className="task-meta"><span>{timeRange(task)}</span><span className="task-tag category-tag">{task.category}</span>{task.tags.slice(0, 3).map((tag) => <span className="task-tag" key={tag}>{tag}</span>)}{showDate && <span className="task-tag task-date-tag">{dateFormatter.format(atNoon(task.date))}</span>}</div>{task.notes && <small className="task-notes">{task.notes}</small>}</div>
      <span className={`task-priority priority-label-${task.priority.toLowerCase()}`}>{task.priority}</span>
      <button className={`task-complete-button${task.status === 'completed' ? ' checked' : ''}`} onClick={onComplete} type="button" aria-label={task.status === 'completed' ? `Reopen ${task.title}` : `Complete ${task.title}`}>{task.status === 'completed' && <Check size={12} />}</button>
      <button className="task-more" onClick={onDelete} type="button" aria-label={`Delete ${task.title}`} title="Delete task"><MoreVertical size={15} /></button>
    </article>
  );
}

function useTodoInitial() {
  return 'S';
}

export default Todo;