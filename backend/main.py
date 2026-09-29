"""
main.py
FastAPI app exposing POST /expand — accepts candidate standard codes,
expands the primary standard through the relationship graph, and
returns StandardsBundle.json.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from graph import load_standards, build_graph, expand_from_primary

app = FastAPI(title="Standards Intelligence", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build the graph once when the server starts
standards_data = load_standards()
standards_graph = build_graph(standards_data)

EXPECTED_REFERENCE_COUNTS = {
    "IS 10322": 6,  # we only have 4 of its known real-world cross-references seeded
}

class CandidateStandard(BaseModel):
    code: str
    title: str
    version: str
    score: float


class ExpandRequest(BaseModel):
    candidate_standards: List[CandidateStandard]


@app.get("/")
def root():
    return {"status": "Fiona Standards Graph module is running"}


@app.post("/expand")
def expand(request: ExpandRequest):
    """
    Accepts Mithra's candidate_standards list, picks the top-scoring one
    as the primary standard, expands it through the relationship graph,
    and returns StandardsBundle.json.
    """
    if not request.candidate_standards:
        return {"primary": None, "related": [], "graph_edges": [], "coverage_note": "No candidates provided."}

    # Highest-scoring candidate becomes the primary standard
    top_candidate = max(request.candidate_standards, key=lambda c: c.score)

    result = expand_from_primary(standards_graph, top_candidate.code)

    # Attach the score onto the primary standard in the response
    if result["primary"]:
        result["primary"]["score"] = top_candidate.score

    result["certification"] = {"bis_required": True, "scheme": "BIS Certification Scheme"}
    found_count = len(result["related"])
    expected_count = EXPECTED_REFERENCE_COUNTS.get(top_candidate.code, found_count)
    result["coverage_note"] = f"{found_count} of {expected_count} known cross-references in knowledge base"
    
    return result