'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import useTodos from '../../lib/useTodos';
import * as sfx from '../../lib/sfx';
import { SovereignPage, SovereignSection, SovereignStatus } from '../SovereignUI';

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
  const { todos, addTodo, toggleDone, toggleTimer, removeTodo, runningCount, pendingCount } = useTodos();
  const [text, setText] = useState('');
  const [selectedPrio, setSelectedPrio] = useState(1);
  const [selectedHours, setSelectedHours] = useState(1);

  const prevRemainingRef = useRef(new Map());

  useEffect(() => {
    sfx.open();
  }, []);

  useEffect(() => {
    const prev = prevRemainingRef.current;
    let alarmNeeded = false;

    todos.forEach((todo) => {
      const prevRemaining = prev.get(todo.id);
      if (todo.remaining === -1 && prevRemaining !== -1 && prev.has(todo.id)) {
        alarmNeeded = true;
      }
      prev.set(todo.id, todo.remaining);
    });

    if (alarmNeeded) sfx.alarm();
  }, [todos]);

  const handleAdd = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addTodo(trimmed, selectedPrio, selectedHours);
    setText('');
    sfx.success();
  }, [text, addTodo, selectedPrio, selectedHours]);

  const handleInputChange = useCallback((e) => {
    setText(e.target.value);
    if (e.nativeEvent?.inputType !== 'deleteContentBackward') {
      sfx.type();
    }
  }, []);

  const handleToggleDone = useCallback((id) => {
    toggleDone(id);
    sfx.success();
  }, [toggleDone]);

  const handleToggleTimer = useCallback((id) => {
    toggleTimer(id);
  }, [toggleTimer]);

  const handleRemove = useCallback((id) => {
    removeTodo(id);
    sfx.close();
  }, [removeTodo]);

  return (
    <SovereignPage moduleLabel="タスク管理">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <SovereignStatus>
          {runningCount > 0 ? (
            <div className="log-item">{`TASKS RUNNING: ${runningCount} // PENDING: ${pendingCount}`}</div>
          ) : (
            <div className="log-item">CENTRAL NEXUS ONLINE // STANDBY</div>
          )}
        </SovereignStatus>

        <div style={{ marginTop: 10 }}>
          <SovereignSection title="[ EXECUTION CONSOLE ]">
            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                value={text}
                onChange={handleInputChange}
                placeholder="ENTER MISSION BRIEF..."
                style={{
                  width: '100%',
                  background: 'rgba(5,8,5,0.9)',
                  border: '1px solid #1a801a',
                  color: '#33ff33',
                  padding: '10px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { sfx.type(); setSelectedPrio(p.value); }}
                  className="action-btn"
                  style={{
                    flex: 1,
                    background: selectedPrio === p.value ? '#33ff33' : 'transparent',
                    color: selectedPrio === p.value ? '#000' : '#33ff33',
                    borderColor: '#33ff33',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {HOURS.map((h) => (
                <button
                  key={h.value}
                  onClick={() => { sfx.type(); setSelectedHours(h.value); }}
                  className="action-btn"
                  style={{
                    flex: 1,
                    background: selectedHours === h.value ? '#33ff33' : 'transparent',
                    color: selectedHours === h.value ? '#000' : '#33ff33',
                    borderColor: '#33ff33',
                  }}
                >
                  {h.label}
                </button>
              ))}
            </div>

            <button className="action-btn" onClick={handleAdd}>
              [ EXECUTE ENTRY ]
            </button>
          </SovereignSection>
        </div>

        <div style={{ marginTop: 20 }}>
          <SovereignSection title="[ ACTIVE MISSIONS ]">
            {todos.length === 0 && <div className="log-item">NO MISSIONS ON FILE.</div>}
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

                  <button
                    onClick={() => handleToggleTimer(todo.id)}
                    className="action-btn"
                    style={{
                      flex: '0 0 auto',
                      width: 80,
                      padding: '8px 0',
                      background: todo.isRunning ? '#33ff33' : 'transparent',
                      color: todo.isRunning ? '#000' : '#33ff33',
                      borderColor: '#33ff33',
                    }}
                  >
                    {todo.isRunning ? '||' : '▶'}
                  </button>

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

                  <button
                    onClick={() => handleRemove(todo.id)}
                    className="action-btn"
                    style={{
                      flex: '0 0 auto',
                      width: 40,
                      padding: '8px 0',
                      background: 'transparent',
                      color: '#ff4444',
                      borderColor: '#ff4444',
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </SovereignSection>
        </div>

        <div className="footer">SOVEREIGN CORE TODO // ACTIVE MONITORING</div>
      </div>
    </SovereignPage>
  );
}
