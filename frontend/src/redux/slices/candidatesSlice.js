import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: "",
  email: "",
  phone: "",
  resumeFilename: "",
  answers: [],
  currentQuestion: 0,
  progressSaved: false, // for pause/resume session modal
  // Timer persistence per question
  currentDuration: 0,
  timeLeft: 0,
  paused: false,
};

export const candidateSlice = createSlice({
  name: "candidate",
  initialState,
  reducers: {
    addAnswer: (state, action) => {
      state.answers.push({
        ...action.payload,
        // Record timeSpent snapshot for this item
        timeSpent: Math.max(0, (state.currentDuration || 0) - (state.timeLeft || 0)),
      });
      state.currentQuestion += 1; // automatically increments
      // Reset timer for next question
      state.currentDuration = 0;
      state.timeLeft = 0;
      state.paused = false;
      state.progressSaved = false; // user is actively progressing
    },
    incrementQuestion: (state) => {
      state.currentQuestion += 1;
    },
    setCandidateInfo: (state, action) => {
      const { name, email, phone, resumeFilename } = action.payload;
      state.name = name;
      state.email = email;
      state.phone = phone;
      if (typeof resumeFilename === 'string') {
        state.resumeFilename = resumeFilename;
      }
    },
    resetCandidate: () => initialState,
    pauseCandidate: (state) => {
      state.progressSaved = true;
      state.paused = true;
    },
    resumeCandidate: (state) => {
      state.progressSaved = false;
      state.paused = false;
    },
    setTimer: (state, action) => {
      const { duration } = action.payload; // seconds
      state.currentDuration = duration;
      state.timeLeft = duration;
      state.paused = false;
    },
    setTimeLeft: (state, action) => {
      state.timeLeft = action.payload; // seconds
    },
    setPaused: (state, action) => {
      state.paused = action.payload;
    },
  },
});

export const {
  addAnswer,
  incrementQuestion,
  setCandidateInfo,
  resetCandidate,
  pauseCandidate,
  resumeCandidate,
  setTimer,
  setTimeLeft,
  setPaused,
} = candidateSlice.actions;
export default candidateSlice.reducer;
