import React, { useState } from "react";
import Interviewee from "./pages/Interviewee";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState("interviewee");

  return (
    <div>
      <header className="container" style={{ paddingTop: "1.5rem", paddingBottom: "1rem" }}>
        <div className="row-between">
          <div className="row" style={{ gap: ".75rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.25rem" }}>AI</div>
            <div>
              <div className="title" style={{ fontSize: 22, fontWeight: 900 }}>AI Interview Assistant</div>
              <div className="muted" style={{ fontSize: 13 }}>Master your next interview with AI-powered coaching</div>
            </div>
          </div>
          <div className="tabs">
            <div onClick={() => setActiveTab("interviewee")} className={`tab ${activeTab === "interviewee" ? "active" : ""}`}>
              Start Chat
            </div>
            <div onClick={() => setActiveTab("dashboard")} className={`tab ${activeTab === "dashboard" ? "active" : ""}`}>
              Dashboard
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ marginTop: "1.5rem" }}>
        {activeTab === "interviewee" ? <Interviewee /> : <Dashboard />}
      </main>
    </div>
  );
}
