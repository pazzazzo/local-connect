# local-connect

Create a connection between all your app on the same network

# Installation

Using npm:

```py
$ npm i local-connect
```

# Usage

```js
const { LocalConnection } = require("local-connect")
const id = "com.myapp.myid" //id used to recognize apps of the same id in the network
const lc = new LocalConnection(id)

lc.scan() //start scanning the ip trying to connect to it

lc.on("scan_finish", () => { //when scan is finish
    console.log(lc.connections.size); //log the number of connections
})

lc.on("connection", (socket) => { //when a connection starting; socket is a socket.io's Socket
    console.log("new connection");
    console.log(lc.connections.size); //log the number of connections
    socket.on("disconnect", () => { //when connection is finish
        console.log("disconnect");
        console.log(lc.connections.size); //log the number of connections
    })
})

lc.on("scanning", (i, total) => { //when an ip has been scanned
    console.log(`${i}/${total}`); //i is index of ip; total is total of ips to scan
})
```