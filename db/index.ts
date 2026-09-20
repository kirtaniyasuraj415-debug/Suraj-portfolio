// MOCKED — in-memory fallback for AI Studio container
const noOp = {
  findMany: async () => [],
  findFirst: async () => null,
  findUnique: async () => null,
  create: async (d: unknown) => (d as { data?: unknown })?.data ?? {},
  update: async (d: unknown) => (d as { data?: unknown })?.data ?? {},
  delete: async () => ({}),
};

export const db: Record<string, unknown> = new Proxy(
  {},
  {
    get: (_, prop) =>
      prop === "query"
        ? new Proxy({}, { get: () => noOp })
        : async () => [],
  }
);

export function getDb() {
  return db;
}

