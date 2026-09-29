import { useEffect, useState } from 'react';
import StandardsGraph from './StandardsGraph';
import './App.css';

const CANDIDATE_STANDARDS = [
  { code: "IS 1239 Part 1", title: "Mild Steel Tubes - Specification", version: "2004", score: 0.88 },
  { code: "IS 3589", title: "Electrically Welded Steel Pipes for Water and Sewage", version: "2001", score: 0.75 },
 ];

function App() {
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_standards: CANDIDATE_STANDARDS }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then(setBundle)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Standards Relationship Graph</h1>
      <p style={{ color: '#94a3b8' }}>
        Click a node to see why it's connected to the primary standard.
      </p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <StandardsGraph bundle={bundle} />
    </div>
  );
}

export default App;