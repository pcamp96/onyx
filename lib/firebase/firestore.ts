import { getServerEnv } from "@/lib/config/env";
import { getGoogleAccessToken } from "@/lib/firebase/admin";

type Primitive = string | number | boolean | null;
type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type QueryFilter = {
  field: string;
  op: "==";
  value: Primitive;
};

type QueryOrder = {
  field: string;
  direction: "asc" | "desc";
};

type QueryOptions = {
  filters: QueryFilter[];
  orders: QueryOrder[];
  limit?: number;
};

type SnapshotData<T> = T | undefined;

const FIRESTORE_SCOPE = ["https://www.googleapis.com/auth/datastore"];

function getBaseDocumentsUrl() {
  const env = getServerEnv();
  return `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T | undefined, incoming: T): T {
  if (Array.isArray(base) || Array.isArray(incoming) || !isPlainObject(base) || !isPlainObject(incoming)) {
    return incoming;
  }

  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(incoming)) {
    const current = merged[key];
    merged[key] = isPlainObject(current) && isPlainObject(value)
      ? deepMerge(current as Record<string, unknown>, value)
      : value;
  }

  return merged as T;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null) {
    return { nullValue: null };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((entry) => encodeValue(entry)),
      },
    };
  }

  if (isPlainObject(value)) {
    return {
      mapValue: {
        fields: encodeFields(value),
      },
    };
  }

  throw new Error(`Unsupported Firestore value: ${String(value)}`);
}

function encodeFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, encodeValue(entry)]),
  );
}

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) {
    return value.stringValue;
  }

  if ("integerValue" in value) {
    return Number.parseInt(value.integerValue, 10);
  }

  if ("doubleValue" in value) {
    return value.doubleValue;
  }

  if ("booleanValue" in value) {
    return value.booleanValue;
  }

  if ("nullValue" in value) {
    return null;
  }

  if ("arrayValue" in value) {
    return (value.arrayValue.values ?? []).map((entry) => decodeValue(entry));
  }

  return Object.fromEntries(
    Object.entries(value.mapValue.fields ?? {}).map(([key, entry]) => [key, decodeValue(entry)]),
  );
}

function decodeDocument<T>(document: FirestoreDocument): T {
  return Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [key, decodeValue(value)]),
  ) as T;
}

async function firestoreFetch(path: string, init?: RequestInit) {
  const accessToken = await getGoogleAccessToken(FIRESTORE_SCOPE);
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  return response;
}

function documentUrl(path: string) {
  return `${getBaseDocumentsUrl()}/${path}`;
}

function queryUrl(path: string) {
  const segments = path.split("/");
  const collectionId = segments.pop();
  if (!collectionId) {
    throw new Error("Missing collection path");
  }

  const parentPath = segments.join("/");
  const parentUrl = parentPath ? `${getBaseDocumentsUrl()}/${parentPath}` : getBaseDocumentsUrl();

  return {
    url: `${parentUrl}:runQuery`,
    collectionId,
  };
}

async function getDocument(path: string) {
  const response = await firestoreFetch(documentUrl(path));
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch document ${path} (${response.status})`);
  }

  return (await response.json()) as FirestoreDocument;
}

async function getDocumentData<T>(path: string) {
  const document = await getDocument(path);
  return document ? decodeDocument<T>(document) : null;
}

