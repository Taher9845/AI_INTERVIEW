import React from "react";

export default function WelcomeBackModal({ candidate, onResume, onStartNew }) {
  if (!candidate || candidate.currentQuestion === 0) return null; // No unfinished interview

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="title">Welcome Back, {candidate.name}!</h2>
        <p className="muted">It looks like you have an unfinished interview.</p>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
          <button onClick={onResume} className="btn btn-primary">Resume Interview</button>
          <button onClick={onStartNew} className="btn btn-danger">Start New Interview</button>
        </div>
      </div>
    </div>
  );
}
