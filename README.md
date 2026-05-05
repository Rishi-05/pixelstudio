# PixelStudio 

A full-stack local AI image generation platform built with **React + FastAPI + ComfyUI**.
Generate stunning images from text prompts with real-time progress tracking, a personal gallery, and shareable links — all running locally on your machine.

---

## ✨ Features

-  **User Authentication** — Register, login, JWT-based auth
-  **AI Image Generation** — Text-to-image via ComfyUI + Stable Diffusion
-  **Real-time Progress** — Live generation progress via WebSockets
-  **Personal Gallery** — Browse, view, and manage all your generated images
-  **Download Images** — Save any generated image locally
-  **Share Links** — Generate public share links for any image

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python) |
| Database | SQLite (async) via SQLAlchemy |
| Auth | JWT via python-jose |
| AI Engine | ComfyUI + Stable Diffusion |
| Model | DreamShaper 8 / SD 1.5 |
| Real-time | WebSockets |
| Styling | Custom CSS with CSS variables |

---

## 📁 Project Structure

```
pixelstudio/
├── backend/
│   ├── main.py               # FastAPI app entrypoint
│   ├── database.py           # Async SQLAlchemy setup
│   ├── comfy_client.py       # ComfyUI HTTP + WebSocket client
│   ├── ws_manager.py         # WebSocket connection manager
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── config.py         # Settings from .env
│   │   └── auth.py           # JWT helpers
│   ├── models/
│   │   ├── user.py           # User ORM model
│   │   └── job.py            # Generation job ORM model
│   └── routes/
│       ├── auth.py           # Register, login, me
│       ├── generate.py       # Submit job, WebSocket progress
│       └── images.py         # Gallery, share, download
└── frontend/
    └── src/
        ├── api/
        │   └── client.js     # Axios client + API helpers
        ├── store/
        │   └── authStore.js  # Zustand auth store
        ├── hooks/
        │   └── useJobProgress.js  # WebSocket progress hook
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── UI.jsx        # Button, Input, Spinner, Toast etc.
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── GeneratePage.jsx
            ├── GalleryPage.jsx
            └── SharePage.jsx
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- ComfyUI (local or Google Colab)
- A Stable Diffusion model (DreamShaper 8 recommended)

---

### 1. Clone the repo

```bash
git clone https://github.com/Rishi-05/pixelstudio.git
cd pixelstudio
```

---

### 2. Set up Python environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

---

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

### 4. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set:

```dotenv
SECRET_KEY=your-random-secret-key
COMFY_HOST=127.0.0.1
COMFY_PORT=8188
COMFY_OUTPUT_DIR=C:\path\to\ComfyUI\output
IMAGES_DIR=E:\path\to\backend\images
FRONTEND_ORIGIN=http://localhost:5173
```

> Generate a secret key with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

---

### 6. Download a model

Place your model in `ComfyUI/models/checkpoints/`. Recommended:

**DreamShaper 8** (~2GB, great for anime + cinematic styles):
```
https://huggingface.co/Lykon/dreamshaper-8/resolve/main/DreamShaper_8_pruned.safetensors
```

---

## ▶️ Running the App

You need **3 terminals** running simultaneously:

### Terminal 1 — ComfyUI
```bash
cd ComfyUI
venv\Scripts\activate
python main.py --lowvram
```

### Terminal 2 — Backend
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 3 — Frontend
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🎨 Recommended Prompt Style

**Positive:**
```
masterpiece, best quality, ultra detailed, cinematic lighting,
volumetric lighting, depth of field, highly detailed background,
dramatic shadows, artstation style
```

**Negative:**
```
low quality, worst quality, blurry, pixelated, bad anatomy,
extra limbs, missing fingers, deformed face, watermark, text
```

## 👤 Author

**Rishi** — [github.com/Rishi-05](https://github.com/Rishi-05)

---

> Built with using ComfyUI, FastAPI, and React
