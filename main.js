const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

let win;

const positionFile = path.join(
    app.getPath("userData"),
    "position.json"
);

function loadPosition() {
    try {
        return JSON.parse(
            fs.readFileSync(positionFile, "utf8")
        );
    } catch {
        return null;
    }
}

function savePosition() {
    if (!win) return;

    const [x, y] = win.getPosition();

    fs.writeFileSync(
        positionFile,
        JSON.stringify({ x, y })
    );
}

function getIndiaTime() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata"
        })
    );
}

function isSleeping() {
    const now = getIndiaTime();

    const minutes =
        now.getHours() * 60 + now.getMinutes();

    // Sleep: 7:30 PM → 4:00 AM IST
    const sleepStart = 19 * 60 + 30;
    const sleepEnd = 4 * 60;

    return (
        minutes >= sleepStart ||
        minutes < sleepEnd
    );
}

function sayHello() {

    chatBubble.classList.remove("show");
    chatText.classList.remove("show");

    void chatBubble.offsetWidth;
    void chatText.offsetWidth;

    chatBubble.classList.add("show");
    chatText.classList.add("show");

    setTimeout(() => {

        chatBubble.classList.remove("show");
        chatText.classList.remove("show");

    }, 5000);
}

function sayRandomThing() {

    // Ji stays quiet while sleeping
    if (currentlySleeping) {
        return;
    }

    const message =
        messages[
            Math.floor(
                Math.random() * messages.length
            )
        ];

    chatText.innerHTML = message;

    chatBubble.classList.remove("show");
    chatText.classList.remove("show");

    // Restart cleanly
    void chatBubble.offsetWidth;
    void chatText.offsetWidth;

    chatBubble.classList.add("show");
    chatText.classList.add("show");

    // Hide after 3 seconds
    setTimeout(() => {

        chatBubble.classList.remove("show");
        chatText.classList.remove("show");

    }, 3000);
}

let messageTimer = null;

function scheduleNextMessage() {
    // Don't schedule anything while Ji is sleeping
    if (currentlySleeping) {
        return;
    }

    // Prevent duplicate timers
    if (messageTimer !== null) {
        return;
    }

    const delay =
        (5 + Math.random() * 10) * 60 * 1000;

    messageTimer = setTimeout(() => {

        messageTimer = null;

        // Ji may have fallen asleep while we were waiting
        if (currentlySleeping) {
            return;
        }

        sayRandomThing();

        // Schedule the next thought
        scheduleNextMessage();

    }, delay);
}

function sendSleepState() {
    if (!win) return;

    win.webContents.send(
        "sleep-state",
        isSleeping()
    );
}

function createWindow() {
    const savedPosition = loadPosition();

    win = new BrowserWindow({
        width: 300,
        height: 300,

        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,

        ...(savedPosition
            ? {
                x: savedPosition.x,
                y: savedPosition.y
            }
            : {}),

        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    win.loadFile("index.html");

    win.on("moved", savePosition);

    win.on("closed", () => {
        savePosition();
        win = null;
    });

    win.webContents.once("did-finish-load", () => {
        sendSleepState();
    });
}

ipcMain.on("move-window", (_event, x, y) => {

    if (!win) {
        return;
    }

    win.setPosition(
        Math.round(x),
        Math.round(y)
    );
});

app.whenReady().then(() => {
    createWindow();

    // Check every minute so Ji changes state automatically.
    setInterval(() => {
        sendSleepState();
    }, 60 * 1000);
});