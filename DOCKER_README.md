# Docker Development Setup with Hot Reloading

This project is configured to run in Docker with hot reloading enabled, meaning changes to your code will automatically trigger a rebuild of the application.

## Features

- 🔄 Hot reloading for all file changes
- 📁 Volume mounting for real-time code updates
- 🛠️ Nodemon for automatic server restarts
- 🔧 Optimized for development workflow

## Prerequisites

- Docker Desktop installed and running
- Node.js 18 or later (for local development)

## Running the Application

### Windows Users

1. Double-click `run-app.bat` or run it from PowerShell:
   ```powershell
   .\run-app.bat
   ```

2. Alternatively, use the PowerShell script:
   ```powershell
   .\run-app.ps1
   ```

### Linux/Mac Users

Run the following command:
```bash
docker-compose up --build
```

## Development

The application will automatically reload when you make changes to:
- Any files in the `src/` directory
- Any files in the `public/` directory
- Configuration files (vite.config.ts)

### Monitored File Extensions
- `.ts`, `.tsx` (TypeScript files)
- `.js`, `.jsx` (JavaScript files)
- `.json` (JSON files)
- `.css` (CSS files)
- `.html` (HTML files)

### Important Notes

1. The first build might take a few minutes as it installs all dependencies
2. Subsequent starts will be much faster due to Docker layer caching
3. The application will be available at `http://localhost:5173`
4. Changes to the Dockerfile or docker-compose.yml require a rebuild:
   ```bash
   docker-compose up --build
   ```

## Troubleshooting

1. If changes aren't reflecting:
   - Check if the file is being watched (see nodemon.json)
   - Try saving the file again
   - Check Docker logs for any errors

2. If the container fails to start:
   - Check if port 5173 is available
   - Ensure Docker Desktop is running
   - Try rebuilding the container:
     ```bash
     docker-compose down
     docker-compose up --build
     ```

3. For performance issues:
   - Check CPU and memory allocation in Docker Desktop settings
   - Ensure your mounted volumes aren't too large
   - Consider using .dockerignore to exclude unnecessary files