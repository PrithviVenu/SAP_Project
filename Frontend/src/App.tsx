import { useState } from "react";

interface AnalysisResult {
  compatibility: string;
  issues: string[];
  recommendations: string[];
  converted_code?: string;
}

function normalizeCompatibility(text: string) {
  const norm = text.trim().toLowerCase();
  if (norm.includes("partial")) return "Partial Compatibility";
  if (norm.includes("full")) return "Fully Compatible";
  if (norm.includes("incompatible")) return "Incompatible";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export default function App() {
  const [code, setCode] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false); // NEW

  const analyzeCode = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      if (data.analysis?.compatibility) {
        data.analysis.compatibility = normalizeCompatibility(
          data.analysis.compatibility
        );
      }
      setResult(data.analysis);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.converted_code) {
      navigator.clipboard.writeText(result.converted_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // hide toast after 2s
    }
  };

  return (
    <div
      style={{ margin: "auto", width: "100vw", height: "100vh", padding: 20 }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ textAlign: "center" }}>
          ABAP to S/4HANA Analyzer & Conversion Tool
        </h1>

        <textarea
          rows={15}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your ABAP code here"
          style={{ width: "60%", fontFamily: "monospace" }}
        />
        <br />

        <button onClick={analyzeCode} disabled={loading || !code.trim()}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {(loading || result) && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 20 }}
        >
          <div
            style={{
              background: "#f9f9f9",
              padding: 16,
              borderRadius: 8,
              display: "flex",
              gap: 20,
              minHeight: 200,
              width: "100%",
              maxWidth: 1000,
              position: "relative",
            }}
          >
            {loading ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#555",
                }}
              >
                <span>Analyzing, this might take a few seconds...</span>
              </div>
            ) : (
              <div style={{ width: "100em", display: "flex" }}>
                <div style={{ flex: 1 }}>
                  <h2>Analysis Result:</h2>
                  <p>
                    <strong>Compatibility:</strong> {result?.compatibility}
                  </p>
                  <div>
                    <strong>Issues:</strong>
                    <ul>
                      {result?.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Recommendations:</strong>
                    <ul>
                      {result?.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#f0f0f0",
                    padding: 12,
                    borderRadius: 8,
                    maxHeight: 400,
                    overflowY: "auto",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    position: "relative", // for absolute positioning of button
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h2>Converted Code:</h2>
                    {result?.converted_code && (
                      <button
                        onClick={copyToClipboard}
                        style={{
                          fontSize: "0.9em",
                          padding: "4px 8px",
                          cursor: "pointer",
                          borderRadius: 4,
                        }}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  <pre style={{ margin: 0, overflowX: "auto" }}>
                    {result?.converted_code || "No converted code available."}
                  </pre>
                </div>
              </div>
            )}

            {copied && (
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: 20,
                  backgroundColor: "#4caf50",
                  color: "white",
                  padding: "5px 10px",
                  borderRadius: 4,
                  fontSize: "0.8em",
                }}
              >
                Copied to clipboard
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
