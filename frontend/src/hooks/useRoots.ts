import { useState, useEffect } from "react";
import { getAllRoots } from "../services/api";

export function useRoots() {
  const [allRoots, setAllRoots] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllRoots().then(setAllRoots);
  }, []);

  const refreshRoots = () => {
    getAllRoots().then(setAllRoots);
  };

  return {
    allRoots,
    refreshRoots,
  };
}