# Multi-LLM Platform with RAG Pipeline

A full-stack application that integrates multiple LLM providers (OpenAI, Claude, Gemini, Llama) with a RAG (Retrieval-Augmented Generation) pipeline for document-aware AI responses.

## Features

- Multi-LLM support (OpenAI, Claude, Gemini, Llama)
- RAG pipeline for document-aware AI responses
- File upload and management
- Semantic search capabilities
- Code generation with document context
- Dark/light mode theme

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 16+
- Docker and Docker Compose (optional)

### Running with Docker Compose

```bash
docker-compose up
```

### Running locally

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Keys

To use the various LLM providers, you'll need to set API keys in the Settings page or directly in the .env file.

## License

MIT
