// IMPORTS
require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const { connectMongoDB } = require("./connect");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const staticRoute = require("./routes/staticRoute");
const userRoute = require("./routes/userRoute");
const cookieParser = require("cookie-parser");
const {
  checkForAuthenticationCookie,
} = require("./middlewares/authentication");

// connection to database
connectMongoDB("mongodb://127.0.0.1:27017/ZoomData").then(() => {
  console.log("MongoDB Connected");
});

//view engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// middlewares
app.use(express.static(path.resolve("public")));
app.use("/user", express.static(path.resolve("public")));
app.use("/peerjs", peerServer);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));

// routes
app.use("/", staticRoute);
app.use("/user", userRoute);

// socket-io connections
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});

// port listening
server.listen(process.env.PORT || 3030, () => {
  console.log("server started at port:3030");
});
