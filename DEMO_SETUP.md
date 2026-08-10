# MediShield AI - Production Live Demo Setup Guide

This guide provides step-by-step instructions to deploy the **MediShield AI** application as a live public demo. 

The application utilizes a **React.js** frontend, a **Node.js/Express** backend, a **MySQL** database (managed via Sequelize), and integrations with **Google Gemini** and **OCR.space**.

---

## 1. Database Setup (Cloud MySQL)
Since the backend runs on MySQL, you will need a hosted MySQL database instance.

### Option A: Railway (Recommended)
1. Go to [Railway.app](https://railway.app/) and create an account.
2. Click **New Project** -> **Provision MySQL**.
3. Railway will provision a MySQL database. Once created:
   - Go to the **Variables** tab of the MySQL service.
   - Note down the `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, and `MYSQLPASSWORD`.
   - Your database connection URL format: `mysql://root:password@host:port/database`

### Option B: Aiven MySQL
1. Sign up at [Aiven.io](https://aiven.io/).
2. Create a new **MySQL** service on the free tier (if available) or hobbyist plan.
3. Once the service is running, note down:
   - Host name
   - Port number
   - User name (`avnadmin`)
   - Password
   - Database name (`defaultdb`)

---

## 2. Backend Deployment on Render
1. Go to [Render.com](https://render.com/) and sign up.
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository containing the MediShield AI project.
4. Set the following configuration options:
   - **Name**: `medishield-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js` (Ensure database is created; our `server.js` automatically creates database tables on start)
5. In the **Environment Variables** section, add the following:
   - `PORT`: `5000`
   - `DB_HOST`: *(Your Cloud MySQL Host)*
   - `DB_PORT`: *(Your Cloud MySQL Port, usually 3306)*
   - `DB_NAME`: *(Your Cloud MySQL Database Name)*
   - `DB_USER`: *(Your Cloud MySQL User)*
   - `DB_PASS`: *(Your Cloud MySQL Password)*
   - `JWT_SECRET`: *(A random, long string for JWT token signatures)*
   - `GEMINI_API_KEY`: *(Your Google Gemini Developer API key)*
   - `OCR_API_KEY`: *(Your OCR.space API key, e.g., K81975917288957)*
   - `FRONTEND_URL`: *(Your deployed Vercel frontend URL, e.g., `https://medishield-ai.vercel.app`. You can add this later once the frontend is deployed)*
6. Click **Deploy Web Service**. Render will build and start your Node.js application. Note down the backend service URL (e.g. `https://medishield-backend.onrender.com`).

---

## 3. Frontend Deployment on Vercel
1. Go to [Vercel.com](https://vercel.com/) and sign up.
2. Click **Add New** -> **Project**.
3. Select the repository from your connected GitHub account.
4. Set the following configuration options:
   - **Framework Preset**: `Vite` (Vercel should auto-detect this)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: *(The URL of your deployed Render backend, with the `/api` suffix. Example: `https://medishield-backend.onrender.com/api`)*
   - `VITE_OCR_API_KEY`: *(Your OCR.space API key)*
6. Click **Deploy**. Vercel will build and deploy your React app.

---

## 4. Post-Deployment Checklist
1. **Update Backend CORS**:
   - Go to your Render dashboard for `medishield-backend`.
   - In the **Environment** settings, update the `FRONTEND_URL` environment variable to match the live Vercel URL (e.g., `https://medishield-ai.vercel.app`).
   - Re-deploy the backend service to apply changes.
2. **Verify Registration & Login**:
   - Open your live Vercel frontend URL.
   - Go to `/register` and create an account.
   - Go to `/login` and sign in.
3. **Verify AI Chatbot**:
   - Click on the **AI Assistant** tab.
   - Send a query in English, Hindi, or Tamil and verify that you get an intelligent response from the Gemini integration.
4. **Verify Prescription Scanner**:
   - Navigate to the **Prescription Scanner** tab.
   - Upload an image of a prescription.
   - Click "Scan Prescription". If an OCR API key was provided, it will extract the text, send it to the backend AI to parse, and allow you to add the medicines directly to your schedule.

---

## 5. Troubleshooting
- **Backend fails to connect to Database**: Double check that the database host allows external incoming connections, and that your database credentials (`DB_PASS`, `DB_USER`) do not contain special characters that were parsed incorrectly.
- **CORS Errors**: If the frontend console shows CORS blocks, make sure the `FRONTEND_URL` on Render matches your Vercel deployment URL exactly (without a trailing slash `/`).
- **Render Web Service goes to sleep**: Render's free tier services spin down after 15 minutes of inactivity. The first request after a spin-down can take up to 50 seconds to respond. This is normal behavior for free hosting.
