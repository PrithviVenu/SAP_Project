import { useState } from "react";

interface AnalysisResult {
  compatibility: string;
  issues: string[];
  recommendations: string[];
  converted_code?: string;
}

// Normalizes the compatibility string for consistent display
function normalizeCompatibility(text: string) {
  let norm = text.trim().toLowerCase();

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

  const analyzeCode = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.analysis && data.analysis.compatibility) {
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

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>ABAP Code Analyzer</h1>

      <textarea
        rows={10}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your ABAP code here"
        style={{ width: "100%", fontFamily: "monospace" }}
      />
      <br />

      <button onClick={analyzeCode} disabled={loading || !code.trim()}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {result && (
        <div
          style={{
            marginTop: 20,
            background: "#f9f9f9",
            padding: 16,
            borderRadius: 8,
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          {/* Left side: Analysis */}
          <div style={{ flex: 1 }}>
            <h2>Analysis Result:</h2>

            <p>
              <strong>Compatibility:</strong> {result.compatibility}
            </p>

            <div>
              <strong>Issues:</strong>
              <ul>
                {result.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong>Recommendations:</strong>
              <ul>
                {result.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right side: Converted Code */}
          {result.converted_code && (
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
              }}
            >
              <h2>Converted Code:</h2>
              <pre
                style={{
                  margin: 0,
                  overflowX: "auto",
                }}
              >
                {result.converted_code}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
