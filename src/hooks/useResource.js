import { useEffect, useState } from "react";

export function useResource(load, key) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: "" }));
    load()
      .then((data) => active && setState({ data, loading: false, error: "" }))
      .catch((error) => active && setState({ data: null, loading: false, error: error.message }));
    return () => {
      active = false;
    };
    // `key` decides when to refetch; `load` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return { ...state, reload: () => setVersion((value) => value + 1) };
}
