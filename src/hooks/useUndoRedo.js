import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for undo/redo functionality - FIXED VERSION
 * @param {*} initialState - The initial state
 * @param {number} maxHistorySize - Maximum number of history items to keep
 */
export function useUndoRedo(initialState, maxHistorySize = 50) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialState);
  const [future, setFuture] = useState([]);
  
  // Use refs to avoid stale closures
  const pastRef = useRef(past);
  const presentRef = useRef(present);
  const futureRef = useRef(future);
  
  // Track if we're in the middle of an undo/redo operation
  const isUndoingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    pastRef.current = past;
  }, [past]);

  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  useEffect(() => {
    futureRef.current = future;
  }, [future]);

  const setState = useCallback((newState) => {
    // Don't add to history if we're undoing/redoing
    if (isUndoingRef.current) {
      setPresent(newState);
      return;
    }

    // Don't add to history if state hasn't changed
    if (JSON.stringify(newState) === JSON.stringify(presentRef.current)) {
      return;
    }

    setPast((prevPast) => {
      const newPast = [...prevPast, presentRef.current];
      // Limit history size
      if (newPast.length > maxHistorySize) {
        return newPast.slice(newPast.length - maxHistorySize);
      }
      return newPast;
    });
    setPresent(newState);
    setFuture([]); // Clear future when a new state is set
  }, [maxHistorySize]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) {
      console.warn('Nothing to undo');
      return null;
    }

    isUndoingRef.current = true;
    
    const previous = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

    setPast(newPast);
    setPresent(previous);
    setFuture([presentRef.current, ...futureRef.current]);
    
    // Reset flag after state updates complete
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return previous;
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) {
      console.warn('Nothing to redo');
      return null;
    }

    isUndoingRef.current = true;
    
    const next = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);

    setPast([...pastRef.current, presentRef.current]);
    setPresent(next);
    setFuture(newFuture);
    
    // Reset flag after state updates complete
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return next;
  }, []);

  const reset = useCallback((newState) => {
    isUndoingRef.current = false;
    setPast([]);
    setPresent(newState);
    setFuture([]);
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    state: present,
    setState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    historySize: past.length,
    futureSize: future.length,
  };
}
