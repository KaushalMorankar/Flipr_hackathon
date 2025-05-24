import os
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import pinecone

# Load .env
load_dotenv()

# Initialize embedding model
EMBED_MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Initialize Pinecone
pinecone.init(
    api_key=os.getenv("PINECONE_API_KEY"),
    environment=os.getenv("PINECONE_ENVIRONMENT")
)
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
index = pinecone.Index(INDEX_NAME)

def embed_text(text: str) -> np.ndarray:
    """Return a 1-D float32 embedding vector for `text`."""
    vec = EMBED_MODEL.encode(text, convert_to_numpy=True)
    return vec.astype("float32")

def search_index(query_vec: np.ndarray, top_k: int = 3):
    """
    Query Pinecone for the top_k nearest neighbors.
    Returns the list of matching texts.
    """
    response = index.query(
        vector=query_vec.tolist(),
        top_k=top_k,
        include_metadata=True
    )
    # assume each match has metadata.text
    return [match.metadata.get("text", "") for match in response.matches]
