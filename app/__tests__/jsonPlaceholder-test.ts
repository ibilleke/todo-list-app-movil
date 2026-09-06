import { fetchTodos, syncTask } from "../src/api/jsonPlaceholder";

describe("jsonPlaceholder API", () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("fetchTodos returns the parsed list on a successful response", async () => {
    const todos = [{ userId: 1, id: 1, title: "delectus aut autem", completed: false }];
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => todos,
    });

    const result = await fetchTodos();

    expect(globalThis.fetch).toHaveBeenCalledWith("https://jsonplaceholder.typicode.com/todos");
    expect(result).toEqual(todos);
  });

  test("fetchTodos throws when the response is not ok", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => [],
    });

    await expect(fetchTodos()).rejects.toThrow("JSONPlaceholder respondió con estado 500");
  });

  test("syncTask posts the task payload and resolves on success", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    });

    await syncTask({ title: "Comprar café", completed: false });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/todos",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Comprar café", completed: false, userId: 1 }),
      })
    );
  });

  test("syncTask throws when the response is not ok", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(syncTask({ title: "x", completed: true })).rejects.toThrow(
      "JSONPlaceholder respondió con estado 503"
    );
  });
});
