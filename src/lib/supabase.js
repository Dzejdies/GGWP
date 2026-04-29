// Stub — migracja do własnego API w toku. Usuń gdy INT-53 ukończony.
const makeProxy = () => {
  const handler = {
    get(_, prop) {
      if (prop === 'then' || prop === Symbol.toPrimitive) return undefined
      return makeProxy()
    },
    apply() {
      const result = Promise.resolve({ data: null, error: null })
      return Object.assign(result, {
        eq: () => makeProxy(),
        neq: () => makeProxy(),
        in: () => makeProxy(),
        order: () => makeProxy(),
        limit: () => makeProxy(),
        single: () => makeProxy(),
        select: () => makeProxy(),
        insert: () => makeProxy(),
        update: () => makeProxy(),
        delete: () => makeProxy(),
        upsert: () => makeProxy(),
        filter: () => makeProxy(),
        ilike: () => makeProxy(),
      })
    },
    construct() { return {} }
  }
  return new Proxy(function () {}, handler)
}

export const supabase = makeProxy()
