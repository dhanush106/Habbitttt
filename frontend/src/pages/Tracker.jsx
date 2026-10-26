import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Circle,
  Dumbbell,
  Flame,
  Leaf,
  LoaderCircle,
  Plus,
  Sprout,
  Target,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { countHabitStreak, formatWeek, getWeekDays, getWeekStart, shiftWeek, toDateKey } from '../lib/dates';
import { useTrackerStore } from '../stores/trackerStore';

const categoryOptions = ['Personal', 'Health', 'Learning', 'Career', 'Discipline', 'Finance'];
const categoryClass = (category) => `category-${(category || 'personal').toLowerCase()}`;
const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const numericFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}>
        <header className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} type="button" aria-label="Close dialog"><X size={17} /></button></header>
        {children}
      </motion.section>
    </motion.div>
  );
}

function Tracker() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [modal, setModal] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [pendingKey, setPendingKey] = useState('');
  const [formError, setFormError] = useState('');
  const habits = useTrackerStore((state) => state.habits);
  const goals = useTrackerStore((state) => state.goals);
  const loading = useTrackerStore((state) => state.loading);
  const error = useTrackerStore((state) => state.error);
  const loadTracker = useTrackerStore((state) => state.loadTracker);
  const clearError = useTrackerStore((state) => state.clearError);
  const setError = useTrackerStore((state) => state.setError);
  const createHabit = useTrackerStore((state) => state.createHabit);
  const deleteHabit = useTrackerStore((state) => state.deleteHabit);
  const toggleHabit = useTrackerStore((state) => state.toggleHabit);
  const createGoal = useTrackerStore((state) => state.createGoal);
  const deleteGoal = useTrackerStore((state) => state.deleteGoal);
  const setGoalEntry = useTrackerStore((state) => state.setGoalEntry);

  const days = getWeekDays(weekStart);
  const startKey = toDateKey(days[0]);
  const endKey = toDateKey(days[6]);
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    loadTracker(startKey, endKey).catch(() => {});
  }, [endKey, loadTracker, startKey]);

  const weekCompleted = habits.reduce((sum, habit) => sum + habit.completedDates.filter((date) => date >= startKey && date <= endKey).length, 0);
  const possibleCompletions = habits.length * 7;
  const habitPercent = possibleCompletions ? Math.round((weekCompleted / possibleCompletions) * 100) : 0;
  const completedGoals = goals.filter((goal) => goal.status === 'completed').length;
  const activeGoals = goals.filter((goal) => goal.status === 'in_progress').length;
  const goalPercent = goals.length
    ? Math.round(goals.reduce((total, goal) => total + Math.min((goal.progress / goal.target) * 100, 100), 0) / goals.length)
    : 0;

  const runAction = async (key, action) => {
    setPendingKey(key);
    clearError();
    try {
      await action();
      return true;
    } catch (actionError) {
      setError(actionError.message);
      return false;
    } finally {
      setPendingKey('');
    }
  };

  const submitHabit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (await runAction('create-habit', () => createHabit({ name: form.get('name'), category: form.get('category') }))) setModal(null);
  };

  const submitGoal = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (await runAction('create-goal', () => createGoal({
      name: form.get('name'),
      unit: form.get('unit'),
      target: Number(form.get('target')),
      startDate: startKey,
      endDate: endKey,
    }))) setModal(null);
  };

  const saveEntry = async (goal, date, rawValue) => {
    const value = Number(rawValue || 0);
    if (!Number.isFinite(value) || value < 0) {
      setFormError('Enter a zero or a positive number.');
      return;
    }
    setFormError('');
    await runAction(`${goal._id}-${date}`, () => setGoalEntry(goal._id, date, value));
  };

  const shiftSelectedWeek = (amount) => setWeekStart((current) => shiftWeek(current, amount));

  return (
    <main className="tracker-page">
      <motion.div className="dashboard-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="dashboard-title-wrap"><span className="section-mark"><Check size={19} strokeWidth={3} /></span><div><h1>Habit Tracker</h1><p>Track the small things that move your week forward.</p></div></div>
        <div className="week-controls" aria-label="Select week">
          <button className="icon-button" onClick={() => shiftSelectedWeek(-1)} type="button" title="Previous week" aria-label="Previous week"><ArrowLeft size={16} /></button>
          <span className="week-label">{formatWeek(days[0], days[6])}</span>
          <button className="icon-button" onClick={() => shiftSelectedWeek(1)} type="button" title="Next week" aria-label="Next week"><ArrowRight size={16} /></button>
          <button className="text-button" onClick={() => setWeekStart(getWeekStart())} type="button">This week</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && <motion.div className="notice notice-error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}<button onClick={clearError} type="button" aria-label="Dismiss error"><X size={15} /></button></motion.div>}
      </AnimatePresence>

      <motion.section className="tracker-section" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <div className="section-heading">
          <div className="section-heading-copy"><span className="section-icon"><Leaf size={19} /></span><div><h2>Daily habits</h2><p>One check-in at a time. Your streak follows your own pace.</p></div></div>
          <button className="primary-button" onClick={() => { setFormError(''); setModal('habit'); }} type="button"><Plus size={16} /> Add habit</button>
        </div>
        <div className="table-scroll">
          <table className="tracker-table habit-table">
            <thead><tr><th className="habit-name-column">Habit / task</th><th>Category</th>{days.map((day) => <th className={toDateKey(day) === todayKey ? 'today-column' : ''} key={toDateKey(day)}><span>{dayFormatter.format(day)}</span><strong>{day.getDate()}</strong></th>)}<th className="progress-column">Week</th><th>Streak</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {loading && !habits.length ? Array.from({ length: 4 }, (_, row) => <tr className="skeleton-row" key={row}><td colSpan="12"><span /></td></tr>) : habits.map((habit, index) => {
                const completedCount = habit.completedDates.filter((date) => date >= startKey && date <= endKey).length;
                const progress = Math.round((completedCount / 7) * 100);
                return <motion.tr key={habit._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.035, 0.24) }}>
                  <td className="habit-name-cell"><span className="habit-leaf"><Sprout size={16} /></span><span>{habit.name}</span></td>
                  <td><span className={`category-badge ${categoryClass(habit.category)}`}>{habit.category}</span></td>
                  {days.map((day) => {
                    const date = toDateKey(day);
                    const completed = habit.completedDates.includes(date);
                    const key = `${habit._id}-${date}`;
                    return <td className={date === todayKey ? 'today-column' : ''} key={date}><button className={`habit-checkbox${completed ? ' checked' : ''}`} type="button" role="checkbox" aria-checked={completed} aria-label={`${completed ? 'Mark incomplete' : 'Mark complete'}: ${habit.name}, ${date}`} disabled={pendingKey === key} onClick={() => runAction(key, () => toggleHabit(habit._id, date, !completed))}>{completed && <Check size={13} strokeWidth={3} />}</button></td>;
                  })}
                  <td className="progress-cell"><div className="progress-stack"><div className="progress-track"><span className="progress-fill" style={{ width: `${progress}%` }} /></div><span>{completedCount}/7</span></div></td>
                  <td><span className="streak-cell"><Flame size={15} />{countHabitStreak(habit)}</span></td>
                  <td><button className="row-action" type="button" title="Delete habit" aria-label={`Delete ${habit.name}`} disabled={pendingKey === `delete-${habit._id}`} onClick={() => runAction(`delete-${habit._id}`, () => deleteHabit(habit._id))}><Trash2 size={14} /></button></td>
                </motion.tr>;
              })}
              {!loading && habits.length === 0 && <tr><td className="empty-cell" colSpan="12"><span className="empty-icon"><Sprout size={22} /></span><strong>Your first habit starts here.</strong><span>Add one small thing you want to show up for this week.</span><button className="text-button" onClick={() => setModal('habit')} type="button">Add your first habit <ArrowRight size={14} /></button></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="section-footnote"><span>{habits.length} {habits.length === 1 ? 'habit' : 'habits'}</span><span className="footnote-dot" />{weekCompleted} check-ins this week <span className="footnote-spacer" /><span className="tiny-progress"><span style={{ width: `${habitPercent}%` }} /></span><strong>{habitPercent}%</strong></div>
      </motion.section>

      <motion.section className="planner-section" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <div className="section-heading planner-heading">
          <div className="section-heading-copy"><span className="section-icon target-icon"><Target size={20} /></span><div><h2>Weekly goals</h2><p>Set a measurable target and log what you do each day.</p></div></div>
          <button className="primary-button" onClick={() => { setFormError(''); setModal('goal'); }} type="button"><Plus size={16} /> Add weekly goal</button>
        </div>
        <div className="goal-summary">
          <div className="goal-summary-left"><div className="circular-progress" style={{ '--progress': goalPercent }}><strong>{goalPercent}%</strong></div><div><strong>Weekly target completion</strong><span>{completedGoals} of {goals.length} goals completed</span></div></div>
          <div className="goal-counts"><div><span className="count-icon completed-count"><Check size={14} /></span><strong>{completedGoals}</strong><small>Completed</small></div><div><span className="count-icon active-count"><LoaderCircle size={14} /></span><strong>{activeGoals}</strong><small>In progress</small></div><div><span className="count-icon not-started-count"><Circle size={13} /></span><strong>{Math.max(goals.length - completedGoals - activeGoals, 0)}</strong><small>Not started</small></div></div>
        </div>
        <div className="table-scroll goal-scroll">
          <table className="tracker-table goal-table">
            <thead><tr><th className="goal-name-column">Goal / metric</th><th>Unit / target</th>{days.map((day) => <th className={toDateKey(day) === todayKey ? 'today-column' : ''} key={toDateKey(day)}><span>{dayFormatter.format(day)}</span><strong>{day.getDate()}</strong></th>)}<th className="goal-progress-column">Total progress</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {goals.map((goal, index) => {
                const progress = goal.progress || 0;
                const percent = Math.min(Math.round((progress / goal.target) * 100), 100);
                return <motion.tr key={goal._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.04, 0.24) }}>
                  <td className="habit-name-cell"><span className="goal-glyph">{index % 3 === 0 ? <Dumbbell size={17} /> : index % 3 === 1 ? <BookOpen size={17} /> : <BriefcaseBusiness size={17} />}</span><span>{goal.name}</span></td>
                  <td className="unit-target">{numericFormatter.format(goal.target)} {goal.unit}</td>
                  {days.map((day) => {
                    const date = toDateKey(day);
                    const existing = goal.entries.find((entry) => entry.date === date)?.value;
                    const key = `${goal._id}-${date}`;
                    const withinGoal = date >= goal.startDate && date <= goal.endDate;
                    return <td className={date === todayKey ? 'today-column' : ''} key={date}><input className="goal-entry" aria-label={`${goal.name}, ${dayFormatter.format(day)} ${day.getDate()}`} type="number" min="0" step="any" value={drafts[key] ?? (existing ?? '')} placeholder="–" onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))} onBlur={(event) => { const raw = event.target.value; if (withinGoal && raw !== '' && Number(raw) !== existing) saveEntry(goal, date, raw); }} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} disabled={!withinGoal || pendingKey === key} /></td>;
                  })}
                  <td className="progress-cell"><div className="goal-progress"><div className="progress-track"><span className={`progress-fill${goal.status === 'completed' ? ' is-complete' : ''}`} style={{ width: `${percent}%` }} /></div><span>{numericFormatter.format(progress)} / {numericFormatter.format(goal.target)} {goal.unit}</span></div></td>
                  <td><span className={`status-badge status-${goal.status.replace('_', '-')}`}><span />{goal.status.replace('_', ' ')}</span></td>
                  <td><button className="row-action" type="button" title="Delete goal" aria-label={`Delete ${goal.name}`} disabled={pendingKey === `delete-${goal._id}`} onClick={() => runAction(`delete-${goal._id}`, () => deleteGoal(goal._id))}><Trash2 size={14} /></button></td>
                </motion.tr>;
              })}
              {!loading && goals.length === 0 && <tr><td className="empty-cell" colSpan="12"><span className="empty-icon"><Trophy size={22} /></span><strong>Give this week a clear target.</strong><span>Weekly goals turn effort into something you can measure.</span><button className="text-button" onClick={() => setModal('goal')} type="button">Add a weekly goal <ArrowRight size={14} /></button></td></tr>}
            </tbody>
          </table>
        </div>
        {formError && <p className="inline-error" role="alert">{formError}</p>}
      </motion.section>

      <AnimatePresence>
        {modal === 'habit' && <Modal title="Add a habit" onClose={() => setModal(null)}><form className="modal-form" onSubmit={submitHabit}>
          <label className="field-label">Habit name<input autoFocus className="dashboard-input" maxLength="100" name="name" placeholder="e.g. Morning walk" required /></label>
          <label className="field-label">Category<select className="dashboard-input" name="category" defaultValue="Personal">{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
          <div className="modal-actions"><button className="text-button" onClick={() => setModal(null)} type="button">Cancel</button><button className="primary-button" disabled={pendingKey === 'create-habit'} type="submit">{pendingKey === 'create-habit' ? <span className="button-spinner dark" /> : <><Plus size={15} /> Add habit</>}</button></div>
        </form></Modal>}
        {modal === 'goal' && <Modal title="Add a weekly goal" onClose={() => setModal(null)}><form className="modal-form" onSubmit={submitGoal}>
          <label className="field-label">Goal name<input autoFocus className="dashboard-input" maxLength="100" name="name" placeholder="e.g. Run" required /></label>
          <div className="form-grid"><label className="field-label">Unit<input className="dashboard-input" maxLength="30" name="unit" placeholder="km, reps, pages" required /></label><label className="field-label">Weekly target<input className="dashboard-input" min="0.01" name="target" placeholder="25" required step="any" type="number" /></label></div>
          <p className="date-range-note">This goal runs {formatWeek(days[0], days[6])}.</p>
          <div className="modal-actions"><button className="text-button" onClick={() => setModal(null)} type="button">Cancel</button><button className="primary-button" disabled={pendingKey === 'create-goal'} type="submit">{pendingKey === 'create-goal' ? <span className="button-spinner dark" /> : <><Plus size={15} /> Add goal</>}</button></div>
        </form></Modal>}
      </AnimatePresence>
    </main>
  );
}

export default Tracker;
