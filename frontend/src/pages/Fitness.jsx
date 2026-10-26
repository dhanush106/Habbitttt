import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  Plus,
  Scale,
  Target,
  Trash2,
  Trophy,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import { formatWeek, getWeekDays, getWeekStart, shiftWeek, toDateKey } from '../lib/dates';
import { useFitnessStore } from '../stores/fitnessStore';

const dayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const measurementMeta = {
  weight: { label: 'Weight', unit: 'kg', icon: Weight, color: 'lime' },
  bmi: { label: 'BMI', unit: 'kg/m2', icon: Activity, color: 'violet' },
  bodyFat: { label: 'Body fat', unit: '%', icon: HeartPulse, color: 'pink' },
  muscleMass: { label: 'Muscle mass', unit: 'kg', icon: Zap, color: 'blue' },
  waterIntake: { label: 'Water', unit: 'L', icon: Droplets, color: 'cyan' },
};

function FitnessModal({ title, onClose, children }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="fitness-modal-title" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}>
        <header className="modal-header"><h2 id="fitness-modal-title">{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={17} /></button></header>
        {children}
      </motion.section>
    </motion.div>
  );
}

function WeightChart({ entries }) {
  const points = useMemo(() => {
    if (!entries.length) return [];
    const values = entries.map((entry) => entry.value);
    const low = Math.min(...values) - 1;
    const high = Math.max(...values) + 1;
    const span = Math.max(high - low, 1);
    return entries.map((entry, index) => ({
      ...entry,
      x: entries.length === 1 ? 50 : 5 + (index / (entries.length - 1)) * 90,
      y: 88 - ((entry.value - low) / span) * 72,
    }));
  }, [entries]);
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const current = points.at(-1);
  return (
    <div className="weight-chart-wrap">
      {points.length ? <>
        <div className="chart-y-labels"><span>{numberFormat.format(Math.max(...entries.map((item) => item.value)))} kg</span><span>{numberFormat.format(Math.min(...entries.map((item) => item.value)))} kg</span></div>
        <svg className="weight-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Weight history chart">
          <defs><linearGradient id="weight-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#72e78c" stopOpacity=".23" /><stop offset="100%" stopColor="#72e78c" stopOpacity="0" /></linearGradient></defs>
          {[20, 42, 64, 88].map((y) => <line className="chart-grid-line" key={y} x1="0" x2="100" y1={y} y2={y} />)}
          <path d={`${path} L ${current?.x ?? 0} 100 L ${points[0]?.x ?? 0} 100 Z`} fill="url(#weight-area)" />
          <path d={path} className="weight-line" />
          {points.map((point) => <circle className="weight-point" cx={point.x} cy={point.y} key={`${point.date}-${point._id}`} r="1.2"><title>{`${point.value} kg · ${point.date}`}</title></circle>)}
        </svg>
        <div className="chart-x-labels"><span>{entries[0].date}</span><span>{current?.date}</span></div>
      </> : <div className="chart-empty"><Scale size={23} /><span>Log your weight to start a trend.</span></div>}
    </div>
  );
}

