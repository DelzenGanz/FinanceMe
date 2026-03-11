import { app, BrowserWindow } from 'electron'
import path from 'node:path'

// Database layer
import { initDatabase, closeDatabase } from './database/db'
import { runMigrations } from './database/migrations'
import { runSeeders } from './database/seed'

// IPC Handlers
import { registerAuthHandlers } from './database/handlers/auth.handler'
import { registerTransactionHandlers } from './database/handlers/transactions.handler'
import { registerCategoryHandlers } from './database/handlers/categories.handler'
import { registerBudgetHandlers } from './database/handlers/budgets.handler'
import { registerSavingsHandlers } from './database/handlers/savings.handler'
import { registerInvestmentHandlers } from './database/handlers/investments.handler'
import { registerReportHandlers } from './database/handlers/reports.handler'
import { registerSettingsHandlers } from './database/handlers/settings.handler'



// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    icon: path.join(process.env.VITE_PUBLIC!, 'icon.png'),
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for preload scripts that may trigger native node modules depending on the configuration
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Forward renderer console logs to main terminal
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer][${level}] ${message} (${sourceId}:${line})`);
  });
}

// ── App Lifecycle ────────────────────────────────────────────

app.name = 'financement'

app.whenReady().then(() => {
  // 1. Initialize database connection
  initDatabase()

  // 2. Run migrations (CREATE TABLE IF NOT EXISTS)
  runMigrations()

  // 3. Seed default data
  runSeeders()

  // 4. Register all IPC handlers
  registerAuthHandlers()
  registerTransactionHandlers()
  registerCategoryHandlers()
  registerBudgetHandlers()
  registerSavingsHandlers()
  registerInvestmentHandlers()
  registerReportHandlers()
  registerSettingsHandlers()

  // 5. Create the window
  createWindow()
})

// macOS: re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

// Gracefully close the database on quit
app.on('before-quit', () => {
  closeDatabase()
})
