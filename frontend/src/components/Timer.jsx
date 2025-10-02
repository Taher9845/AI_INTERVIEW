import React, { useState, useEffect } from "react";

export default function Timer({ seconds, onTimeUp, onTick }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  // Reset when seconds prop changes (e.g., new question)
  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        onTick && onTick(next);
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onTimeUp, onTick]);

  const pct = Math.max(0, Math.min(100, (timeLeft / seconds) * 100));
  const warn = timeLeft <= Math.max(5, Math.round(seconds * 0.15));

  return (
    <div style={{ margin: "12px 0" }}>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <strong>Time left</strong>
        <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: warn ? "#ef4444" : "#1f2937" }}>{fmt(timeLeft)}</div>
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: pct + "%", background: warn ? '#ef4444' : undefined }} />
      </div>
    </div>
  );
}

function fmt(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
