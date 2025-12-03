'use client';
import { useEffect, useMemo, useState } from 'react';
import { SovereignPage, SovereignStatus } from './SovereignUI';
import { getUploadCount, resetIfNewDay } from '../lib/uploadStore';
import { computeInsights } from '../lib/insights';

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
});

export default function SovereignDash() {
  const [now, setNow] = useState(() => new Date());
  const [dailyCount, setDailyCount] = useState(0);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    resetIfNewDay();
    const count = getUploadCount();
    setDailyCount(count);

    let todoStats;
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('gyo-os-todos');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const total = parsed.length;
            const done = parsed.filter((t) => t && t.done).length;
            const active = total - done;
            todoStats = { total, active, done };
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    setInsights(computeInsights({ uploadCount: count, todoStats }));
  }, []);

  const formattedTime = useMemo(() => timeFormatter.format(now), [now]);
  const formattedDate = useMemo(() => {
    const parts = dateFormatter.formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.year}/${map.month}/${map.day} (${map.weekday})`;
  }, [now]);

  const progress = useMemo(() => {
    const totalSlots = 10;
    const filledSlots = Math.min(dailyCount, totalSlots);
    const emptySlots = totalSlots - filledSlots;
    const filledChar = '█';
    const emptyChar = '░';
    const progressBar = filledChar.repeat(filledSlots) + emptyChar.repeat(emptySlots);
    const ratio = Math.min(dailyCount / totalSlots, 1);
    const percent = Math.round(ratio * 100);
    return { progressBar, percent };
  }, [dailyCount]);

  return (
    <SovereignPage moduleLabel="DASH">
      <SovereignStatus>
        <div className="log-item">TIME (BEIJING): {formattedTime}</div>
        <div className="log-item">DATE: {formattedDate}</div>
      </SovereignStatus>

      <SovereignStatus>
        <div className="log-item">[ DAILY UPLOAD METRICS ]</div>
        <div className="log-item">{`> TODAY: ${dailyCount} / 10`}</div>
        <div className="log-item">{`> PROGRESS: ${progress.progressBar} ${progress.percent}%`}</div>
      </SovereignStatus>

      <SovereignStatus>
        <div className="log-item">主権インサイト</div>
        {insights.map((line, idx) => (
          <div key={idx} className="log-item">{`> ${line}`}</div>
        ))}
      </SovereignStatus>
    </SovereignPage>
  );
}
