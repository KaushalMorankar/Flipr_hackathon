# Flipr_hackathon

## How to run the app

### Frontend
- cd chatbot
- npm install
- npm run dev

### Backend
- cd python_models
- uvicorn main:app --reload --host 0.0.0.0 --port 8000

#### Redis for fast chats
- docker create --name my-redis -p 6379:6379 redis:latest
- docker start my-redis
- 
