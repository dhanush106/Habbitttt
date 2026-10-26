export const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekStart = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
};

export const shiftWeek = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount * 7);
  return next;
};

export const getWeekDays = (start) => Array.from({ length: 7 }, (_, index) => {
  const date = new Date(start);
  date.setDate(date.getDate() + index);
  return date;
});

export const formatWeek = (start, end) => {
  const first = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const last = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${first} – ${last}`;
};

export const countHabitStreak = (habit) => {
  const completed = new Set(habit.completedDates);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!completed.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (completed.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};