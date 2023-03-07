const { EventEmitter } = require("events")
const socketio = require("socket.io")
const { createServer } = require("http")
const { io, Socket } = require("socket.io-client");
const { exec } = require("child_process")

const os = require("os");
const { v4 } = require("uuid");

class LocalConnection extends EventEmitter {
    constructor(id, port = 25545) {
        super()
        if (!id || id === undefined) throw new Error("id is undefined! Create a local server need a id to avoid conflicts")
        this.port = port
        this.id = id
        this.connections = new Map()
        this.server = createServer()
        this.uuid = v4()
        this.io = new socketio.Server(this.server)
        this.io.on("connection", (socket) => {
            if (socket.handshake.auth["type"] === "local-connect.search" && socket.handshake.auth["id"] === id) {
                if (!this.connections.has(socket.handshake.auth["uuid"])) {
                    this.connections.set(socket.handshake.auth["uuid"], new Connection(socket, socket.handshake.auth["uuid"], socket.handshake.address))
                    socket.on("disconnect", () => {
                        this.connections.delete(socket.handshake.auth["uuid"])
                    })
                    this.emit("connection", socket)
                } else {
                    return socket.disconnect()
                }
            } else {
                return socket.disconnect()
            }
            socket.on("uuid.get", (callback) => {
                callback(this.uuid)
            })
        })
        this.server.listen(port, () => {
            this.emit("listen")
        })
    }
    scan () {
        exec("arp -a", (err, out, e) => {
            let res = out.match(/(\d)+\.(\d)+\.(\d)+\.(\d)+/g)
            let net = os.networkInterfaces()
            let address = new Set()
            for (const name in net) {
                net[name].forEach(v => {
                    if (v.family === "IPv4") {
                        address.add(v.address)
                    }
                })
            }
            let j = 0
            res.forEach((ip) => {
                if (address.has(ip)) {
                    j++
                    this.emit("scanning", j, res.length, ip)
                    return
                }
                let socket = io("http://" + ip + ":" + this.port, { "auth": { "type": "local-connect.search", "id": this.id, "uuid": this.uuid }, reconnection: false })
                socket.on("connect", () => {
                    let responsed = false
                    socket.emit("uuid.get", (uuid) => {
                        responsed = true
                        if (!this.connections.has(uuid)) {
                            this.connections.set(uuid, new Connection(socket, uuid, ip))
                            socket.on("disconnect", () => {
                                this.connections.delete(uuid)
                            })
                            this.emit("connection", socket)
                            j++
                            this.emit("scanning", j, res.length, ip)
                            if (j === res.length) {
                                this.emit("scan_finish")
                            }
                        } else {
                            socket.disconnect()
                            j++
                            this.emit("scanning", j, res.length, ip)
                            if (j === res.length) {
                                this.emit("scan_finish")
                            }
                        }
                    })
                    setTimeout(() => {
                        if (!responsed) {
                            if (socket.connected) {
                                socket.close()
                            }
                            j++
                            this.emit("scanning", j, res.length, ip)
                            if (j === res.length) {
                                this.emit("scan_finish")
                            }
                        }
                    }, 3000);
                })
                socket.on("connect_error", () => {
                    j++
                    this.emit("scanning", j, res.length, ip)
                    if (j === res.length) {
                        this.emit("scan_finish")
                    }
                })
            })
        })
        return this
    }
}

class Connection extends EventEmitter {
    constructor(socket, id, ip) {
        super()
        this.socket = socket
        this.id = id
        this.ip = ip
    }
}

module.exports = {
    "LocalConnection": LocalConnection,
    "Connection": Connection
}