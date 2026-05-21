import { useState } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW    = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const COLORS  = ['#60a5fa','#4ade80','#f87171','#c084fc','#fb923c','#34d399','#f472b6'];

function nameColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return m === '00' ? h : `${Number(h)}:${m}`;
}

function pillLabel(b, dateStr) {
  const name = b.booker.split(' ')[0];
  const isStart = b.start_date === dateStr;
  const isEnd   = b.end_date   === dateStr;
  if (isStart && isEnd) return `${name} ${fmtTime(b.start_time)}-${fmtTime(b.end_time)}`;
  if (isStart)          return `${name} ${fmtTime(b.start_time)}→`;
  if (isEnd)            return `${name} →${fmtTime(b.end_time)}`;
  return name;
}

export default function Calendar({ bookings }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prev() { month === 0  ? (setYear(y => y-1), setMonth(11)) : setMonth(m => m-1); }
  function next() { month === 11 ? (setYear(y => y+1), setMonth(0))  : setMonth(m => m+1); }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow    = new Date(year, month, 1).getDay();
  const today       = toStr(now);

  // Build dateStr -> [booking, ...] map
  const dateMap = {};
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    let d = new Date(b.start_date + 'T00:00:00');
    const endDay = new Date(b.end_date + 'T00:00:00');
    while (d <= endDay) {
      const key = toStr(d);
      if (!dateMap[key]) dateMap[key] = [];
      dateMap[key].push(b);
      d.setDate(d.getDate() + 1);
    }
  }

  const cells = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      return { day, dateStr };
    }),
  ];

  const bookers = [...new Map(
    bookings.filter(b => b.status !== 'cancelled').map(b => [b.booker, b])
  ).values()];

  return (
    <div className="calendar">
      <div className="cal-nav">
        <button type="button" onClick={prev}>‹</button>
        <strong>{MONTHS[month]} {year}</strong>
        <button type="button" onClick={next}>›</button>
      </div>

      <div className="cal-grid">
        {DOW.map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="cal-cell empty" />;
          const { day, dateStr } = cell;
          const entries = dateMap[dateStr] || [];
          const isToday = dateStr === today;
          return (
            <div key={i} className={`cal-cell${isToday ? ' today' : ''}`}>
              <span className="day-num">{day}</span>
              {entries.slice(0, 2).map((b, j) => (
                <div
                  key={j}
                  className="booking-pill"
                  style={{ background: nameColor(b.booker) }}
                  title={`${b.booker}${b.note ? ' — ' + b.note : ''}`}
                >
                  {pillLabel(b, dateStr)}
                </div>
              ))}
              {entries.length > 2 && (
                <div className="pill-more">+{entries.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>

      {bookers.length > 0 && (
        <div className="cal-legend">
          {bookers.map(b => (
            <span key={b.booker} className="legend-dot" style={{ background: nameColor(b.booker) }}>
              {b.booker.split(' ')[0]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
