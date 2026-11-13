import { useEffect, useRef, useState } from "react";

export function useResource(load, key) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const previousKey = useRef(key);

  useEffect(() => {
    let active = true;
    const sameResource = previousKey.current === key;
    previousKey.current = key;
    setState((current) => ({
      data: sameResource ? current.data : null,
      loading: true,
      error: "",
    }));
    load()
      .then((data) => active && setState({ data, loading: false, error: "" }))
      .catch(
        (error) =>
          active &&
          setState({ data: null, loading: false, error: error.message }),
      );
    return () => {
      active = false;
    };
    // `key` decides when to refetch; `load` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return {
    ...state,
    data: previousKey.current === key ? state.data : null,
    reload: () => setVersion((value) => value + 1),
  };
}
