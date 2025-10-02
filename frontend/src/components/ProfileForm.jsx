import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { setCandidateInfo } from "../redux/slices/candidatesSlice";

export default function ProfileForm({ parsed, onDone }) {
  const dispatch = useDispatch();
  const [name, setName] = useState(parsed?.name || "");
  const [email, setEmail] = useState(parsed?.email || "");
  const [phone, setPhone] = useState(parsed?.phone || "");

  const missing = useMemo(() => {
    const list = [];
    if (!name) list.push("Name");
    if (!email) list.push("Email");
    if (!phone) list.push("Phone");
    return list;
  }, [name, email, phone]);

  const submit = (e) => {
    e.preventDefault();
    const emailOk = /.+@.+\..+/.test(email);
    const phoneOk = /^(\+?\d[\d\s\-]{7,})$/.test(phone);
    if (!name || !emailOk || !phoneOk) return;
    dispatch(setCandidateInfo({ name, email, phone }));
    onDone?.();
  };

  return (
    <div className="card card-lg shadow">
      <div className="card-body">
        <h2 className="title">Candidate Details</h2>
        {missing.length > 0 && (
          <div className="card" style={{ padding: 10, marginTop: 8, color: '#f59e0b' }}>Missing: {missing.join(", ")}. Please fill in before starting.</div>
        )}
        <form onSubmit={submit} className="stack" style={{ marginTop: 12 }}>
          <label>
            <div className="label">Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </label>
          <label>
            <div className="label">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" type="email" />
            {!/.+@.+\..+/.test(email) && email && <div className="muted" style={{ color: '#f59e0b' }}>Enter a valid email</div>}
          </label>
          <label>
            <div className="label">Phone</div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            {!/^(\+?\d[\d\s\-]{7,})$/.test(phone) && phone && <div className="muted" style={{ color: '#f59e0b' }}>Enter a valid phone</div>}
          </label>
          <button type="submit" className="btn btn-primary" disabled={missing.length > 0}>Start Interview</button>
        </form>
      </div>
    </div>
  );
}
