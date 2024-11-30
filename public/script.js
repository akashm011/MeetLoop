const socket = io();
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {};

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOMID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
    location.reload();
  });

  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const inputMsg = document.getElementById("chat_message");

inputMsg.addEventListener("keydown", (e) => {
  if (e.which == 13 && inputMsg.value.length != 0) {
    socket.emit("message", inputMsg.value);
    inputMsg.value = "";
  }
});

socket.on("createMessage", (message) => {
  const msg = document.querySelector(".messages");
  const messageElement = document.createElement("li");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<b>user</b><br/>${message}`;
  msg.appendChild(messageElement);
  scrollToBottom();
});

const scrollToBottom = () => {
  const d = document.querySelector(".main_chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

// Mute the video
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
};

const setMuteButton = () => {
  const html = `
    <i class="ri-mic-line"></i>
    <span>Mute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="ri-mic-off-fill"></i>
    <span>Unmute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setStopVideo = () => {
  const html = `
    <i class="ri-video-on-line"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
 <i class="ri-video-off-line"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const meetingEnd = () => {
  window.location.href = "/home";
};
