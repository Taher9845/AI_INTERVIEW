# AI Interviewer

An AI-powered interview practice application that helps users prepare for technical interviews with real-time feedback and analysis.

## Features

- Interactive chat interface with AI interviewer
- Real-time timer for interview sessions
- Dashboard for tracking interview history
- Modern, responsive UI built with React and TailwindCSS

## Tech Stack

### Frontend
- React
- TailwindCSS
- Vite

### Backend
- Python
- Flask/FastAPI (check requirements.txt for specifics)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the backend server:
```bash
python app.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

## Usage

1. Start both backend and frontend servers
2. Open your browser and navigate to the frontend URL (typically http://localhost:5173)
3. Begin your AI interview practice session

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add environment variable:
   - `VITE_API_BASE`: Your backend API URL (e.g., `https://your-backend.railway.app/api`)
6. Deploy!

### Backend (Railway/Render)

**Option 1: Railway**
1. Go to [Railway](https://railway.app)
2. Create new project from GitHub repo
3. Select the `backend` directory
4. Add environment variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `SECRET_KEY`: Django secret key
   - `DEBUG`: Set to `False` for production
5. Railway will auto-deploy

**Option 2: Render**
1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Set root directory to `backend`
5. Add environment variables
6. Deploy

**Important:** After deploying backend, update the `VITE_API_BASE` environment variable in Vercel with your backend URL.

## License

MIT
