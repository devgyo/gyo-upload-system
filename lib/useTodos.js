import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'gyo-os-todos';
const VALID_LEVELS = [1, 2, 3];

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const sanitizeTodos = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((todo) => {
      const hours = VALID_LEVELS.includes(todo?.hours) ? todo.hours : 1;
      const remaining =
        typeof todo?.remaining === 'number'
          ? todo.remaining
          : hours * 3600;

      const text = typeof todo?.text === 'string' ? todo.text.trim() : '';
      if (!text) return null;

      return {
        id: typeof todo?.id === 'string' && todo.id ? todo.id : createId(),
        text,
        prio: VALID_LEVELS.includes(todo?.prio) ? todo.prio : 1,
        hours,
        done: Boolean(todo?.done),
        isRunning: Boolean(todo?.isRunning) && !todo?.done && remaining > 0,
        remaining,
      };
    })
    .filter(Boolean);
};

const sortTodos = (todos) => {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.isRunning !== b.isRunning) return a.isRunning ? -1 : 1;
    if (a.prio !== b.prio) return b.prio - a.prio;
    if (a.remaining !== b.remaining) return a.remaining - b.remaining;
    return a.text.localeCompare(b.text);
  });
};

const tickTodos = (todos) => {
  let changed = false;
  const updated = todos.map((todo) => {
    if (todo.done || !todo.isRunning) return todo;
    if (todo.remaining <= 0) {
      if (todo.remaining === -1) return todo;
      changed = true;
      return { ...todo, remaining: -1, isRunning: false };
    }

    const nextRemaining = todo.remaining - 1;
    if (nextRemaining <= 0) {
      changed = true;
      return { ...todo, remaining: -1, isRunning: false };
    }

    changed = true;
    return { ...todo, remaining: nextRemaining };
  });

  return changed ? updated : todos;
};

export default function useTodos() {
  const [todos, setTodos] = useState([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || initializedRef.current) return;
    initializedRef.current = true;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setTodos([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setTodos(sanitizeTodos(parsed));
    } catch (err) {
      console.warn('Failed to parse todos from storage, resetting.', err);
      window.localStorage.removeItem(STORAGE_KEY);
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      console.warn('Failed to persist todos.', err);
    }
  }, [todos]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTodos((prev) => tickTodos(prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTodo = useCallback((text, prio, hours) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    const safePrio = VALID_LEVELS.includes(prio) ? prio : 1;
    const safeHours = VALID_LEVELS.includes(hours) ? hours : 1;

    setTodos((prev) => [
      ...prev,
      {
        id: createId(),
        text: trimmed,
        prio: safePrio,
        hours: safeHours,
        done: false,
        isRunning: false,
        remaining: safeHours * 3600,
      },
    ]);
  }, []);

  const toggleDone = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== id) return todo;
        const nextDone = !todo.done;
        return {
          ...todo,
          done: nextDone,
          isRunning: nextDone ? false : todo.isRunning,
        };
      })
    );
  }, []);

  const toggleTimer = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== id) return todo;
        if (todo.done || todo.remaining === -1) return todo;
        return { ...todo, isRunning: !todo.isRunning };
      })
    );
  }, []);

  const removeTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const sortedTodos = useMemo(() => sortTodos(todos), [todos]);

  const runningCount = useMemo(
    () => todos.filter((todo) => todo.isRunning && !todo.done).length,
    [todos]
  );
  const pendingCount = useMemo(
    () => todos.filter((todo) => !todo.done).length,
    [todos]
  );

  return {
    todos: sortedTodos,
    addTodo,
    toggleDone,
    toggleTimer,
    removeTodo,
    runningCount,
    pendingCount,
  };
}
