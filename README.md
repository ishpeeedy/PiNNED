# PiNNED

**A neobrutalist pinboard app for collecting and organizing text, images, and links on an infinite canvas.**

![React 19](https://img.shields.io/badge/React_19-%23000000.svg?style=for-the-badge&logo=react&logoColor=a985ff)
![TypeScript](https://img.shields.io/badge/TypeScript-%23000000.svg?style=for-the-badge&logo=typescript&logoColor=a985ff)
![Vite](https://img.shields.io/badge/Vite-%23000000.svg?style=for-the-badge&logo=vite&logoColor=a985ff)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-%23000000.svg?style=for-the-badge&logo=tailwind-css&logoColor=a985ff)
![Zustand](https://img.shields.io/badge/Zustand-%23000000.svg?style=for-the-badge&logo=react&logoColor=a985ff)
![GSAP](https://img.shields.io/badge/GSAP-%23000000.svg?style=for-the-badge&logo=greensock&logoColor=a985ff)
![Node.js](https://img.shields.io/badge/Node.js-%23000000.svg?style=for-the-badge&logo=node.js&logoColor=a985ff)
![Express](https://img.shields.io/badge/Express-%23000000.svg?style=for-the-badge&logo=express&logoColor=a985ff)
![MongoDB](https://img.shields.io/badge/MongoDB-%23000000.svg?style=for-the-badge&logo=mongodb&logoColor=a985ff)
![Cloudinary](https://img.shields.io/badge/Cloudinary-%23000000.svg?style=for-the-badge&logo=cloudinary&logoColor=a985ff)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-%23000000.svg?style=for-the-badge&logo=googlegemini&logoColor=a985ff)
![Render](https://img.shields.io/badge/Render-%23000000.svg?style=for-the-badge&logo=render&logoColor=a985ff)
![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=a985ff)

<div align="center">
  <a href="https://pinned.ishpeeedy.dev">
    <img src="https://res.cloudinary.com/dzwjyg2ai/image/upload/v1773207656/IMP_Resources/github_assets/PiNNED_loader_hboirh.svg" width="400" />
  </a>
</div>

## Features

- **Infinite Canvas** — pan and zoom freely across your board
- **Drag & Drop** — Drag and drop images and links directly onto the canvas
- **AI Semantic Search** — natural language search powered by Google Gemini embeddings
- **Link Metadata Scraping** — paste a URL and get title, description, and thumbnail automatically
- **Right-Click Context Menu** — duplicate, delete, bring to front/back, change color, add tiles at cursor, undo, redo

---

### Frontend

| Tech            | Purpose                     |
| --------------- | --------------------------- |
| React 19        | UI framework                |
| TypeScript      | Type safety                 |
| Vite            | Build tool                  |
| Tailwind CSS    | Styling                     |
| Zustand         | Auth & theme state          |
| React Router v7 | Routing                     |
| Radix UI        | Accessible UI primitives    |
| react-rnd       | Resizable & draggable tiles |
| Lucide React    | Icons                       |
| GSAP            | Animations (homepage)       |
| Sonner          | Toast notifications         |
| TanStack Table  | Board settings data table   |
| Embla Carousel  | Homepage carousel           |
| Axios           | HTTP client                 |

### Backend

| Tech               | Purpose                    |
| ------------------ | -------------------------- |
| Node.js + Express  | REST API server            |
| TypeScript         | Type safety                |
| MongoDB + Mongoose | Database                   |
| JWT                | Authentication             |
| bcryptjs           | Password hashing           |
| Cloudinary         | Image storage & CDN        |
| Google Gemini AI   | Semantic search embeddings |
| Metascraper        | Link metadata scraping     |
| Multer             | File upload handling       |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Cloudinary account
- Google Gemini API key

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/pinned.git
cd pinned

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Variables

**Backend** — create `backend/.env`:

```env
PORT=5000
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/pinned
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key
```

**Frontend** — create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### Running Locally

```bash
# Start the backend (from /backend)
npm run dev

# Start the frontend (from /frontend)
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---
