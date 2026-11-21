const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

let win;

function createWindow () {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 상단 기본 메뉴바(파일, 편집 등) 숨기기
  win.setMenuBarVisibility(false)
  win.loadFile('index.html')

  // 창이 켜지고 나면 백그라운드에서 업데이트 확인
  win.webContents.once('did-finish-load', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// 업데이트 관련 이벤트 처리
autoUpdater.on('update-available', () => {
  dialog.showMessageBox(win, {
    type: 'info',
    title: '업데이트 알림',
    message: '새로운 버전이 있습니다. 다운로드를 시작합니다.',
    buttons: ['확인']
  });
});

autoUpdater.on('update-downloaded', () => {
  const response = dialog.showMessageBoxSync(win, {
    type: 'info',
    title: '업데이트 준비 완료',
    message: '업데이트 다운로드가 완료되었습니다. 지금 재시작하여 적용하시겠습니까?',
    buttons: ['재시작', '나중에']
  });
  
  if (response === 0) {
    autoUpdater.quitAndInstall();
  }
});

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})