const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const {ipcMain,globalShortcut} = require('electron')
const {evalOnServer} = require('./lib/eval-on-server.js');



const {dialog, Menu} = require('electron')
const {spawn} = require('child_process')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let currentSolutionPath
let currentServerPath

const menus = [
  {
    label: 'solution',
    submenu: [
      {
        label: 'Open Solution',
        click() {
          dialog.showOpenDialog({
            properties: ['openFile'],
            title: 'choose Wakanda Solution'
            //filters  :[{ name : "wakanda-enterprise-server"}]
          }, function (l) {
            if (l !== undefined && l.length > 0) {
              currentSolutionPath = l[0];
            }

          });
        }
      },
      {
        label: 'Start Solution',
        click() {
          if (currentSolutionPath && currentServerPath) {


            const wakandaServer = spawn(currentServerPath, [currentSolutionPath]);

            wakandaServer.stdout.on('data', (data) => {
             
              if ( data.toString().match('"backend" project\.*'))
              {
                //backend project started
               
                setTimeout(function(){
                  evalOnServer("var d=10; d;",(e,res)=>{
                    if(res) {
                        console.log(`${res}` );
                        win.webContents.send('connected-server',currentSolutionPath)
                    }
                  })
                },1000)
              }
              
            });

            wakandaServer.stderr.on('data', (data) => {
                dialog.showErrorBox("Error Launching Wakanda Server", data)
            });

            wakandaServer.on('close', (code) => {
              console.log(`wakanda server process exited with code ${code}`);
            });
          
          }
        }

      }
    ]

  },
  {
    label: "Server",
    submenu: [
      {
        label: "choose",
        click() {
          dialog.showOpenDialog({
            properties: ['openFile'],
            title: 'choose Wakanda Server',
            filters: [{ name: "Wakanda Server", extentions: [".exe"] }]
          }, function (l) {
            if (l !== undefined && l.length > 0) {
              currentServerPath = l[0];
              win.webContents.send("server-choose", currentServerPath);
            }

          });
        }
      },
      {
        label: 'open debugger',
        click() {
          require('electron').shell.openExternal('http://127.0.0.1:8080/debugger')
        }
      }


    ]
  }
]



function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600 })
  //maximize
  win.maximize();
  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.webContents.openDevTools()
  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
  const menu = Menu.buildFromTemplate(menus)
  Menu.setApplicationMenu(menu)
}

//register ipcMain msg handler
ipcMain.on("eval-on-server", (event, arg) => {
evalOnServer(arg, function (err, data) {
    
    event.sender.send("eval-done", data.toString());
  })

})

ipcMain.on("choose-server", (event, arg) => {

  dialog.showOpenDialog({
    properties: ['openFile'],
    title: 'choose Wakanda Server'
    //filters  :[{ name : "wakanda-enterprise-server"}]
  }, function (l) {
    if (l !== undefined && l.length > 0)
      event.sender.send("server-choose", l[0]);
  });

})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }

})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.