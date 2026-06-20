# Running FinQuest with Docker

## Quick Commands

### Production (frontend + backend in one container)

```bash
cd "/home/israel/Desktop/funke final year projuct"
docker-compose up --build finquest
```

Open: **http://localhost:8000**

### Development (frontend + backend as separate services with hot reload)

```bash
cd "/home/israel/Desktop/funke final year projuct"
docker-compose --profile dev up --build
```

Open: **http://localhost:3000**

- Backend API: http://localhost:8001
- Frontend dev server: http://localhost:3000

### Stop everything

```bash
docker-compose down
```

## Production environment variables

```bash
SECRET_KEY="your-secret-key" docker-compose up --build finquest
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `your-default-secret-key-change-in-production` | JWT signing key |
| `DATABASE_URL` | `sqlite:///./data/finquest.db` | Database path |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed origins |
| `SECURE_COOKIES` | `false` | Set `true` with HTTPS |
| `SAME_SITE` | `Lax` | Cookie SameSite |

## Notes

- Database is persisted in `./data/finquest.db` via Docker volume.
- Python 3.12 is used because `numpy==1.26.4` has pre-built wheels for it.
- The `finquest` service includes numpy, scipy, and scikit-learn for AI features.
