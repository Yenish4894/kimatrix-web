# Frontend Quick Start Guide

Get KIMatrix Web frontend running in under 5 minutes.

## Prerequisites

```bash
# Check versions
node --version  # Should be 20+
npm --version   # Should be 10+
git --version   # Any recent version
```

## Setup Steps

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/KIMatrix/kimatrix-web.git
cd kimatrix-web

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy example file
cp .env.example .env.local

# Edit with your backend URL
# Windows: notepad .env.local
# Mac/Linux: nano .env.local
```

Set backend API URL:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 3. Start Backend API

Make sure the backend API is running on port 5000:

```bash
# In backend directory
npm run dev
```

### 4. Start Frontend

```bash
# In frontend directory
npm run dev
```

### 5. Open Browser

Navigate to:
```
http://localhost:3000
```

## Verify Setup

### Check Frontend

1. Open http://localhost:3000
2. You should see the landing page
3. Navigate to http://localhost:3000/login
4. Login form should appear

### Test Login

**Super Admin:**
```
Email: admin@kimatrix.com
Password: (your super admin password)
```

**Test Company:**
```
Email: (company email from backend)
Password: (company password)
```

### Check API Connection

Open browser console (F12) and look for:
- ✅ No CORS errors
- ✅ API requests to http://localhost:5000
- ✅ Successful responses (200/201)

## Common Issues

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Cannot connect to backend"

**Checks:**
1. Backend is running: http://localhost:5000
2. .env.local has correct API URL
3. No CORS issues in browser console

**Solution:**
```bash
# Check backend status
curl http://localhost:5000/health

# Restart frontend
npm run dev
```

### Issue: "Environment variable not defined"

**Solution:**
```bash
# Ensure .env.local exists
ls -la .env.local

# Copy from example if missing
cp .env.example .env.local

# Restart dev server
npm run dev
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Option 1: Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
PORT=3001 npm run dev
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit files in `src/` directory:
- `src/app/` - Pages and routes
- `src/components/` - React components
- `src/services/` - API calls
- `src/store/` - Redux state

### 3. Test Changes

```bash
# Dev server auto-reloads
npm run dev

# Check for errors in browser console
```

### 4. Lint Code

```bash
npm run lint
```

### 5. Build for Production

```bash
npm run build
npm start
```

### 6. Commit & Push

```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Pages (App Router)
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   ├── services/         # API layer
│   ├── store/            # Redux store
│   └── types/            # TypeScript types
├── public/               # Static files
├── .env.example          # Environment template
└── package.json          # Dependencies
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [UI_UX_DESIGN_SPEC.md](./UI_UX_DESIGN_SPEC.md) for design guidelines
- Review [docs/BACKEND_API_GUIDE.md](./docs/BACKEND_API_GUIDE.md) for API reference

## Need Help?

- Check existing documentation in `docs/` folder
- Review error messages in browser console
- Check backend logs for API issues
- Contact team for support

---

Happy coding! 🚀