async function setDocument(path: string, input: object, options?: { merge?: boolean }) {
  const current = options?.merge ? await getDocumentData<Record<string, unknown>>(path) : null;
  const payload = current ? deepMerge(current, input) : input;
  const response = await firestoreFetch(documentUrl(path), {
    method: "PATCH",
    body: JSON.stringify({
      name: `projects/${getServerEnv().FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`,
      fields: encodeFields(payload as Record<string, unknown>),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to write document ${path} (${response.status})`);
  }

  return payload;
}

async function runCollectionQuery<T>(path: string, options: QueryOptions) {
  const { url, collectionId } = queryUrl(path);
  const whereFilters = options.filters.map((filter) => ({
    fieldFilter: {
      field: { fieldPath: filter.field },
      op: "EQUAL",
      value: encodeValue(filter.value),
    },
  }));

  const response = await firestoreFetch(url, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: whereFilters.length === 0 ? undefined : {
          compositeFilter: {
            op: "AND",
            filters: whereFilters,
          },
        },
        orderBy: options.orders.map((order) => ({
          field: { fieldPath: order.field },
          direction: order.direction === "desc" ? "DESCENDING" : "ASCENDING",
        })),
        limit: options.limit,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to query collection ${path} (${response.status})`);
  }

  const rows = (await response.json()) as Array<{ document?: FirestoreDocument }>;
  return rows
    .filter((row) => row.document)
    .map((row) => new DocumentSnapshot<T>(row.document!));
}

async function runCollectionGroupQuery<T>(collectionId: string, options: QueryOptions) {
  const response = await firestoreFetch(`${getBaseDocumentsUrl()}:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId, allDescendants: true }],
        where: options.filters.length === 0 ? undefined : {
          compositeFilter: {
            op: "AND",
            filters: options.filters.map((filter) => ({
              fieldFilter: {
                field: { fieldPath: filter.field },
                op: "EQUAL",
                value: encodeValue(filter.value),
              },
            })),
          },
        },
        orderBy: options.orders.map((order) => ({
          field: { fieldPath: order.field },
          direction: order.direction === "desc" ? "DESCENDING" : "ASCENDING",
        })),
        limit: options.limit,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to query collection group ${collectionId} (${response.status})`);
  }

  const rows = (await response.json()) as Array<{ document?: FirestoreDocument }>;
  return rows
    .filter((row) => row.document)
    .map((row) => new DocumentSnapshot<T>(row.document!));
}

class DocumentSnapshot<T> {
  constructor(private readonly document: FirestoreDocument | null) {}

  get exists() {
    return Boolean(this.document);
  }

  get id() {
    if (!this.document) {
      return "";
    }

    return this.document.name.split("/").pop() ?? "";
  }

  data(): SnapshotData<T> {
    if (!this.document) {
      return undefined;
    }

    return decodeDocument<T>(this.document);
  }
}

class QuerySnapshot<T> {
  constructor(readonly docs: Array<DocumentSnapshot<T>>) {}

  get empty() {
    return this.docs.length === 0;
  }
}

class Query<T> {
  constructor(
    protected readonly path: string,
    protected readonly options: QueryOptions = { filters: [], orders: [] },
  ) {}

  where(field: string, op: "==", value: Primitive) {
    return new Query<T>(this.path, {
      ...this.options,
      filters: [...this.options.filters, { field, op, value }],
    });
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new Query<T>(this.path, {
      ...this.options,
      orders: [...this.options.orders, { field, direction }],
    });
  }

  limit(limit: number) {
    return new Query<T>(this.path, {
      ...this.options,
      limit,
    });
  }

  async get() {
    return new QuerySnapshot<T>(await runCollectionQuery<T>(this.path, this.options));
  }
}

class CollectionGroupQuery<T> extends Query<T> {
  async get() {
    return new QuerySnapshot<T>(await runCollectionGroupQuery<T>(this.path, this.options));
  }
}

class DocumentReference<T> {
  readonly id: string;

  constructor(private readonly path: string) {
    this.id = path.split("/").pop() ?? "";
  }

  async get() {
    return new DocumentSnapshot<T>(await getDocument(this.path));
  }

  async set(data: object, options?: { merge?: boolean }) {
    await setDocument(this.path, data, options);
  }

  collection<TChild = Record<string, unknown>>(name: string) {
    return new CollectionReference<TChild>(`${this.path}/${name}`);
  }
}

class CollectionReference<T> extends Query<T> {
  doc(id = crypto.randomUUID()) {
    return new DocumentReference<T>(`${this.path}/${id}`);
  }
}

class FirestoreClient {
  collection<T = Record<string, unknown>>(name: string) {
    return new CollectionReference<T>(name);
  }

  collectionGroup<T = Record<string, unknown>>(name: string) {
    return new CollectionGroupQuery<T>(name);
  }
}

const db = new FirestoreClient();

export function getDb() {
  return db;
}
