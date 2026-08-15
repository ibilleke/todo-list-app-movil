export type JsonPlaceholderTodo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

const TODOS_URL = "https://jsonplaceholder.typicode.com/todos";

export async function fetchTodos(): Promise<JsonPlaceholderTodo[]> {
  const response = await fetch(TODOS_URL);
  if (!response.ok) {
    throw new Error(`JSONPlaceholder respondió con estado ${response.status}`);
  }
  return (await response.json()) as JsonPlaceholderTodo[];
}
