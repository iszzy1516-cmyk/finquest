# Running FinQuest with Docker

This project includes Docker support for both production and development environments.

## Production (Single Container)

The production Dockerfile builds the React frontend and FastAPI backend into a single image. The backend serves both the API and the static frontend files.

### Build and run:

```bash
cd "/home/israel/Desktop/funke final year projuct"
docker-compose up --build finquest
```

Then open: **http://localhost:8000**

### Production environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `your-default-secret-key-change-in-production` | JWT signing key |
| `DATABASE_URL` | `sqlite:///./data/finquest.db` | Database connection string |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed frontend origins |
| `SECURE_COOKIES` | `false` | Set to `true` in production with HTTPS |
| `SAME_SITE` | `Lax` | Cookie SameSite attribute |

To set a custom secret key:

```bash
SECRET_KEY="your-super-secret-key-here" docker-compose up --build finquest
```

## Development (Two Containers)

For development with hot reload, run the backend and frontend as separate services.

### Start both services:

```bash
cd "/home/israel/Desktop/funke final year projuct"
docker-compose --profile dev up --build
```

This starts:
- **Backend**: http://localhost:8001
- **Frontend**: http://localhost:3000

The frontend Vite dev server proxies API requests to the backend.

### Start only the backend:

```bash
docker-compose --profile dev up --build backend-dev
```

### Start only the frontend:

```bash
docker-compose --profile dev up --build frontend-dev
```

## Building the Image Manually

```bash
cd "/home/israel/Desktop/funke final year projuct"
docker build -t finquest .
docker run -p 8000:8000 finquest
```

## Notes

- The SQLite database is persisted in `./data/finquest.db` via a Docker volume.
- The production image is a single container that handles both frontend and backend.
- For large-scale deployments, consider migrating to PostgreSQL and using a reverse proxy like Nginx or Traefik.
