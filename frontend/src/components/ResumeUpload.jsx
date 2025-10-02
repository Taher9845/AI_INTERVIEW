import React, { useState, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import { useDispatch } from "react-redux";
import { setCandidateInfo } from "../redux/slices/candidatesSlice";

const ResumeUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const openFilePicker = () => {
    if (inputRef.current) {
      try { inputRef.current.value = ""; } catch (_) {}
      inputRef.current.click();
    }
  };
  const dispatch = useDispatch();

  const validateAndSetFile = (selectedFile) => {
    const allowed = [".pdf", ".docx"];
    const lower = selectedFile.name.toLowerCase();
    
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      setError("Invalid file type. Please upload a PDF or DOCX file.");
      return false;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return false;
    }
    
    setError("");
    setFile(selectedFile);
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setError("");
      
      const response = await axios.post(
        `${API_BASE}/resume-upload/`,
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000
        }
      );
      
      const fields = response.data.parsed_fields || {};
      const uploadedFilename = response.data.filename || file.name;
      setParsedData(fields);
      
      dispatch(setCandidateInfo({
        name: fields.name || "",
        email: fields.email || "",
        phone: fields.phone || "",
        resumeFilename: uploadedFilename,
      }));
      
      if (onUploadSuccess) onUploadSuccess(fields);
    } catch (err) {
      console.error("Upload error:", err);
      if (err.code === 'ECONNABORTED') {
        setError("Upload timeout. Try a smaller file.");
      } else if (err.response) {
        setError(err.response.data.error || "Upload failed.");
      } else if (err.request) {
        setError("Cannot connect to server.");
      } else {
        setError("Unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedData(null);
    setError("");
  };

  return (
    <div className="card card-lg shadow">
      <div className="card-body">
        <h2 className="title">Upload Your Resume</h2>
        <p className="muted" style={{ marginTop: 6 }}>We'll extract your information automatically</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="card"
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          padding: '2rem',
          marginTop: '1rem',
          borderColor: error ? '#ef4444' : 'var(--border)',
          background: dragOver ? '#f0f9ff' : undefined,
          position: 'relative',
        }}
      >
        <div style={{ fontSize: 48, textAlign: 'center' }}>📄</div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <strong>{file ? "File Selected" : "Drag & drop resume"}</strong>
        </div>
        <div className="muted" style={{ textAlign: 'center' }}>or click to browse</div>
        <div className="muted" style={{ textAlign: 'center', fontSize: 12 }}>PDF, DOCX (Max 10MB)</div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={openFilePicker}>Choose file</button>
        </div>
        
        <input 
          type="file" 
          accept="application/pdf,.pdf,.docx" 
          onChange={handleFileChange} 
          ref={inputRef}
          style={{ display: 'none' }}
          name="resume"
        />
        
        {file && (
          <div className="card" style={{ marginTop: '1rem', padding: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="row">
              <span>📎</span>
              <strong>{file.name}</strong>
              <span className="muted" style={{ fontSize: 12 }}>({(file.size/1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={clearFile} className="btn btn-danger btn-sm">✕</button>
          </div>
        )}
      </div>

      {error && <div className="card" style={{ padding: '.75rem', color: '#991b1b', marginTop: '1rem' }}><span>⚠️</span> {error}</div>}

      <button onClick={handleUpload} disabled={loading || !file} className={`btn btn-primary ${loading || !file ? 'btn-muted' : ''}`} style={{ width: '100%', marginTop: '1rem' }}>
        {loading ? <>Uploading...</> : "Upload & Continue"}
      </button>

      {parsedData && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-body">
          <h3 className="section-title">✅ Extracted Information</h3>
          <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
            {['name', 'email', 'phone'].map(k => (
              <div key={k} className="row" style={{ justifyContent: 'space-between', background: '#f9fafb', border: '1px solid var(--border)', borderRadius: 8, padding: '.5rem .75rem' }}>
                <span style={{ fontWeight: 600 }}>{k.charAt(0).toUpperCase()+k.slice(1)}:</span>
                <span>
                  {parsedData[k] || <span className="muted">Not found</span>}
                </span>
              </div>
            ))}
          </div>
          {(!parsedData.name || !parsedData.email || !parsedData.phone) && (
            <p className="muted" style={{ marginTop: '1rem' }}>💡 Fill missing info in next step</p>
          )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
export default ResumeUpload;