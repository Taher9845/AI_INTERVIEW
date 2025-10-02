import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { API_BASE } from "../config";

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/candidates/`);
        setCandidates(res.data);
        setError("");
      } catch (err) {
        console.error("Error fetching candidates:", err);
        setError("Failed to load candidates. Please ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const filteredCandidates = useMemo(() => {
    const safeSearch = String(search || "").toLowerCase();
    return candidates
      .filter((c) => {
        const name = typeof c?.name === 'string' ? c.name : '';
        return name.toLowerCase().includes(safeSearch);
      })
      .sort((a, b) => {
        const sa = Number(a?.score ?? 0);
        const sb = Number(b?.score ?? 0);
        return sortOrder === "asc" ? sa - sb : sb - sa;
      });
  }, [candidates, search, sortOrder]);

  const buildResumeUrl = useCallback((resumePathOrUrl) => {
    const src = String(resumePathOrUrl || "");
    if (!src) return "";
    if (/^https?:\/\//i.test(src)) return src;
    // Build from API_BASE origin (API_BASE may include /api)
    try {
      const base = new URL(API_BASE);
      return base.origin + src;
    } catch (_) {
      return src;
    }
  }, []);

  const deleteCandidate = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await axios.delete(`${API_BASE}/candidates/${id}/delete/`);
      setCandidates(prev => prev.filter(c => c.id !== id));
      if (selectedCandidate?.id === id) setSelectedCandidate(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete candidate.');
    }
  }, [selectedCandidate]);

  const exportCsv = useCallback(() => {
    const rows = [
      ["ID", "Name", "Email", "Phone", "Score", "Created At"],
      ...filteredCandidates.map((c) => [
        c.id,
        c.name ?? "",
        c.email ?? "",
        c.phone ?? "",
        Number(c?.score ?? 0),
        c.created_at ? new Date(c.created_at).toISOString() : "",
      ])
    ];
    const csv = rows
      .map((r) => r
        .map((cell) => {
          const s = String(cell ?? "");
          // Escape quotes and wrap
          const escaped = '"' + s.replaceAll('"', '""') + '"';
          return escaped;
        })
        .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredCandidates]);

  const highlightText = (text, highlight) => {
    const src = String(text ?? '');
    const hl = String(highlight ?? '').trim();
    if (!hl) return src;
    const regex = new RegExp(`(${escapeRegExp(hl)})`, 'gi');
    return src.replace(regex, '<mark>$1</mark>');
  };

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (loading) {
    return (
      <div className="card card-lg shadow" style={{ textAlign: 'center' }}>
        <div className="card-body">
          <div style={{ width: 50, height: 50, border: '4px solid #0b1220', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          <p className="muted">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card-lg shadow" style={{ textAlign: 'center' }}>
        <div className="card-body">
          <div style={{ fontSize: 64, marginBottom: 8 }}>⚠️</div>
          <p className="muted">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="stack" style={{ marginBottom: '1rem' }}>
        <h1 className="title">Candidates Dashboard</h1>
        <p className="muted">Review and manage interview results</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-body">
            <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '.75rem' }}>
              <input type="text" className="input" placeholder="🔍 Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="row">
                <button onClick={() => setSortOrder("desc")} className={`btn ${sortOrder === 'desc' ? 'btn-primary' : 'btn-ghost'}`}>↓ High to Low</button>
                <button onClick={() => setSortOrder("asc")} className={`btn ${sortOrder === 'asc' ? 'btn-primary' : 'btn-ghost'}`}>↑ Low to High</button>
                <button onClick={exportCsv} className="btn">⬇️ Export CSV</button>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
                <div className="card"><div className="card-body" style={{ textAlign: 'center' }}><div className="title" style={{ fontSize: 20 }}>{candidates.length}</div><div className="muted" style={{ fontSize: 12 }}>Total</div></div></div>
                <div className="card"><div className="card-body" style={{ textAlign: 'center' }}><div className="title" style={{ fontSize: 20 }}>{candidates.filter(c => Number(c?.score ?? 0) >= 70).length}</div><div className="muted" style={{ fontSize: 12 }}>High Score</div></div></div>
                <div className="card"><div className="card-body" style={{ textAlign: 'center' }}><div className="title" style={{ fontSize: 20 }}>{filteredCandidates.length}</div><div className="muted" style={{ fontSize: 12 }}>Showing</div></div></div>
              </div>
            </div>

            <div className="list" style={{ marginTop: '1rem' }}>
              {filteredCandidates.length === 0 ? (
                <div className="card"><div className="card-body" style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>📭</div><p className="muted">No candidates found</p></div></div>
              ) : (
                filteredCandidates.map((c) => (
                  <div key={c.id} className="card" style={{ marginBottom: '.5rem', cursor: 'pointer', border: selectedCandidate?.id === c.id ? '1px solid var(--ring)' : undefined }} onClick={() => setSelectedCandidate(c)}>
                    <div className="card-body">
                      <div className="row-between">
                        <div dangerouslySetInnerHTML={{ __html: highlightText(String(c?.name ?? ''), search) }} style={{ fontWeight: 600 }} />
                        <div className="row" style={{ gap: 8 }}>
                          <div style={getScoreBadgeStyle(Number(c?.score ?? 0))}>{Number(c?.score ?? 0)}</div>
                          <button onClick={(e) => { e.stopPropagation(); deleteCandidate(c.id); }} className="btn" style={{ padding: '2px 8px', fontSize: 12, color: '#ef4444' }} title="Delete">🗑️</button>
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>{c.email || '-'}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card card-lg">
          <div className="card-body">
            {selectedCandidate ? (
              <div className="stack">
                <div className="row-between">
                  <div>
                    <h2 className="title" style={{ fontSize: '1.5rem' }}>{selectedCandidate.name || 'Unnamed'}</h2>
                    <div className="row" style={{ gap: 12 }}>
                      <span className="muted">📧 {selectedCandidate.email || '-'}</span>
                      <span className="muted">📞 {selectedCandidate.phone || '-'}</span>
                      {selectedCandidate.resume && (
                        <span className="muted">📄 <a href={buildResumeUrl(selectedCandidate.resume)} target="_blank" rel="noreferrer">Download resume</a></span>
                      )}
                      {selectedCandidate.summary?.includes('Resume file:') && (
                        <span className="muted">📄 {(() => { const m = selectedCandidate.summary.match(/Resume file:\s([^\.]+)\.?/); return m ? m[1] : '-'; })()}</span>
                      )}
                      <span className="muted">📅 {selectedCandidate.created_at ? new Date(selectedCandidate.created_at).toLocaleString() : '-'}</span>
                    </div>
                  </div>
                  <div style={getScoreBadgeStyle(Number(selectedCandidate.score ?? 0), true)}>Score: {Number(selectedCandidate.score ?? 0)}/100</div>
                </div>

                <div>
                  <h3 className="section-title">Summary</h3>
                  <p className="muted">{selectedCandidate.summary || 'No summary available.'}</p>
                </div>

                <div>
                  <h3 className="section-title">Interview Responses ({selectedCandidate.answers?.length || 0} questions)</h3>
                  {(selectedCandidate.answers || []).map((a, idx) => (
                    <div key={idx} className="card" style={{ marginBottom: '.5rem' }}>
                      <div className="card-body">
                        <div className="row" style={{ gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>Q{idx + 1}</span>
                          <span style={getDifficultyBadge(a.difficulty)}>{a.difficulty}</span>
                          {!a.attended && (
                            <span className="badge" style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444' }}>
                              {a.reason === 'timeout' ? '⏱️ Timeout' : '⏭️ Skipped'}
                            </span>
                          )}
                          {typeof a.timeSpent === 'number' && (
                            <span className="badge" style={{ background: '#0b1220', border: '1px solid var(--border)' }}>🕒 {Math.max(0, a.timeSpent)}s</span>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, marginTop: 4 }}>{a.question}</div>
                        <div style={{ marginTop: 4 }}>
                          {a.answer ? (
                            <><strong>Answer:</strong> {a.answer}</>
                          ) : (
                            <span className="muted">No answer provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card"><div className="card-body" style={{ textAlign: 'center' }}><div style={{ fontSize: 64, marginBottom: 8 }}>👈</div><h3 className="title" style={{ fontSize: '1.125rem' }}>Select a candidate</h3><p className="muted">Choose a candidate from the list to view their details</p></div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getScoreBadgeStyle(score, large = false) {
  let bg, color;
  if (score >= 70) { bg = '#d1fae5'; color = '#065f46'; }
  else if (score >= 40) { bg = '#fef3c7'; color = '#92400e'; }
  else { bg = '#fee2e2'; color = '#991b1b'; }
  
  return {
    padding: large ? '8px 16px' : '4px 10px',
    borderRadius: 999,
    background: bg,
    color: color,
    fontWeight: 700,
    fontSize: large ? '1.125rem' : '0.875rem',
  };
}

function getDifficultyBadge(difficulty) {
  const colors = {
    Easy: { bg: '#dbeafe', color: '#1e40af' },
    Medium: { bg: '#fef3c7', color: '#92400e' },
    Hard: { bg: '#fee2e2', color: '#991b1b' },
  };
  const c = colors[difficulty] || colors.Easy;
  return {
    padding: '4px 10px',
    borderRadius: 999,
    background: c.bg,
    color: c.color,
    fontSize: '0.75rem',
    fontWeight: 600,
  };
}

const s = {
  loadingContainer: { minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  spinner: { width: 50, height: 50, border: '4px solid #f3f4f6', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' },
  errorContainer: { minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' },
  errorIcon: { fontSize: 64, marginBottom: '1rem' },
  retryBtn: { padding: '10px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginTop: '1rem' },
  container: { minHeight: '100vh', background: '#f9fafb', padding: '2rem' },
  header: { marginBottom: '2rem', textAlign: 'center' },
  title: { margin: 0, fontSize: '2.5rem', color: '#111827', fontWeight: 700 },
  subtitle: { margin: '0.5rem 0 0', color: '#6b7280' },
  layout: { display: 'flex', gap: '2rem', maxWidth: 1400, margin: '0 auto' },
  sidebar: { width: 350, flexShrink: 0 },
  controls: { background: '#fff', padding: '1.5rem', borderRadius: 12, marginBottom: '1rem', boxShadow: '0 1px 3px rgba(243, 239, 239, 0.94)219, 0.1)' },
  searchInput: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.9375rem', marginBottom: '0.75rem', boxSizing: 'border-box' },
  sortBtns: { display: 'flex', gap: '0.5rem' },
  sortBtn: { flex: 1, padding: '8px 12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all .2s' },
  sortBtnActive: { background: '#667eea', color: '#fff' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' },
  statItem: { background: '#fff', padding: '1rem', borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: '#111827' },
  statLabel: { fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' },
  list: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(243, 239, 239, 0.86)', maxHeight: 600, overflowY: 'auto', padding: '0.5rem' },
  empty: { padding: '3rem', textAlign: 'center', color: '#9ca3af' },
  emptyIcon: { fontSize: 48, marginBottom: '1rem' },
  card: { padding: '1rem', margin: '0.5rem', borderRadius: 8, cursor: 'pointer', transition: 'all .2s', border: '2px solid transparent' },
  cardActive: { background: '#f0f4ff', border: '2px solid #667eea' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontWeight: 600, fontSize: '1rem', color: '#111827' },
  cardEmail: { fontSize: '0.875rem', color: '#6b7280', marginBottom: 2 },
  cardDate: { fontSize: '0.75rem', color: '#9ca3af' },
  main: { flex: 1, background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxHeight: '80vh', overflowY: 'auto' },
  placeholder: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' },
  placeholderIcon: { fontSize: 64, marginBottom: '1rem' },
  details: {},
  detailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  detailsName: { margin: 0, fontSize: '1.75rem', color: '#111827', fontWeight: 700 },
  detailsMeta: { display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginTop: 4 },
  summary: { marginBottom: '1rem' },
  sectionTitle: { fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' },
  summaryText: { fontSize: '0.9375rem', color: '#374151' },
  answers: {},
  answerCard: { padding: '0.75rem', borderBottom: '1px solid #e5e7eb' },
  answerHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 },
  answerNum: { fontWeight: 600 },
  question: { fontWeight: 600, marginBottom: 2 },
  answer: { marginLeft: 12 },
  noAnswer: { fontStyle: 'italic', color: '#9ca3af' },
  skippedBadge: { background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 },
};
