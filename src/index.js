/**
 * Creates a new Electron window.
 * @module index
 */

const { app, BrowserWindow, Menu, screen, globalShortcut } = require('electron');

/**
 * Creates a new window for the application.
 * @function createWindow
 */
function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const win = new BrowserWindow({
        width,
        height,
        webPreferences: {
            nodeIntegration: true,
            devTools: true,
        },
        darkTheme: true,
        icon: "assets/images/calculator",
    });

    win.loadFile('pages/index.html');
    // globalShortcut.register('CommandOrControl+Shift+I', () => {
    //     win.webContents.openDevTools();
    // }); // was used for testing and debugging
}

// Create a new window when the app is ready
app.whenReady().then(() => {
    createWindow(); // create a new window
    Menu.setApplicationMenu(Menu.buildFromTemplate([])); // remove the default menu
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    // if the platform is not macOS, quit the app
    if (process.platform !== 'darwin') app.quit();
});

// Re-create a window in the app when the dock icon is clicked and there are no other windows open
app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
});
