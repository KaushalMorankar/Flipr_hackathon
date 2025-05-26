# /monitoring/metrics.py


from datetime import datetime, timedelta
import numpy as np
from sklearn.cluster import KMeans

# /monitoring/metrics.py
def calculate_aht(tickets: list) -> float:
    resolved_tickets = [t for t in tickets if t.get("status") == "RESOLVED" and t.get("resolution_time")]
    if not resolved_tickets:
        return 0
    total_time = sum(
        (datetime.fromisoformat(t["resolution_time"]) - datetime.fromisoformat(t["timestamp"])).total_seconds()
        for t in resolved_tickets
    )
    return round(total_time / len(resolved_tickets), 1)

def calculate_fcr(tickets: list) -> float:
    fcr_count = len([t for t in tickets if t.get("fcr", False)])
    return fcr_count / len(tickets) if tickets else 0

def cluster_agents(agent_metrics: list) -> list:
    """Cluster agents by AHT and CSAT"""
    X = np.array([[m["aht"], m["csat"]] for m in agent_metrics])
    kmeans = KMeans(n_clusters=3)
    kmeans.fit(X)
    return kmeans.labels_.tolist()

# /monitoring/metrics.py
def calculate_avg_csat(tickets: list) -> float:
    csat_scores = [t.get("csat_score") for t in tickets if t.get("csat_score") is not None]
    return round(sum(csat_scores) / len(csat_scores), 2) if csat_scores else None