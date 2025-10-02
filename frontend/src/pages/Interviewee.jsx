import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import ResumeUpload from "../components/ResumeUpload";
import ProfileForm from "../components/ProfileForm";
import Chat from "../components/Chat";
import WelcomeBackModal from "../components/WelcomeBackModal";
import { resetCandidate, resumeCandidate } from "../redux/slices/candidatesSlice";

export default function Interviewee() {
  const dispatch = useDispatch();
  const candidate = useSelector((state) => state.candidate);
  
  const [step, setStep] = useState("resume"); // resume | profile | interview
  const [parsedData, setParsedData] = useState(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Check if there's an unfinished interview on mount
  useEffect(() => {
    const hasUnfinishedInterview =
      candidate.currentQuestion > 0 &&
      candidate.name &&
      candidate.email &&
      candidate.phone;

    if (hasUnfinishedInterview) {
      setShowWelcomeBack(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResumeInterview = () => {
    setShowWelcomeBack(false);
    dispatch(resumeCandidate());
    setStep("interview");
  };

  const handleStartNewInterview = () => {
    setShowWelcomeBack(false);
    dispatch(resetCandidate());
    setStep("resume");
    setParsedData(null);
  };

  const handleUploadSuccess = (fields) => {
    setParsedData(fields);
    setStep("profile");
  };

  const handleProfileDone = () => {
    setStep("interview");
  };

  return (
    <div className="container" style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
      {showWelcomeBack && (
        <WelcomeBackModal
          candidate={candidate}
          onResume={handleResumeInterview}
          onStartNew={handleStartNewInterview}
        />
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
        <h1 className="title" style={{ textAlign: 'center', marginBottom: '1rem' }}>AI Interview System</h1>
        
        {step === "resume" && (
          <ResumeUpload onUploadSuccess={handleUploadSuccess} />
        )}
        
        {step === "profile" && (
          <ProfileForm parsed={parsedData} onDone={handleProfileDone} />
        )}
        
        {step === "interview" && <Chat />}
      </div>
    </div>
  );
}