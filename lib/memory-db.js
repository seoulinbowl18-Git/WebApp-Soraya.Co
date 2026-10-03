// Minimal Mongo-compatible in-memory store used when MONGO_URL is missing or unreachable.
// Data lives on globalThis so it survives dev hot reloads, but is lost on server restart.

function matches(doc, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some((q) => matches(doc, q));
    return doc[key] === value;
  });
}

function project(doc, projection) {
  const copy = { ...doc };
  if (projection && projection._id === 0) delete copy._id;
  return copy;
}

function cursor(docs) {
  let result = [...docs];
  const api = {
    sort(spec = {}) {
      const [[field, dir] = []] = Object.entries(spec);
      if (field) result.sort((a, b) => (a[field] > b[field] ? dir : a[field] < b[field] ? -dir : 0));
      return api;
    },
    limit(n) { result = result.slice(0, n); return api; },
    async toArray() { return result; },
  };
  return api;
}

function createCollection(store) {
  return {
    async countDocuments(query) { return store.filter((d) => matches(d, query)).length; },
    find(query, opts = {}) { return cursor(store.filter((d) => matches(d, query)).map((d) => project(d, opts.projection))); },
    async findOne(query, opts = {}) {
      const doc = store.find((d) => matches(d, query));
      return doc ? project(doc, opts.projection) : null;
    },
    async insertOne(doc) {
      if (!doc._id) doc._id = `mem_${store.length}_${Date.now()}`;
      store.push(doc);
      return { insertedId: doc._id };
    },
    async insertMany(docs) {
      for (const doc of docs) await this.insertOne(doc);
      return { insertedCount: docs.length };
    },
    async updateOne(query, update = {}) {
      const doc = store.find((d) => matches(d, query));
      if (doc && update.$set) Object.assign(doc, update.$set);
      return { matchedCount: doc ? 1 : 0, modifiedCount: doc ? 1 : 0 };
    },
  };
}

export function getMemoryDb() {
  if (!globalThis.__sorayaMemoryDb) {
    const collections = new Map();
    globalThis.__sorayaMemoryDb = {
      isMemory: true,
      collection(name) {
        if (!collections.has(name)) collections.set(name, createCollection([]));
        return collections.get(name);
      },
    };
  }
  return globalThis.__sorayaMemoryDb;
}
