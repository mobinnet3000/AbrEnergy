/**
 * Phase 8.5 (BUG-06) — ONE shared API error normalization path.
 *
 * The backend wraps every failure as `{ status, errors }` (see
 * `AbrEnergy/apps/core/exceptions.py::custom_exception_handler`), but the
 * `errors` node can be a string, an array, a flat field map, or a NESTED
 * mix of objects/arrays (DRF nested serializers, e.g.
 * `{ translations: { fa: { title: [...] } } }` or
 * `{ price_data: { regular_price: [...] } }`).
 *
 * Previously `mapHomepageErrors` silently dropped every nested object and
 * `mapProductErrors` stringified deep nodes into `[object Object]` — both
 * degraded to a generic toast. Every CMS form now normalizes through this
 * module instead of implementing its own flattening.
 *
 * Safety contract (all callers rely on it):
 * - never throws (every input, including cyclic structures, is tolerated);
 * - bounded recursion (max depth + traversal budget + cycle set);
 * - never emits `[object Object]`, raw JSON dumps, stack traces, or HTML;
 * - never traverses axios internals (`config`/`request` headers, tokens);
 * - credential-looking values are redacted to a generic message;
 * - deterministic: same input always yields the same output.
 */

export interface NormalizedFieldError {
  /** Dotted field path, e.g. `title`, `translations.fa.title`, `images_data.0.media_file`. */
  path: string;
  message: string;
}

export type NormalizedErrorKind =
  | 'validation'
  | 'permission'
  | 'network'
  | 'server'
  | 'unknown';

export interface NormalizedApiError {
  kind: NormalizedErrorKind;
  status?: number;
  fieldErrors: NormalizedFieldError[];
  detailMessages: string[];
}

const MAX_DEPTH = 6;
const MAX_TRAVERSAL = 200;
const MAX_FIELD_ERRORS = 20;
const MAX_DETAIL_MESSAGES = 5;
const MAX_MESSAGE_LENGTH = 300;
const MAX_TOAST_ITEMS = 3;

/** Envelope/metadata keys that are never field paths. */
const META_KEYS = new Set(['status', 'status_code', 'success', 'ok', 'preview']);

/** Keys whose string value is a non-field message, not a field path. */
const DETAIL_KEYS = new Set(['detail', 'non_field_errors', 'message', 'error', 'errors']);

/** Path segments whose values must never be shown (tokens, secrets). */
const SENSITIVE_SEGMENTS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'access_token',
  'access',
  'refresh_token',
  'refresh',
  'authorization',
  'cookie',
  'cookies',
  'sessionid',
  'api_key',
  'apikey',
  'client_secret',
]);

/** Values that look like credentials rather than validation messages. */
const CREDENTIAL_PATTERNS = [/^Bearer\s+/i, /^eyJ[A-Za-z0-9_-]+\./, /-----BEGIN [A-Z ]+-----/];

/** Axios' own default message carries no field information — never show it. */
const AXIOS_DEFAULT_MESSAGE = /^Request failed with status code \d+$/;

