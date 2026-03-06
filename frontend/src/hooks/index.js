import { useState, useCallback, useEffect, useRef } from "react";

// ── useAsync: generic async operation hook ────────────────────────────────────
export function useAsync() {
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (asyncFn) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await asyncFn();
      if (mountedRef.current) setState({ loading: false, error: null, data });
      return { data, error: null };
    } catch (err) {
      if (mountedRef.current) setState({ loading: false, error: err, data: null });
      return { data: null, error: err };
    }
  }, []);

  const reset = useCallback(() => setState({ loading: false, error: null, data: null }), []);

  return { ...state, execute, reset };
}

// ── useFetch: fetch on mount + refetch ────────────────────────────────────────
export function useFetch(asyncFn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const mountedRef = useRef(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (mountedRef.current) setState({ loading: false, error: null, data });
    } catch (err) {
      if (mountedRef.current) setState({ loading: false, error: err, data: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...state, refetch: fetch };
}

// ── useToast ──────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const add = useCallback((message, type = "success", duration = 4000) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  return {
    toasts,
    toast: {
      success: (msg) => add(msg, "success"),
      error: (msg) => add(msg, "error"),
      info: (msg) => add(msg, "info"),
      warning: (msg) => add(msg, "warning"),
    },
    remove,
  };
}

// ── useFormErrors ─────────────────────────────────────────────────────────────
export function useFormErrors(apiError) {
  const fieldErrors = {};
  if (apiError?.details?.length) {
    apiError.details.forEach(({ field, message }) => {
      fieldErrors[field] = message;
    });
  }
  return fieldErrors;
}
