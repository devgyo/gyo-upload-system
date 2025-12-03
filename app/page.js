'use client';
import { useEffect, useMemo, useState } from 'react';
import { SovereignPage, SovereignStatus } from './SovereignUI';

const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
});

export default function SovereignDash() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo(() => timeFormatter.format(now), [now]);
  const formattedDate = useMemo(() => {
    const parts = dateFormatter.formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.year}/${map.month}/${map.day} (${map.weekday})`;
  }, [now]);

  return (
    <SovereignPage moduleLabel="DASH">
      <SovereignStatus>
        <div className="log-item">TIME (BEIJING): {formattedTime}</div>
        <div className="log-item">DATE: {formattedDate}</div>
      </SovereignStatus>
    </SovereignPage>
  );
}