const NETWORK_CODES = new Set([
  'ERR_NETWORK',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ERR_INTERNET_DISCONNECTED',
]);
const NETWORK_MESSAGE = /network error|failed to fetch|load failed|connection (refused|reset|aborted|timed out)|timed out|timeout exceeded/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function truncate(message: string): string {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_MESSAGE_LENGTH) return clean;
  return `${clean.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}

function looksLikeHtml(message: string): boolean {
  return /^<(html|!doctype|head|body|div|p|h\d)[\s>]/i.test(message.trim());
}

function redactIfSensitive(path: string, message: string): string | null {
  const segments = path.toLowerCase().split('.');
  if (segments.some((s) => SENSITIVE_SEGMENTS.has(s))) return null;
  if (CREDENTIAL_PATTERNS.some((re) => re.test(message))) return null;
  if (looksLikeHtml(message)) return null;
  const clean = truncate(message);
  return clean === '' ? null : clean;
}

interface FlattenState {
  fieldErrors: NormalizedFieldError[];
  detailMessages: string[];
  seen: Set<object>;
  visited: number;
}

function pushField(state: FlattenState, path: string, message: string): void {
  if (state.fieldErrors.length >= MAX_FIELD_ERRORS) return;
  const safe = redactIfSensitive(path, message);
  if (safe === null) return;
  state.fieldErrors.push({ path, message: safe });
}

function pushDetail(state: FlattenState, message: string): void {
  if (state.detailMessages.length >= MAX_DETAIL_MESSAGES) return;
  const safe = redactIfSensitive('detail', message);
  if (safe === null) return;
  state.detailMessages.push(safe);
}

/**
 * Recursively flatten an `errors` node. `path` is the dotted prefix of the
 * current node ('' at the root). Primitives at a named path become field
 * errors; primitives at the root (or inside a root array) become detail
 * messages so toasts never show bare `0: …` paths.
 */
function flatten(node: unknown, path: string, depth: number, state: FlattenState): void {
  if (state.visited >= MAX_TRAVERSAL) return;
  state.visited += 1;
  if (node === null || node === undefined) return;
  if (depth > MAX_DEPTH) return;
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    const text = String(node);
    if (text.trim() === '') return;
    if (path) pushField(state, path, text);
    else pushDetail(state, text);
    return;
  }
  if (Array.isArray(node)) {
    if (node.length === 0) return;
    for (let i = 0; i < node.length; i += 1) {
      const item = node[i];
      if (isRecord(item) || Array.isArray(item)) {
        flatten(item, path ? `${path}.${i}` : '', depth + 1, state);
      } else if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        const text = String(item);
        if (text.trim() === '') continue;
        if (path) pushField(state, path, text);
        else pushDetail(state, text);
      }
      if (state.visited >= MAX_TRAVERSAL) return;
    }
    return;
  }
  if (isRecord(node)) {
    if (state.seen.has(node)) return;
    state.seen.add(node);
    for (const [key, value] of Object.entries(node)) {
      if (META_KEYS.has(key)) continue;
      if (value === null || value === undefined) continue;
      if ((DETAIL_KEYS.has(key) || key === 'errors') && path === '') {
        // Top-level non-field message(s): keep them as detail, but a
        // NESTED `errors` object (field map) still flattens by field.
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          pushDetail(state, String(value));
          continue;
        }
        if (Array.isArray(value) && value.every((v) => !isRecord(v) && !Array.isArray(v))) {
          for (const v of value) {
            if (v === null || v === undefined) continue;
            if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue;
            pushDetail(state, String(v));
          }
          continue;
        }
        if (key === 'errors' && isRecord(value)) {
          flatten(value, '', depth + 1, state);
          continue;
        }
        if (isRecord(value) || Array.isArray(value)) {
          flatten(value, '', depth + 1, state);
          continue;
        }
      }
      const childPath = path ? `${path}.${key}` : key;
      flatten(value, childPath, depth + 1, state);
      if (state.visited >= MAX_TRAVERSAL) return;
    }
    return;
  }
  // Functions, symbols, bigints…: never stringified into user-facing text.
}

function readStatus(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  const response = isRecord(err.response) ? (err.response as Record<string, unknown>) : undefined;
  const fromResponse = response?.status;
  if (typeof fromResponse === 'number' && Number.isFinite(fromResponse)) return fromResponse;
  const direct = (err as Record<string, unknown>).status;
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
  const data = response?.data;
  if (isRecord(data) && typeof data.status === 'number' && Number.isFinite(data.status)) {
    return data.status as number;
  }
  return undefined;
}

function readCode(err: unknown): string | undefined {
  if (!isRecord(err)) return undefined;
  const code = (err as Record<string, unknown>).code;
  return typeof code === 'string' ? code : undefined;
}

function readMessage(err: unknown): string {
  if (err instanceof Error) return err.message ?? '';
  if (isRecord(err) && typeof err.message === 'string') return err.message;
  return '';
}

function hasResponse(err: unknown): boolean {
  return isRecord(err) && isRecord((err as Record<string, unknown>).response);
}

/**
 * Normalize ANY thrown/mutation error into field errors + detail messages.
 * Accepts axios errors, React Query mutation errors (same shape), bare DRF
 * bodies, envelope bodies, strings, arrays, and unknown objects. Only
 * `response.data` / `response.status` / `message` / `code` are ever read —
 * axios `config`/`request` (headers, tokens) are never traversed.
 */
export function normalizeApiError(err: unknown): NormalizedApiError {
  const empty: NormalizedApiError = { kind: 'unknown', fieldErrors: [], detailMessages: [] };
  try {
    if (err === null || err === undefined) return empty;
    if (typeof err === 'string') {
      const state: FlattenState = { fieldErrors: [], detailMessages: [], seen: new Set(), visited: 0 };
      flatten(err, '', 0, state);
      return { kind: state.fieldErrors.length > 0 || state.detailMessages.length > 0 ? 'validation' : 'unknown', fieldErrors: state.fieldErrors, detailMessages: state.detailMessages };
    }
    const status = readStatus(err);
    const code = readCode(err);
    const message = readMessage(err);
    const noResponse = !hasResponse(err);

    // Network errors carry no response (offline, DNS, refused, timeout).
    if (noResponse && isRecord(err) && (err as Record<string, unknown>).response === undefined) {
      const looksNetwork =
        (code !== undefined && NETWORK_CODES.has(code.toUpperCase())) ||
        (message !== '' && NETWORK_MESSAGE.test(message)) ||
        ('request' in (err as Record<string, unknown>) && message !== '');
      if (looksNetwork) return { kind: 'network', status, fieldErrors: [], detailMessages: [] };
    }

    if (status === 401 || status === 403) {
      const state: FlattenState = { fieldErrors: [], detailMessages: [], seen: new Set(), visited: 0 };
      const data = isRecord(err) ? (err as Record<string, unknown>).response : undefined;
      const body = isRecord(data) ? (data as Record<string, unknown>).data : undefined;
      if (body !== undefined) flatten(extractErrorsNode(body), '', 0, state);
      else if (message !== '' && !AXIOS_DEFAULT_MESSAGE.test(message)) pushDetail(state, message);
      return { kind: 'permission', status, fieldErrors: state.fieldErrors, detailMessages: state.detailMessages };
    }
    if (status !== undefined && status >= 500) {
      return { kind: 'server', status, fieldErrors: [], detailMessages: [] };
    }

    // Validation / unknown: unwrap axios → envelope → errors node, then flatten.
    let body: unknown = err;
    if (hasResponse(err)) body = (err as Record<string, unknown> & { response: { data?: unknown } }).response.data;
    const state: FlattenState = { fieldErrors: [], detailMessages: [], seen: new Set(), visited: 0 };
    flatten(extractErrorsNode(body), '', 0, state);
    if (state.fieldErrors.length === 0 && state.detailMessages.length === 0) {
      // Nothing parseable: keep a status-derived kind, but never invent text.
      if (status !== undefined && status >= 400 && status < 500) return { kind: 'validation', status, fieldErrors: [], detailMessages: [] };
      return { kind: status !== undefined ? 'unknown' : 'unknown', status, fieldErrors: [], detailMessages: [] };
    }
    return { kind: 'validation', status, fieldErrors: state.fieldErrors, detailMessages: state.detailMessages };
  } catch {
    return empty;
  }
}

/** Unwrap `{ status, errors }` envelopes (one level); anything else passes through. */
function extractErrorsNode(body: unknown): unknown {
  if (isRecord(body) && 'errors' in body) {
    const errors = (body as Record<string, unknown>).errors;
    if (errors !== undefined) return errors;
  }
  return body;
}

/** All messages as display strings: `path: message` for fields, bare detail otherwise. Capped. */
export function flattenNormalizedError(normalized: NormalizedApiError): string[] {
  try {
    const out: string[] = [];
    for (const f of normalized.fieldErrors) {
      out.push(`${f.path}: ${f.message}`);
      if (out.length >= MAX_FIELD_ERRORS) break;
    }
    for (const d of normalized.detailMessages) {
      out.push(d);
      if (out.length >= MAX_FIELD_ERRORS + MAX_DETAIL_MESSAGES) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Concise toast text (up to 3 items; locale-neutral `(+N)` overflow marker —
 * no new translation key required). Returns null when there is nothing safe
 * to show so callers fall back to their existing generic locale toast.
 */
export function summarizeNormalizedError(normalized: NormalizedApiError): string | null {
  try {
    const items = flattenNormalizedError(normalized).slice(0, MAX_TOAST_ITEMS);
    if (items.length === 0) return null;
    const total = normalized.fieldErrors.length + normalized.detailMessages.length;
    const suffix = total > items.length ? ` (+${total - items.length})` : '';
    return `${items.join(' — ')}${suffix}`;
  } catch {
    return null;
  }
}

/**
 * Category forms have no per-section error UI (toast-only by existing
 * architecture), so they share the homepage-style flat list. Thin wrapper
 * over the shared normalizer — no duplicated parsing.
 */
export function mapCategoryErrors(err: unknown): string[] {
  try {
    return flattenNormalizedError(normalizeApiError(err)).slice(0, 8);
  } catch {
    return [];
  }
}
