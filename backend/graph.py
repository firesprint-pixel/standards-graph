"""
graph.py
Builds a NetworkX graph from the standards seed data and provides
functions to expand a primary standard into its related standards.
"""

import json
import networkx as nx


def load_standards(path: str = "standards_seed.json") -> list:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_graph(standards: list) -> nx.DiGraph:
    """
    Builds a directed graph: each standard is a node, each relation is an edge.
    Edge direction: related_standard -> primary_standard (the relation "points to"
    the standard it references), matching graph_edges in the data contract.
    """
    graph = nx.DiGraph()

    # Add every standard as a node first, with its metadata attached
    for standard in standards:
        graph.add_node(
            standard["code"],
            title=standard["title"],
            scope=standard["scope"],
            version=standard["version"],
            category_code=standard["category_code"],
        )

    # Add edges based on each standard's "relations" list
    for standard in standards:
        for relation in standard.get("relations", []):
            graph.add_edge(
                standard["code"],
                relation["to"],
                type=relation["type"],
            )

    return graph


def expand_from_primary(graph: nx.DiGraph, primary_code: str) -> dict:
    """
    Given a primary standard code, find every standard connected to it
    (in either direction) along with the relationship type and a
    human-readable reason.
    """
    if primary_code not in graph:
        return {"primary": None, "related": [], "graph_edges": []}

    related = []
    graph_edges = []

    # Standards that reference the primary standard (predecessors)
    for neighbour in graph.predecessors(primary_code):
        edge_data = graph.get_edge_data(neighbour, primary_code)
        relation_type = edge_data["type"]
        related.append({
            "code": neighbour,
            "title": graph.nodes[neighbour]["title"],
            "version": graph.nodes[neighbour]["version"],
            "relation": relation_type,
            "reason": build_reason(relation_type, neighbour, primary_code),
        })
        graph_edges.append({"from": neighbour, "to": primary_code, "type": relation_type})

    return {
        "primary": {
            "code": primary_code,
            "title": graph.nodes[primary_code]["title"],
            "version": graph.nodes[primary_code]["version"],
        },
        "related": related,
        "graph_edges": graph_edges,
    }


def build_reason(relation_type: str, from_code: str, to_code: str) -> str:
    """Human-readable explanation for why two standards are connected."""
    reasons = {
        "normative_reference": f"{from_code} is normatively referenced by {to_code}.",
        "safety": f"{from_code} is referenced for electrical safety compliance.",
        "test_method": f"{from_code} is referenced for performance testing methods.",
        "installation": f"{from_code} covers installation-specific requirements.",
        "terminology": f"{from_code} defines terminology used by {to_code}.",
    }
    return reasons.get(relation_type, f"{from_code} is related to {to_code}.")


# Quick manual test
if __name__ == "__main__":
    standards = load_standards()
    g = build_graph(standards)
    result = expand_from_primary(g, "IS 10322")
    print(json.dumps(result, indent=2))