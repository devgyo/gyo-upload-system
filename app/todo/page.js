'use client';
import { useEffect, useState } from 'react';
import useTodos from '../../lib/useTodos';
import { SovereignPage, SovereignSection, SovereignButton } from '../SovereignUI';

const PRIORITIES = [
  { label: '*', value: 1 },
  { label: '**', value: 2 },
  { label: '***', value: 3 },
];

const HOURS = [
  { label: '1H', value: 1 },
  { label: '2H', value: 2 },
  { label: '3H', value: 3 },
];

const formatTime = (seconds) => {
  if (seconds < 0) return '期限切れ';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs]
    .map((unit) => unit.toString().padStart(2, '0'))
    .join(':');
};

export default function TodoTerminal() {
  const { todos, addTodo, toggleDone, toggleTimer, removeTodo } = useTodos();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [missionText, setMissionText] = useState('');
  const [selectedPrio, setSelectedPrio] = useState(1);
  const [selectedHours, setSelectedHours] = useState(1);

  useEffect(() => {
    const handler = (event) => {
      if (event.shiftKey && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        setIsPopupOpen(true);
      }
      if (event.key === 'Escape') {
        setIsPopupOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAdd = () => {
    const trimmed = missionText.trim();
    if (!trimmed) return;
    addTodo(trimmed, selectedPrio, selectedHours);
    setMissionText('');
    setSelectedPrio(1);
    setSelectedHours(1);
    setIsPopupOpen(false);
  };

  const handleToggleDone = (id) => {
    toggleDone(id);
  };

  const handleToggleTimer = (id) => {
    toggleTimer(id);
  };

  const handleRemove = (id) => {
    removeTodo(id);
  };

  return (
    <SovereignPage moduleLabel="タスク管理">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {todos.length === 0 ? (
          <div className="quote-box">
            <div className="log-item">「まだタスクが作成されていません。」</div>
          </div>
        ) : (
          <SovereignSection title="[ ACTIVE MISSIONS ]">
            {todos.map((todo) => {
              const isExpired = todo.remaining === -1;
              const displayTime = isExpired
                ? '期限切れ'
                : todo.isRunning || todo.remaining !== todo.hours * 3600
                  ? formatTime(Math.max(0, todo.remaining))
                  : `${todo.hours}H`;

              return (
                <div
                  key={todo.id}
                  className="log-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    opacity: todo.done ? 0.4 : 1,
                    textDecoration: todo.done ? 'line-through' : 'none',
                  }}
                >
                  <div
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => handleToggleDone(todo.id)}
                  >
                    <div style={{ fontWeight: 600 }}>{todo.text}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {'★'.repeat(todo.prio).padEnd(3, '☆')}
                    </div>
                  </div>

                  <div style={{ width: 80 }}>
                    <SovereignButton
                      variant="ghost"
                      onClick={() => handleToggleTimer(todo.id)}
                    >
                      {todo.isRunning ? '||' : '▶'}
                    </SovereignButton>
                  </div>

                  <div
                    style={{
                      width: 110,
                      textAlign: 'center',
                      color: isExpired ? '#ff4444' : '#33ff33',
                      fontWeight: isExpired ? 'bold' : 'normal',
                    }}
                  >
                    {displayTime}
                  </div>

                  <div style={{ width: 40 }}>
                    <SovereignButton variant="ghost" onClick={() => handleRemove(todo.id)}>
                      ×
                    </SovereignButton>
                  </div>
                </div>
              );
            })}
          </SovereignSection>
        )}

        <div style={{ marginTop: 20 }}>
          <SovereignButton variant="ghost" onClick={() => setIsPopupOpen(true)}>
            [ OPEN TASK PANEL ]
          </SovereignButton>
        </div>

        <div className="footer">SOVEREIGN CORE TODO // ACTIVE MONITORING</div>
      </div>

      {isPopupOpen && (
        <div className="sovereign-popup">
          <div className="popup-header">
            <span>NEW TASK</span>
            <button
              className="popup-close"
              type="button"
              onClick={() => setIsPopupOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="popup-body">
            <input
              type="text"
              value={missionText}
              onChange={(e) => setMissionText(e.target.value)}
              placeholder="ENTER MISSION BRIEF..."
            />
            <div className="popup-group">
              {PRIORITIES.map((p) => (
                <SovereignButton
                  key={p.value}
                  variant="ghost"
                  className={selectedPrio === p.value ? 'active' : ''}
                  onClick={() => setSelectedPrio(p.value)}
                >
                  {p.label}
                </SovereignButton>
              ))}
            </div>
            <div className="popup-group">
              {HOURS.map((h) => (
                <SovereignButton
                  key={h.value}
                  variant="ghost"
                  className={selectedHours === h.value ? 'active' : ''}
                  onClick={() => setSelectedHours(h.value)}
                >
                  {h.label}
                </SovereignButton>
              ))}
            </div>
            <SovereignButton variant="primary" onClick={handleAdd}>
              [ EXECUTE ENTRY ]
            </SovereignButton>
          </div>
        </div>
      )}
    </SovereignPage>
  );
}
