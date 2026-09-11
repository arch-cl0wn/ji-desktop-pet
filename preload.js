const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ji", {
    onSleepStateChange(callback) {
        ipcRenderer.on("sleep-state", (_event, sleeping) => {
            callback(sleeping);
        });
    },

   moveWindow(x, y) {
    ipcRenderer.send("move-window", x, y);
}
});