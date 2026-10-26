import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CodeXml,
  Flame,
  Hash,
  Link2,
  Plus,
  Search,
  Target,
  Trash2,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { toDateKey } from '../lib/dates';
import { useLeetTrackStore } from '../stores/leettrackStore';

const difficultyOptions = ['Easy', 'Medium', 'Hard'];
const fullDateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
const dayDateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric' });

const monthStartFor = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const shiftMonth = (date, offset) => new Date(date.getFullYear(), date.getMonth() + offset, 1);
const monthBounds = (date) => ({
  start: toDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
  end: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
});
const monthTitle = (date) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
const makeCalendar = (month) => {
  const first = monthStartFor(month);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

function LeetModal({ title, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="leet-modal-title" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}>
        <header className="modal-header"><h2 id="leet-modal-title">{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={17} /></button></header>
        {children}
      </motion.section>
    </motion.div>
  );
}

function SolvedChart({ activity, focusDate }) {
  const points = useMemo(() => {
    const focus = new Date(`${focusDate}T12:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(focus);
      date.setDate(focus.getDate() - 6 + index);
      const dateKey = toDateKey(date);
      return { date: dateKey, value: activity.find((entry) => entry.date === dateKey)?.solved ?? 0, label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    });
  }, [activity, focusDate]);
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points.map((point, index) => ({
    ...point,
    x: 6 + (index / 6) * 88,
    y: 82 - (point.value / maxValue) * 66,
  }));
  const linePath = coordinates.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return (
    <div className="leet-chart-wrap">
      <div className="leet-chart-y"><span>{maxValue}</span><span>{Math.round(maxValue / 2)}</span><span>0</span></div>
      <svg className="leet-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Problems solved per day during the last seven days">
        <defs><linearGradient id="leet-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a16cff" stopOpacity=".28" /><stop offset="100%" stopColor="#a16cff" stopOpacity="0" /></linearGradient></defs>
        {[16, 38, 60, 82].map((y) => <line className="leet-chart-grid" key={y} x1="0" x2="100" y1={y} y2={y} />)}
        <path d={`${linePath} L ${coordinates.at(-1).x} 100 L ${coordinates[0].x} 100 Z`} fill="url(#leet-area)" />
        <path d={linePath} className="leet-chart-line" />
        {coordinates.map((point) => <g key={point.date}><circle className="leet-chart-point" cx={point.x} cy={point.y} r="1.7"><title>{`${point.value} solved · ${point.label}`}</title></circle><text className="leet-chart-value" x={point.x} y={Math.max(point.y - 5, 8)} textAnchor="middle">{point.value}</text></g>)}
      </svg>
      <div className="leet-chart-x">{coordinates.map((point) => <span key={point.date}>{point.label}</span>)}</div>
    </div>
  );
}

function LeetTrack() {
  const today = new Date();
  const [month, setMonth] = useState(() => monthStartFor(today));
  const [focusDate, setFocusDate] = useState(() => toDateKey(today));
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [modal, setModal] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTopicTarget, setSelectedTopicTarget] = useState(20);

  const problems = useLeetTrackStore((state) => state.problems);
  const recentProblems = useLeetTrackStore((state) => state.recentProblems);
  const dailyGoals = useLeetTrackStore((state) => state.dailyGoals);
  const topics = useLeetTrackStore((state) => state.topics);
  const activity = useLeetTrackStore((state) => state.activity);
  const summary = useLeetTrackStore((state) => state.summary);
  const loading = useLeetTrackStore((state) => state.loading);
  const error = useLeetTrackStore((state) => state.error);
  const loadDashboard = useLeetTrackStore((state) => state.loadDashboard);
  const clearError = useLeetTrackStore((state) => state.clearError);
  const createProblem = useLeetTrackStore((state) => state.createProblem);
  const updateProblem = useLeetTrackStore((state) => state.updateProblem);
  const deleteProblem = useLeetTrackStore((state) => state.deleteProblem);
  const createGoal = useLeetTrackStore((state) => state.createGoal);
  const updateGoal = useLeetTrackStore((state) => state.updateGoal);
  const deleteGoal = useLeetTrackStore((state) => state.deleteGoal);
  const updateDailyTarget = useLeetTrackStore((state) => state.updateDailyTarget);
  const updateTopicTarget = useLeetTrackStore((state) => state.updateTopicTarget);

  const bounds = monthBounds(month);
  const calendarDays = makeCalendar(month);
  const focusProblems = problems.filter((problem) => problem.date === focusDate && (difficultyFilter === 'All' || problem.difficulty === difficultyFilter) && `${problem.title} ${problem.topics.join(' ')} ${problem.platform}`.toLowerCase().includes(search.toLowerCase()));
  const searchFilteredProblems = recentProblems.filter((problem) => (difficultyFilter === 'All' || problem.difficulty === difficultyFilter) && `${problem.title} ${problem.topics.join(' ')} ${problem.platform}`.toLowerCase().includes(search.toLowerCase()));
  const dailyProgress = Math.min(100, Math.round((summary.todaySolved / Math.max(summary.dailyTarget, 1)) * 100));
  const totalDifficulty = Math.max(Object.values(summary.difficultyCounts).reduce((total, count) => total + count, 0), 1);
  const difficultyGradient = `conic-gradient(#42d99c 0 ${summary.difficultyCounts.Easy / totalDifficulty * 100}%, #f5b84b ${summary.difficultyCounts.Easy / totalDifficulty * 100}% ${(summary.difficultyCounts.Easy + summary.difficultyCounts.Medium) / totalDifficulty * 100}%, #fb7185 ${(summary.difficultyCounts.Easy + summary.difficultyCounts.Medium) / totalDifficulty * 100}% 100%)`;

  useEffect(() => {
    loadDashboard(bounds.start, bounds.end, focusDate).catch(() => {});
  }, [bounds.end, bounds.start, focusDate, loadDashboard]);

  const perform = async (action) => {
    setBusy(true);
    setFormError('');
    clearError();
    try {
      await action();
      setModal('');
    } catch (actionError) {
      setFormError(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  const changeMonth = (offset) => {
    const nextMonth = shiftMonth(month, offset);
    setMonth(nextMonth);
    const day = Math.min(new Date(`${focusDate}T12:00:00`).getDate(), new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate());
    setFocusDate(toDateKey(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day)));
  };

  const chooseDate = (date) => {
    setFocusDate(toDateKey(date));
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) setMonth(monthStartFor(date));
  };

  const submitProblem = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const topicsValue = String(data.get('topics') || '');
    void perform(() => createProblem({
      title: data.get('title'),
      difficulty: data.get('difficulty'),
      topics: topicsValue.split(',').map((topic) => topic.trim()).filter(Boolean),
      platform: data.get('platform'),
      url: data.get('url'),
      notes: data.get('notes'),
      status: data.get('status'),
      date: focusDate,
      timeMinutes: Number(data.get('timeMinutes') || 0),
    }));
  };

  const submitDailyGoal = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform(() => createGoal({ title: data.get('title'), date: focusDate }));
  };

  const submitDailyTarget = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform(() => updateDailyTarget(Number(data.get('target'))));
  };

  const submitTopicTarget = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform(() => updateTopicTarget(selectedTopic, Number(data.get('target'))));
  };

  const openTopicTarget = (topic) => {
    setSelectedTopic(topic.topic);
    setSelectedTopicTarget(topic.target);
    setFormError('');
    setModal('topic');
  };

  return (
    <main className="leet-page">
      <div className="leet-commandbar">
        <label className="leet-search"><Search size={15} /><input aria-label="Search problems, topics, or notes" onChange={(event) => setSearch(event.target.value)} placeholder="Search problems or topics" value={search} /><kbd>Ctrl K</kbd></label>
        <div className="leet-motto">“Discipline today, dream job tomorrow.”</div>
        <span className="leet-pill"><Flame size={14} /> {summary.currentStreak}</span><span className="leet-pill"><Trophy size={14} /> {summary.totalSolved}</span>
      </div>

      <motion.header className="leet-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="leet-title"><span className="leet-logo"><CodeXml size={27} /></span><div><h1>LeetTrack</h1><p>Track. Solve. Improve. Become unstoppable.</p></div></div>
        <div className="leet-month-controls"><button className="icon-button" onClick={() => changeMonth(-1)} type="button" aria-label="Previous month"><ChevronLeft size={16} /></button><span>{monthTitle(month)}</span><button className="icon-button" onClick={() => changeMonth(1)} type="button" aria-label="Next month"><ChevronRight size={16} /></button><button className="text-button" onClick={() => { setMonth(monthStartFor(new Date())); setFocusDate(toDateKey(new Date())); }} type="button">This month</button><button className="primary-button" onClick={() => { setFormError(''); setModal('problem'); }} type="button"><Plus size={15} /> Log problem</button></div>
      </motion.header>

      <AnimatePresence>{(error || formError) && <motion.div className="notice notice-error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{formError || error}<button type="button" onClick={() => { setFormError(''); clearError(); }} aria-label="Dismiss error"><X size={15} /></button></motion.div>}</AnimatePresence>

      <section className="leet-stat-grid" aria-label="Coding practice summary">
        <motion.article className="leet-stat today-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}><span className="leet-stat-icon"><Target size={19} /></span><span className="leet-stat-label">{focusDate === toDateKey(new Date()) ? "Today's progress" : 'Selected day'}</span><strong>{summary.todaySolved} <small>/ {summary.dailyTarget}</small></strong><span className="stat-progress"><i style={{ width: `${dailyProgress}%` }} /></span><em>{dailyProgress}%</em></motion.article>
        <motion.article className="leet-stat streak-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}><span className="leet-stat-icon"><Flame size={19} /></span><span className="leet-stat-label">Current streak</span><strong>{summary.currentStreak} <small>days</small></strong><span className="leet-stat-foot">Best: {summary.bestStreak} days</span></motion.article>
        <motion.article className="leet-stat solved-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}><span className="leet-stat-icon"><Trophy size={18} /></span><span className="leet-stat-label">Total solved</span><strong>{summary.totalSolved}</strong><span className="difficulty-counts">Easy {summary.difficultyCounts.Easy} <i /> Medium {summary.difficultyCounts.Medium} <i /> Hard {summary.difficultyCounts.Hard}</span></motion.article>
        <motion.article className="leet-stat month-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}><span className="leet-stat-icon"><BookOpen size={18} /></span><span className="leet-stat-label">This month</span><strong>{summary.periodSolved} <small>problems</small></strong><span className="leet-stat-foot">{summary.attempted} attempts logged</span><div className="mini-bars" aria-hidden="true">{activity.slice(-7).map((day) => <i key={day.date} style={{ height: `${Math.max(18, day.solved * 9)}px` }} />)}</div></motion.article>
      </section>

      <div className="leet-dashboard-grid">
        <section className="leet-panel leet-solved-panel">
          <header className="leet-panel-heading"><div><span className="leet-panel-icon purple"><CodeXml size={17} /></span><span><h2>Problems solved per day</h2><small>Last seven days through {fullDateFormat.format(new Date(`${focusDate}T12:00:00`))}</small></span></div><span className="panel-range">Last 7 days</span></header>
          <SolvedChart activity={activity} focusDate={focusDate} />
        </section>

        <section className="leet-panel leet-calendar-panel">
          <header className="leet-panel-heading"><div><span className="leet-panel-icon blue"><CalendarDays size={17} /></span><span><h2>Activity calendar</h2><small>{monthTitle(month)}</small></span></div><div className="calendar-nav"><button className="icon-button" onClick={() => changeMonth(-1)} type="button" aria-label="Previous month"><ChevronLeft size={14} /></button><button className="icon-button" onClick={() => changeMonth(1)} type="button" aria-label="Next month"><ChevronRight size={14} /></button></div></header>
          <div className="calendar-grid"><div className="calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-days">{calendarDays.map((date) => {
            const dateKey = toDateKey(date);
            const solved = activity.find((entry) => entry.date === dateKey)?.solved ?? 0;
            const isCurrentMonth = date.getMonth() === month.getMonth();
            return <button className={`calendar-day${isCurrentMonth ? '' : ' outside'}${focusDate === dateKey ? ' selected' : ''}${dateKey === toDateKey(new Date()) ? ' is-today' : ''}${solved ? ' has-activity' : ''}`} key={dateKey} onClick={() => chooseDate(date)} type="button" aria-label={`${fullDateFormat.format(date)}${solved ? `, ${solved} solved` : ''}`}><span>{dayDateFormat.format(date)}</span>{solved > 0 && <i style={{ opacity: Math.min(1, 0.45 + solved / 15) }} />}</button>;
          })}</div></div>
          <div className="calendar-legend"><i /> Solved problems</div>
        </section>

        <section className="leet-panel leet-daily-goals">
          <header className="leet-panel-heading"><div><span className="leet-panel-icon green"><Target size={17} /></span><span><h2>Daily goals</h2><small>{dailyGoals.filter((goal) => goal.completed).length} / {dailyGoals.length} complete</small></span></div><button className="icon-button" type="button" title="Edit daily target" aria-label="Edit daily problem target" onClick={() => { setFormError(''); setModal('target'); }}><Zap size={15} /></button></header>
          <div className="daily-goal-list">
            <div className="daily-goal-row daily-target-row"><span className="goal-check is-done"><Check size={13} /></span><span className="daily-goal-title">Solve {summary.dailyTarget} problems</span><span className="daily-goal-count">{summary.todaySolved}/{summary.dailyTarget}</span></div>
            {dailyGoals.map((goal) => <div className="daily-goal-row" key={goal._id}><button className={`goal-check${goal.completed ? ' is-done' : ''}`} type="button" role="checkbox" aria-checked={goal.completed} aria-label={`${goal.completed ? 'Mark incomplete' : 'Mark complete'}: ${goal.title}`} onClick={() => void perform(() => updateGoal(goal._id, { completed: !goal.completed }))}>{goal.completed && <Check size={13} />}</button><span className={`daily-goal-title${goal.completed ? ' goal-done' : ''}`}>{goal.title}</span><button className="leet-row-action" type="button" title="Delete goal" aria-label={`Delete ${goal.title}`} onClick={() => void perform(() => deleteGoal(goal._id))}><Trash2 size={13} /></button></div>)}
            <button className="daily-add-goal" type="button" onClick={() => { setFormError(''); setModal('goal'); }}><Plus size={14} /> Add a daily goal</button>
          </div>
        </section>

        <section className="leet-panel leet-problem-log">
          <header className="leet-panel-heading"><div><span className="leet-panel-icon lavender"><BookOpen size={17} /></span><span><h2>Problem log</h2><small>{fullDateFormat.format(new Date(`${focusDate}T12:00:00`))}</small></span></div><div className="problem-log-controls"><select aria-label="Filter by difficulty" className="leet-filter" onChange={(event) => setDifficultyFilter(event.target.value)} value={difficultyFilter}><option>All</option>{difficultyOptions.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select><button className="primary-button" type="button" onClick={() => { setFormError(''); setModal('problem'); }}><Plus size={14} /> Add problem</button></div></header>
          <div className="problem-list">
            {loading && !problems.length ? <div className="leet-empty">Loading problem log…</div> : focusProblems.length ? focusProblems.map((problem) => <article className="problem-row" key={problem._id}>
              <span className="problem-symbol"><CodeXml size={17} /></span><div className="problem-main"><strong>{problem.title}</strong><div className="problem-tags">{problem.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}{problem.topics.length > 3 && <span>+{problem.topics.length - 3}</span>}</div></div>
              <span className={`difficulty-chip difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><span className="problem-platform">{problem.platform}</span>
              {problem.url && <a className="problem-link" href={problem.url} target="_blank" rel="noreferrer" aria-label={`Open ${problem.title}`}><Link2 size={14} /></a>}
              {problem.status === 'attempted' && <button className="solve-action" type="button" onClick={() => void perform(() => updateProblem(problem._id, { status: 'solved' }))}><CheckCircle2 size={14} /> Solve</button>}
              {problem.status === 'solved' && <CheckCircle2 className="solved-check" size={15} />}
              <button className="leet-row-action" type="button" title="Delete problem" aria-label={`Delete ${problem.title}`} onClick={() => void perform(() => deleteProblem(problem._id))}><Trash2 size={13} /></button>
            </article>) : <div className="leet-empty"><span className="leet-empty-icon"><CodeXml size={20} /></span><strong>{search || difficultyFilter !== 'All' ? 'No matching problems.' : 'No problems logged for this date.'}</strong><button className="text-button" type="button" onClick={() => setModal('problem')}><Plus size={14} /> Log a problem</button></div>}
          </div>
        </section>

        <section className="leet-panel leet-topics-panel">
          <header className="leet-panel-heading"><div><span className="leet-panel-icon blue"><Hash size={17} /></span><span><h2>Topic progress</h2><small>Mastery from solved problems</small></span></div><span className="panel-range">{summary.topicCount} topics</span></header>
          {topics.length ? <div className="topic-progress-list">{topics.map((topic, index) => <button className="topic-progress-row" key={topic.topic} type="button" onClick={() => openTopicTarget(topic)} title={`Edit ${topic.topic} target`}><span className={`topic-color topic-color-${index % 5}`} /><span className="topic-progress-name">{topic.topic}</span><span className="topic-progress-track"><i style={{ width: `${topic.percentage}%` }} /></span><span className="topic-percent">{topic.percentage}%</span></button>)}</div> : <div className="leet-empty topic-empty">Solve problems with topic tags to build your topic map.</div>}
        </section>

        <section className="leet-panel leet-difficulty-panel">
          <header className="leet-panel-heading"><div><span className="leet-panel-icon orange"><Trophy size={17} /></span><span><h2>Difficulty breakdown</h2><small>All solved problems</small></span></div></header>
          <div className="difficulty-overview"><div className="difficulty-donut" style={{ background: difficultyGradient }}><span><strong>{summary.totalSolved}</strong><small>Solved</small></span></div><div className="difficulty-legend">{difficultyOptions.map((difficulty) => <div key={difficulty}><i className={`legend-${difficulty.toLowerCase()}`} /><span>{difficulty}</span><strong>{summary.difficultyCounts[difficulty]}</strong></div>)}</div></div>
          <div className="solved-period"><span>This month</span><strong>{summary.periodSolved} <small>problems</small></strong></div>
        </section>

        <section className="leet-panel leet-recent-panel">
          <header className="leet-panel-heading"><div><span className="leet-panel-icon purple"><CalendarDays size={17} /></span><span><h2>Recent problems</h2><small>Your latest sessions</small></span></div><span className="panel-range">{recentProblems.length} latest</span></header>
          <div className="recent-problem-list">{searchFilteredProblems.length ? searchFilteredProblems.slice(0, 7).map((problem) => <button className="recent-problem-row" key={problem._id} type="button" onClick={() => chooseDate(new Date(`${problem.date}T12:00:00`))}><span className={`recent-status${problem.status === 'solved' ? ' done' : ''}`}>{problem.status === 'solved' ? <Check size={12} /> : <ArrowDownRight size={13} />}</span><span className="recent-problem-title">{problem.title}</span><span className={`difficulty-chip difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><time>{fullDateFormat.format(new Date(`${problem.date}T12:00:00`))}</time></button>) : <div className="leet-empty recent-empty">No recent problems match this filter.</div>}</div>
        </section>

        <section className="leet-panel leet-milestone-panel">
          <div className="milestone-heading"><span className="leet-panel-icon orange"><Trophy size={17} /></span><div><strong>Next milestone</strong><small>Keep your practice consistent.</small></div></div>
          <div className="milestone-row"><span>{Math.ceil((summary.totalSolved + 1) / 50) * 50} problems</span><strong>{summary.totalSolved} / {Math.ceil((summary.totalSolved + 1) / 50) * 50}</strong></div>
          <span className="milestone-track"><i style={{ width: `${Math.min(100, summary.totalSolved % 50 * 2)}%` }} /></span>
          <p><ArrowUpRight size={14} /> Every solved problem adds up.</p>
        </section>
      </div>

      <AnimatePresence>
        {modal === 'problem' && <LeetModal title="Log a problem" onClose={() => setModal('')}><form className="modal-form" onSubmit={submitProblem}>
          <label className="field-label">Problem title<input autoFocus className="dashboard-input" maxLength="140" name="title" placeholder="e.g. Two Sum" required /></label>
          <div className="form-grid"><label className="field-label">Difficulty<select className="dashboard-input" name="difficulty">{difficultyOptions.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></label><label className="field-label">Status<select className="dashboard-input" name="status"><option value="solved">Solved</option><option value="attempted">Attempted</option></select></label></div>
          <label className="field-label">Topics <span className="field-optional">Comma-separated</span><input className="dashboard-input" name="topics" placeholder="Array, Hash Table" /></label>
          <div className="form-grid"><label className="field-label">Platform<input className="dashboard-input" maxLength="50" name="platform" defaultValue="LeetCode" /></label><label className="field-label">Time (minutes)<input className="dashboard-input" min="0" max="1440" name="timeMinutes" type="number" defaultValue="0" /></label></div>
          <label className="field-label">Problem URL <span className="field-optional">Optional</span><input className="dashboard-input" name="url" placeholder="https://…" type="url" /></label>
          <label className="field-label">Notes <span className="field-optional">Optional</span><textarea className="dashboard-input leet-notes" maxLength="2000" name="notes" placeholder="Approach, edge cases, or follow-up notes" /></label>
          {formError && <p className="inline-error">{formError}</p>}<div className="date-range-note">Logged on {fullDateFormat.format(new Date(`${focusDate}T12:00:00`))}.</div>
          <div className="modal-actions"><button className="text-button" type="button" onClick={() => setModal('')}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : <><Plus size={14} /> Save problem</>}</button></div>
        </form></LeetModal>}
        {modal === 'goal' && <LeetModal title="Add a daily goal" onClose={() => setModal('')}><form className="modal-form" onSubmit={submitDailyGoal}><label className="field-label">Goal<input autoFocus className="dashboard-input" maxLength="120" name="title" placeholder="e.g. Review yesterday’s solution" required /></label>{formError && <p className="inline-error">{formError}</p>}<div className="modal-actions"><button className="text-button" type="button" onClick={() => setModal('')}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : <><Plus size={14} /> Add goal</>}</button></div></form></LeetModal>}
        {modal === 'target' && <LeetModal title="Daily problem target" onClose={() => setModal('')}><form className="modal-form" onSubmit={submitDailyTarget}><label className="field-label">Problems per day<input autoFocus className="dashboard-input" min="1" max="100" name="target" required type="number" defaultValue={summary.dailyTarget} /></label>{formError && <p className="inline-error">{formError}</p>}<div className="modal-actions"><button className="text-button" type="button" onClick={() => setModal('')}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save target'}</button></div></form></LeetModal>}
        {modal === 'topic' && <LeetModal title={`Set ${selectedTopic} target`} onClose={() => setModal('')}><form className="modal-form" onSubmit={submitTopicTarget}><label className="field-label">Solved problems for mastery<input autoFocus className="dashboard-input" min="1" max="1000" name="target" required type="number" defaultValue={selectedTopicTarget} /></label>{formError && <p className="inline-error">{formError}</p>}<div className="modal-actions"><button className="text-button" type="button" onClick={() => setModal('')}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save target'}</button></div></form></LeetModal>}
      </AnimatePresence>
    </main>
  );
}

export default LeetTrack;