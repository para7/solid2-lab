'use server';
import { deleteTodo, insertTodo, listTodos, updateTodo } from '../../server/db';
import type { Todo } from './todos.js';

export async function list(): Promise<Todo[]> {
  return listTodos();
}

export async function add(todo: Todo) {
  insertTodo(todo);
}

export async function toggle(id: string, completed: boolean) {
  updateTodo(id, { completed });
}

export async function remove(id: string) {
  deleteTodo(id);
}
