import { For } from 'solid-js';
import { createTodos, type Todo } from './todos.js';

const ENTER_KEY = 13;

export default function App() {
  const [todos, { addTodo, removeTodo, toggleTodo }] = createTodos();

  const onInput = ({ currentTarget: target, keyCode }: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    const title = target.value.trim();
    if (keyCode === ENTER_KEY && title) {
      addTodo(title);
      target.value = '';
    }
  };

  return (
    <section class="todoapp">
      <input
        class="new-todo"
        placeholder="What needs to be done?"
        onKeyDown={onInput}
      />
      <ul class="todo-list">
        <For each={todos}>
          {(todo) => (
            <TodoItem todo={todo} onToggle={toggleTodo} onRemove={removeTodo} />
          )}
        </For>
      </ul>
    </section>
  );
}

function TodoItem(props: {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const onToggleChange = ({ currentTarget: { checked } }: Event & { currentTarget: HTMLInputElement }) => {
    props.onToggle(props.todo.id, checked);
  };

  const onRemoveClick = () => {
    props.onRemove(props.todo.id);
  };

  return (
    <li class={['todo', { completed: props.todo.completed }]}>
      <div class="view">
        <input
          class="toggle"
          type="checkbox"
          checked={props.todo.completed}
          onChange={onToggleChange}
        />
        <label>{props.todo.title}</label>
        <button class="destroy" onClick={onRemoveClick} />
      </div>
    </li>
  );
}