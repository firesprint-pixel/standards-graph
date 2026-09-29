import { useEffect, useState } from 'react';
import StandardsGraph from './StandardsGraph';
import './App.css';

const CANDIDATE_STANDARDS = [
  { code: "IS 10322", title: "Luminaires - General Requirements and Tests", version: "2016", score: 0.87 },
  { code: "IS 16107", title: "LED Luminaires for General Lighting Purposes", version: "2019", score: 0.81 },
  { code: "IS 10322 Part 5", title: "Luminaires - Particular Requirements - Street Lighting Luminaires", version: "2018", score: 0.79 },
  { code: "IS 60598", title: "Electric Luminaires - General Safety Requirements", version: "2020", score: 0.74 },
  { code: "IS 12063", title: "Classification of Degrees of Protection Provided by Enclosures of Electrical Equipment (IP Code)", version: "2018", score: 0.68 },
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