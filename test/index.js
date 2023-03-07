let { LocalConnection } = require("../")

let lc = new LocalConnection("test")

lc.on("listen", () => {
    console.log("Server activated");
})

lc.scan()

lc.on("scan_finish", () => {
    console.log(lc.connections.size);
})

lc.on("connection", (socket) => {
    console.log("new connection");
    console.log(lc.connections.size);
    socket.on("disconnect", () => {
        console.log("disconnect");
        console.log(lc.connections.size);
    })
})

lc.on("scanning", (i, s) => {
    console.log(`${i}/${s}`);
})