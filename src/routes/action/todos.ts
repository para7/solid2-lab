import { action, createOptimisticStore, refresh } from 'solid-js';
import * as api from './api.js';

export type Todo = { id: string; title: string; completed: boolean };

export function createTodos() {
  const [todos, setTodos] = createOptimisticStore(() => api.list(), [] as Todo[]);
  const addTodo = action(function* (title: string) {
    const todo = { id: crypto.randomUUID(), title, completed: false };
    setTodos((list) => {
      list.push(todo);
    });
    yield api.add(todo);
    refresh(todos);
  });

  const removeTodo = action(function* (id: string) {
    setTodos((t) => t.filter((todo) => todo.id !== id));
    yield api.remove(id);
    refresh(todos);
  });

  const toggleTodo = action(function* (id: string, completed: boolean) {
    setTodos((t) => {
      const index = t.findIndex((t) => t.id === id);
      t[index].completed = completed;
    });
    yield api.toggle(id, completed);
    refresh(todos);
  });
  return [todos, { addTodo, removeTodo, toggleTodo }] as const;
}
