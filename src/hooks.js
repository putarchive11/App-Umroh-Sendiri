import { useEffect, useState } from "react";
import { load, save } from "./store";

// useState yang otomatis tersimpan di perangkat.
export function usePersisted(key, initial) {
  const [value, setValue] = useState(() => load(key, initial));
  useEffect(() => {
    save(key, value);
  }, [key, value]);
  return [value, setValue];
}
