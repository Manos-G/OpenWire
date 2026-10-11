// Holds the open project, the selection and the undo history.
//
// Events sent to subscribers:
//   'change'  the project changed (info: { source, kind, structural })
//   'replace' a different project was loaded
//   'select'  the selection changed
//   'history' undo or redo availability changed

import { findConnector, findWire } from './model.js';

const HISTORY_LIMIT = 200;

// Pictures are large and they never change. The undo history does not copy them:
// a restored step uses the pictures of the open project. Removed pictures stay
// in memory until you save, so undo can bring them back.
function snapshot(project) {
  return JSON.stringify(project, (key, value) => (key === 'images' ? undefined : value));
}

export function createStore(initialProject) {
  let project = initialProject;
  let selection = null;
  let coalesceKey = null;
  const past = [];
  const future = [];
  const listeners = new Set();

  const emit = (type, info = {}) => {
    for (const listener of listeners) listener(type, info);
  };

  const selectionIsValid = () => {
    if (!selection) return true;
    if (selection.type === 'connector') return Boolean(findConnector(project, selection.id));
    if (selection.type === 'wire') return Boolean(findWire(project, selection.id));
    return false;
  };

  const touch = () => {
    project.meta.modified = new Date().toISOString();
  };

  return {
    get project() {
      return project;
    },
    get selection() {
      return selection;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,

    // Runs `mutate(project)` and records one undo step.
    // Calls with the same `coalesce` key share one undo step (typing, dragging).
    update(mutate, info = {}) {
      const key = info.coalesce || null;
      if (!key || key !== coalesceKey) {
        past.push(snapshot(project));
        if (past.length > HISTORY_LIMIT) past.shift();
        future.length = 0;
      }
      coalesceKey = key;
      mutate(project);
      touch();
      if (!selectionIsValid()) selection = null;
      emit('change', info);
      emit('history');
    },

    endCoalesce() {
      coalesceKey = null;
    },

    undo() {
      if (!past.length) return false;
      future.push(snapshot(project));
      project = { ...JSON.parse(past.pop()), images: project.images };
      coalesceKey = null;
      if (!selectionIsValid()) selection = null;
      emit('change', { source: 'history', structural: true });
      emit('history');
      return true;
    },

    redo() {
      if (!future.length) return false;
      past.push(snapshot(project));
      project = { ...JSON.parse(future.pop()), images: project.images };
      coalesceKey = null;
      if (!selectionIsValid()) selection = null;
      emit('change', { source: 'history', structural: true });
      emit('history');
      return true;
    },

    // Loads another project. The undo history starts again.
    replace(nextProject) {
      project = nextProject;
      selection = null;
      coalesceKey = null;
      past.length = 0;
      future.length = 0;
      emit('replace');
      emit('history');
    },

    select(next) {
      const same =
        (next === null && selection === null) ||
        (next && selection && next.type === selection.type && next.id === selection.id);
      if (same) return;
      selection = next;
      coalesceKey = null;
      emit('select');
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