function Fitness() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [modal, setModal] = useState('');
  const [goalKind, setGoalKind] = useState('activity');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const workouts = useFitnessStore((state) => state.workouts);
  const measurements = useFitnessStore((state) => state.measurements);
  const weightHistory = useFitnessStore((state) => state.weightHistory);
  const goals = useFitnessStore((state) => state.goals);
  const summary = useFitnessStore((state) => state.summary);
  const loading = useFitnessStore((state) => state.loading);
  const error = useFitnessStore((state) => state.error);
  const loadDashboard = useFitnessStore((state) => state.loadDashboard);
  const clearError = useFitnessStore((state) => state.clearError);
  const createWorkout = useFitnessStore((state) => state.createWorkout);
  const deleteWorkout = useFitnessStore((state) => state.deleteWorkout);
  const saveMeasurement = useFitnessStore((state) => state.saveMeasurement);
  const createGoal = useFitnessStore((state) => state.createGoal);
  const deleteGoal = useFitnessStore((state) => state.deleteGoal);

  const days = getWeekDays(weekStart);
  const startDate = toDateKey(days[0]);
  const endDate = toDateKey(days[6]);
  const selectedWorkouts = workouts.filter((workout) => workout.date === selectedDate);
  const weekWeight = measurements.find((measurement) => measurement.type === 'weight');
  const weightGoal = goals.find((goal) => goal.kind === 'weight');
  const activeDays = new Set(summary.dailyActivity.map((activityDay) => activityDay.date)).size;
  const totalDuration = summary.durationMinutes;

  useEffect(() => {
    loadDashboard(startDate, endDate).catch(() => {});
  }, [endDate, loadDashboard, startDate]);

  const execute = async (action) => {
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

  const changeWeek = (offset) => {
    const next = shiftWeek(weekStart, offset);
    setWeekStart(next);
    const nextDays = getWeekDays(next);
    setSelectedDate(toDateKey(nextDays[0]));
  };

  const submitWorkout = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void execute(() => createWorkout({
      exercise: form.get('exercise'),
      category: form.get('category'),
      details: form.get('details'),
      amount: Number(form.get('amount')),
      unit: form.get('unit'),
      durationMinutes: Number(form.get('durationMinutes') || 0),
      calories: Number(form.get('calories') || 0),
      date: selectedDate,
    }));
  };

  const submitMeasurement = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void execute(() => saveMeasurement({ type: form.get('type'), value: Number(form.get('value')), date: selectedDate }));
  };

  const submitGoal = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = form.get('kind');
    const unit = kind === 'weight' ? 'kg' : form.get('unit');
    void execute(() => createGoal({
      name: form.get('name'),
      kind,
      exercise: kind === 'weight' ? 'weight' : form.get('exercise'),
      unit,
      target: Number(form.get('target')),
      startDate,
      endDate,
    }));
  };

  const shiftSelectedDay = (amount) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + amount);
    setSelectedDate(toDateKey(date));
  };

  return (
    <main className="fitness-page">
      <motion.header className="fitness-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="fitness-brand"><span className="fitness-brand-mark"><Activity size={22} /></span><div><h1>FitTrack</h1><p>Train with intention. See your progress.</p></div></div>
        <div className="fitness-week-nav"><button className="icon-button" onClick={() => changeWeek(-1)} type="button" aria-label="Previous week"><ArrowLeft size={15} /></button><span>{formatWeek(days[0], days[6])}</span><button className="icon-button" onClick={() => changeWeek(1)} type="button" aria-label="Next week"><ArrowRight size={15} /></button><button className="text-button" onClick={() => { const start = getWeekStart(); setWeekStart(start); setSelectedDate(toDateKey(new Date())); }} type="button">This week</button><button className="primary-button" onClick={() => setModal('workout')} type="button"><Plus size={15} /> Log workout</button></div>
      </motion.header>

      <AnimatePresence>{(error || formError) && <motion.div className="notice notice-error fitness-notice" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{formError || error}<button onClick={() => { setFormError(''); clearError(); }} type="button" aria-label="Dismiss error"><X size={15} /></button></motion.div>}</AnimatePresence>

      <section className="fitness-summary-grid" aria-label="Weekly fitness summary">
        <motion.article className="fitness-stat stat-weight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}><span className="stat-icon"><Weight size={18} /></span><span className="stat-label">Current weight</span><strong>{weekWeight ? `${numberFormat.format(weekWeight.value)} kg` : '—'}</strong><small>{weightGoal ? `Goal: ${numberFormat.format(weightGoal.target)} kg` : 'Add a weight goal'}</small></motion.article>
        <motion.article className="fitness-stat stat-workouts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}><span className="stat-icon"><Zap size={18} /></span><span className="stat-label">Total workouts</span><strong>{summary.workouts}</strong><small>{numberFormat.format(totalDuration)} active minutes</small><div className="stat-spark spark-blue"><i /><i /><i /><i /><i /></div></motion.article>
        <motion.article className="fitness-stat stat-calories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}><span className="stat-icon"><Flame size={18} /></span><span className="stat-label">Calories burned</span><strong>{numberFormat.format(summary.calories)} kcal</strong><small>Logged this week</small><div className="stat-spark spark-orange"><i /><i /><i /><i /><i /></div></motion.article>
        <motion.article className="fitness-stat stat-active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}><span className="stat-icon"><CalendarDays size={18} /></span><span className="stat-label">Active days</span><strong>{activeDays} / 7</strong><small>{activeDays ? 'Keep your rhythm going' : 'Start with one session'}</small><div className="active-dots">{days.map((day) => <i className={summary.dailyActivity.some((item) => item.date === toDateKey(day)) ? 'on' : ''} key={toDateKey(day)} />)}</div></motion.article>
      </section>

      <div className="fitness-main-grid">
        <section className="fitness-panel weight-panel">
          <header className="fitness-panel-heading"><div><span className="panel-glyph violet"><Scale size={18} /></span><span><h2>Weight tracker</h2><small>Your recent measurements</small></span></div><button className="text-button compact" onClick={() => setModal('measurement')} type="button"><Plus size={13} /> Measurement</button></header>
          <WeightChart entries={weightHistory} />
          <div className="weight-foot"><div><strong>{weekWeight ? `${numberFormat.format(weekWeight.value)} kg` : '—'}</strong><span>Current</span></div><div><strong>{weightHistory.length ? `${numberFormat.format(Math.max(...weightHistory.map((entry) => entry.value)))} kg` : '—'}</strong><span>Highest</span></div><div><strong>{weightHistory.length ? `${numberFormat.format(Math.min(...weightHistory.map((entry) => entry.value)))} kg` : '—'}</strong><span>Lowest</span></div><div><strong>{weightGoal ? `${numberFormat.format(weightGoal.target)} kg` : '—'}</strong><span>Goal</span></div></div>
        </section>

        <section className="fitness-panel daily-workout-panel">
          <header className="fitness-panel-heading"><div><span className="panel-glyph green"><Footprints size={18} /></span><span><h2>Workout log</h2><small>{dateFormat.format(new Date(`${selectedDate}T12:00:00`))}</small></span></div><div className="day-nav"><button className="icon-button" onClick={() => shiftSelectedDay(-1)} type="button" aria-label="Previous day"><ArrowLeft size={14} /></button><button className="icon-button" onClick={() => shiftSelectedDay(1)} type="button" aria-label="Next day"><ArrowRight size={14} /></button></div></header>
          <div className="workout-list">
            {loading && !workouts.length ? <div className="fitness-empty">Loading workouts…</div> : selectedWorkouts.length ? selectedWorkouts.map((workout) => <article className="workout-row" key={workout._id}>
              <span className={`workout-icon workout-${workout.category.toLowerCase()}`}><Activity size={18} /></span><span className="workout-description"><strong>{workout.exercise}</strong><small>{workout.details || workout.category}</small></span><span className="workout-progress"><strong>{numberFormat.format(workout.amount)} {workout.unit}</strong><small>{workout.durationMinutes} min · {workout.calories} kcal</small></span><button className="row-action" type="button" title="Delete workout" aria-label={`Delete ${workout.exercise}`} onClick={() => void execute(() => deleteWorkout(workout._id))}><Trash2 size={14} /></button>
            </article>) : <div className="fitness-empty"><span className="empty-icon"><Footprints size={20} /></span><strong>No workouts logged for this day.</strong><button className="text-button" type="button" onClick={() => setModal('workout')}><Plus size={14} /> Log a workout</button></div>}
          </div>
        </section>

        <section className="fitness-panel activity-panel">
          <header className="fitness-panel-heading"><div><span className="panel-glyph pink"><Activity size={18} /></span><span><h2>Weekly activity</h2><small>Sessions and duration per day</small></span></div><div className="activity-legend"><span><i className="legend-minutes" /> Minutes</span><span><i className="legend-sessions" /> Sessions</span></div></header>
          <div className="activity-chart">
            {days.map((day) => {
              const date = toDateKey(day);
              const activityDay = summary.dailyActivity.find((item) => item.date === date);
              const maxMinutes = Math.max(...summary.dailyActivity.map((item) => item.durationMinutes), 1);
              const minutesHeight = Math.max(5, ((activityDay?.durationMinutes || 0) / maxMinutes) * 100);
              const sessionHeight = Math.max(5, ((activityDay?.workouts || 0) / Math.max(...summary.dailyActivity.map((item) => item.workouts), 1)) * 100);
              return <button className={`activity-day${selectedDate === date ? ' selected' : ''}`} key={date} type="button" onClick={() => setSelectedDate(date)}><span className="activity-bars"><i className="bar-minutes" style={{ height: `${minutesHeight}%` }} /><i className="bar-sessions" style={{ height: `${sessionHeight}%` }} /></span><strong>{dayFormat.format(day)}</strong><small>{day.getDate()}</small></button>;
            })}
          </div>
        </section>

        <section className="fitness-panel goals-panel">
          <header className="fitness-panel-heading"><div><span className="panel-glyph lime"><Target size={18} /></span><span><h2>Goals & progress</h2><small>Fitness targets for your week</small></span></div><button className="text-button compact" onClick={() => { setGoalKind('activity'); setModal('goal'); }} type="button"><Plus size={13} /> Add goal</button></header>
          <div className="fitness-goal-list">
            {goals.length ? goals.map((goal) => <article className="fitness-goal-row" key={goal._id}><span className={`goal-icon goal-${goal.kind}`}><Target size={16} /></span><span className="fitness-goal-copy"><strong>{goal.name}</strong><small>{goal.kind === 'weight' ? 'Body target' : goal.exercise || 'All activities'}</small></span><span className="fitness-goal-measure"><span className="goal-track"><i style={{ width: `${goal.percentage}%` }} /></span><small>{numberFormat.format(goal.progress)} / {numberFormat.format(goal.target)} {goal.unit}</small></span><span className={`goal-state ${goal.status}`}>{goal.status === 'completed' ? <Trophy size={14} /> : <ChevronRight size={15} />}</span><button className="row-action" type="button" title="Delete goal" aria-label={`Delete ${goal.name}`} onClick={() => void execute(() => deleteGoal(goal._id))}><Trash2 size={13} /></button></article>) : <div className="fitness-empty compact-empty">Set a target to make your progress measurable.<button className="text-button" type="button" onClick={() => setModal('goal')}><Plus size={14} /> Add a goal</button></div>}
          </div>
        </section>

        <section className="fitness-panel recent-panel">
          <header className="fitness-panel-heading"><div><span className="panel-glyph violet"><Clock3 size={18} /></span><span><h2>Recent entries</h2><small>Latest logged sessions this week</small></span></div><span className="entry-count">{workouts.length} sessions</span></header>
          <div className="recent-table-scroll"><table className="recent-table"><thead><tr><th>Date</th><th>Workout</th><th>Details</th><th>Time</th><th>Calories</th><th /></tr></thead><tbody>{workouts.slice(0, 8).map((workout) => <tr key={workout._id}><td>{dateFormat.format(new Date(`${workout.date}T12:00:00`))}</td><td><span className="recent-type"><Activity size={14} />{workout.exercise}</span></td><td>{numberFormat.format(workout.amount)} {workout.unit}</td><td>{workout.durationMinutes} min</td><td>{workout.calories} kcal</td><td><button className="row-action" type="button" title="Delete workout" aria-label={`Delete ${workout.exercise}`} onClick={() => void execute(() => deleteWorkout(workout._id))}><Trash2 size={13} /></button></td></tr>)}{!workouts.length && <tr><td className="recent-empty" colSpan="6">Your logged workouts will appear here.</td></tr>}</tbody></table></div>
        </section>

        <section className="fitness-panel body-panel">
          <header className="fitness-panel-heading"><div><span className="panel-glyph violet"><HeartPulse size={18} /></span><span><h2>Body stats</h2><small>Latest recorded measurements</small></span></div><button className="text-button compact" onClick={() => setModal('measurement')} type="button"><Plus size={13} /> Add</button></header>
          <div className="body-stat-grid">{Object.entries(measurementMeta).map(([type, meta]) => {
            const measurement = measurements.find((item) => item.type === type);
            const Icon = meta.icon;
            return <article className={`body-stat body-${meta.color}`} key={type}><Icon size={17} /><span>{meta.label}</span><strong>{measurement ? numberFormat.format(measurement.value) : '—'} <small>{meta.unit}</small></strong></article>;
          })}</div>
        </section>
      </div>

      <AnimatePresence>
        {modal === 'workout' && <FitnessModal title="Log a workout" onClose={() => setModal('')}><form className="modal-form" onSubmit={submitWorkout}>
          <label className="field-label">Exercise<input autoFocus className="dashboard-input" maxLength="80" name="exercise" placeholder="e.g. Cardio, Squats" required /></label>
          <div className="form-grid"><label className="field-label">Category<select className="dashboard-input" name="category"><option>Cardio</option><option>Strength</option><option>Core</option><option>Mobility</option><option>Other</option></select></label><label className="field-label">Details<input className="dashboard-input" maxLength="160" name="details" placeholder="Running, bodyweight…" /></label></div>
          <div className="form-grid"><label className="field-label">Amount<input className="dashboard-input" min="0.01" name="amount" required step="any" type="number" /></label><label className="field-label">Unit<select className="dashboard-input" name="unit"><option value="km">km</option><option value="reps">reps</option><option value="min">min</option><option value="workouts">workouts</option></select></label></div>
          <div className="form-grid"><label className="field-label">Duration (minutes)<input className="dashboard-input" min="0" name="durationMinutes" type="number" defaultValue="0" /></label><label className="field-label">Calories<input className="dashboard-input" min="0" name="calories" type="number" defaultValue="0" /></label></div>
          <p className="date-range-note">Logged on {dateFormat.format(new Date(`${selectedDate}T12:00:00`))}.</p>{formError && <p className="inline-error">{formError}</p>}
          <div className="modal-actions"><button className="text-button" type="button" onClick={() => setModal('')}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : <><Plus size={14} /> Save workout</>}</button></div>
        </form></FitnessModal>}
        {modal === 'measurement' && <FitnessModal title="Add body measurement" onClose={() => setModal('')}><form className="modal-form" onSubmit={submitMeasurement}>
          <label className="field-label">Measurement<select className="dashboard-input" name="type">{Object.entries(measurementMeta).map(([type, meta]) => <option key={type} value={type}>{meta.label} ({meta.unit})</option>)}</select></label>
          <label className="field-label">Value<input autoFocus className="dashboard-input" min="0.01" name="value" required step="any" type="number" /></label>
          <p className="date-range-note">Recorded on {dateFormat.format(new Date(`${selectedDate}T12:00:00`))}. Existing values for the day are updated.</p>{formError && <p className="inline-error">{formError}</p>}
          <div className="modal-actions"><button className="text-button" type="button" onClick={() => setModal('')}>Cancel</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : <><Check size={14} /> Save measurement</>}</button></div>
        </form></FitnessModal>}
        {modal === 'goal' && <FitnessModal title="Create a fitness goal" onClose={() => setModal('')}><form className="modal-form" onSubmit={submitGoal}>
          <label className="field-label">Goal type<select className="dashboard-input" name="kind" value={goalKind} onChange={(event) => setGoalKind(event.target.value)}><option value="activity">Activity goal</option><option value="weight">Weight goal</option></select></label>
          <label className="field-label">Goal name<input autoFocus className="dashboard-input" maxLength="100" name="name" placeholder={goalKind === 'weight' ? 'Weight goal' : 'e.g. Run 5 km'} required /></label>
          {goalKind === 'activity' && <div className="form-grid"><label className="field-label">Exercise<input className="dashboard-input" maxLength="80" name="exercise" placeholder="Run, Squats…" /></label><label className="field-label">Unit<select className="dashboard-input" name="unit"><option value="km">km</option><option value="reps">reps</option><option value="min">min</option><option value="workouts">workouts</option></select></label></div>}
          <label className="field-label">{goalKind === 'weight' ? 'Target weight (kg)' : 'Target'}<input className="dashboard-input" min="0.01" name="target" required step="any" type="number" /></label>
          <p className="date-range-note">This goal runs {formatWeek(days[0], days[6])}.{goalKind === 'weight' && !weekWeight && ' Log a weight measurement before creating this goal.'}</p>{formError && <p className="inline-error">{formError}</p>}
          <div className="modal-actions"><button className="text-button" type="button" onClick={() => setModal('')}>Cancel</button><button className="primary-button" type="submit" disabled={busy || (goalKind === 'weight' && !weekWeight)}>{busy ? 'Saving…' : <><Target size={14} /> Save goal</>}</button></div>
        </form></FitnessModal>}
      </AnimatePresence>
    </main>
  );
}

export default Fitness;