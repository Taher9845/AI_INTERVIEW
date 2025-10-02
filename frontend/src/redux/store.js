import { configureStore } from "@reduxjs/toolkit";
import candidateReducer from "./slices/candidatesSlice";

// Local storage keys
const LS_KEY = "ai_interviewer_state_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Only restore the candidate slice to avoid unexpected data
    if (parsed && typeof parsed === "object" && parsed.candidate) {
      return { candidate: parsed.candidate };
    }
  } catch (_) {}
  return undefined;
}

function saveState(state) {
  try {
    const toSave = { candidate: state.candidate };
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
  } catch (_) {}
}

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    candidate: candidateReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Persist on any state change. This is small state, so simple subscribe is fine.
store.subscribe(() => {
  saveState(store.getState());
});