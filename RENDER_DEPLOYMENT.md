# Deploying AI Interviewer to Render

This guide will help you deploy your Django backend and React frontend to Render.

## Prerequisites
- A GitHub account with your code pushed to a repository
- A Render account (sign up at https://render.com)
- Your GROQ API key

---

## Part 1: Deploy Django Backend

### Step 1: Create a Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your `AI_Interviewer` repository

### Step 2: Configure the Web Service

Fill in the following settings:

- **Name**: `ai-interviewer-backend` (or any name you prefer)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn backend_project.wsgi:application`
- **Instance Type**: `Free` (or paid plan for better performance)

### Step 3: Add Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `SECRET_KEY` | Generate a secure key (use Django's `get_random_secret_key()`) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.onrender.com` |
| `GROQ_API_KEY` | Your actual GROQ API key |

**To generate a SECRET_KEY**, run this in Python:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your backend
3. Wait for the deployment to complete (5-10 minutes)
4. Note your backend URL: `https://ai-interviewer-backend.onrender.com`

---

## Part 2: Deploy React Frontend

### Step 1: Update Frontend API URL

Before deploying the frontend, update your API base URL:

1. Open `frontend/src/` and find where you configure axios/API calls
2. Update the base URL to your Render backend URL:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'https://ai-interviewer-backend.onrender.com';
   ```

3. Create `frontend/.env.production`:
   ```
   VITE_API_URL=https://ai-interviewer-backend.onrender.com
   ```

### Step 2: Create a Static Site on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Select your repository again

### Step 3: Configure the Static Site

- **Name**: `ai-interviewer-frontend`
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Step 4: Add Environment Variables (if needed)

Add any frontend environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://ai-interviewer-backend.onrender.com` |

### Step 5: Deploy

1. Click **"Create Static Site"**
2. Wait for deployment to complete
3. Your frontend will be available at: `https://ai-interviewer-frontend.onrender.com`

---

## Part 3: Update Backend CORS Settings

After deploying the frontend, update your backend's CORS settings:

1. Go to your backend service on Render
2. Add a new environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://ai-interviewer-frontend.onrender.com`

3. Update `backend/backend_project/settings.py` to use this:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:5173",
       "http://127.0.0.1:5173",
       os.getenv("FRONTEND_URL", ""),
   ]
   ```

4. Commit and push changes - Render will auto-redeploy

---

## Important Notes

### Free Tier Limitations
- **Backend**: Spins down after 15 minutes of inactivity (first request after sleep takes ~30 seconds)
- **Frontend**: Always available (static site)
- **Database**: SQLite is ephemeral on Render (resets on each deploy)

### Database Recommendation
For production, consider using PostgreSQL:

1. Create a PostgreSQL database on Render
2. Update `requirements.txt`:
   ```
   psycopg2-binary==2.9.9
   dj-database-url==2.1.0
   ```

3. Update `settings.py`:
   ```python
   import dj_database_url
   
   DATABASES = {
       'default': dj_database_url.config(
           default='sqlite:///db.sqlite3',
           conn_max_age=600
       )
   }
   ```

### Custom Domain
To use a custom domain:
1. Go to your service settings
2. Click "Custom Domain"
3. Follow Render's instructions to configure DNS

---

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `build.sh` has correct permissions

### Frontend can't connect to backend
- Verify CORS settings in Django
- Check that `VITE_API_URL` is correct
- Inspect browser console for errors

### Static files not loading
- Ensure `collectstatic` runs in `build.sh`
- Verify `STATIC_ROOT` and `STATIC_URL` in settings.py
- Check WhiteNoise configuration

---

## Quick Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create backend web service on Render
- [ ] Add environment variables (SECRET_KEY, GROQ_API_KEY, etc.)
- [ ] Deploy backend and note the URL
- [ ] Update frontend API URL
- [ ] Create frontend static site on Render
- [ ] Deploy frontend
- [ ] Update backend CORS with frontend URL
- [ ] Test the application

---

## Support

If you encounter issues:
1. Check Render logs (Dashboard → Your Service → Logs)
2. Review Render documentation: https://render.com/docs
3. Check Django deployment guide: https://docs.djangoproject.com/en/5.2/howto/deployment/

Good luck with your deployment! 🚀
