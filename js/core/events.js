/* A tiny event bus so modules can react to each other without importing each other. */
const handlers = new Map();
export function on(name, fn) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn); }
export function emit(name, ...args) { (handlers.get(name) || []).forEach(fn => fn(...args)); }
