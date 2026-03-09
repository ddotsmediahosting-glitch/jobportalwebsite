const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')

let mainWindow
let serverProcess

// Determine resource paths (works both in dev and packaged)
function getResourcePath(...parts) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...parts)
  }
  return path.join(__dirname, '..', '..', ...parts)
}

// Start the embedded Express backend
function startBackend() {
  // Ensure data directory exists
  const dataDir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  // Set env vars for the backend
  process.env.PORT = '5199'
  process.env.DATA_DIR = dataDir
  process.env.JWT_SECRET = 'todoapp-desktop-secret-key'

  try {
    // Load the backend server module
    const serverPath = getResourcePath('backend', 'src', 'server.js')
    require(serverPath)
    console.log('Backend started on port 5199')
  } catch (err) {
    console.error('Failed to start backend:', err)
  }
}

// Wait for the backend to be ready
function waitForBackend(callback, retries = 20) {
  http.get('http://localhost:5199/api/health', (res) => {
    if (res.statusCode === 200) {
      callback()
    } else {
      retry()
    }
  }).on('error', () => {
    if (retries > 0) {
      setTimeout(() => waitForBackend(callback, retries - 1), 300)
    } else {
      console.error('Backend did not start in time')
      callback() // load anyway
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: 'TodoApp',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  // Load the built React app
  const frontendPath = getResourcePath('frontend', 'dist', 'index.html')
  mainWindow.loadFile(frontendPath)

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  startBackend()
  waitForBackend(() => {
    createWindow()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
