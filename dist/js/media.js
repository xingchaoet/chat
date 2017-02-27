var  navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;
var RTCSessionDescription=mozRTCSessionDescription||RTCSessionDescription||webkitRTCSessionDescription;
var RTCIceCandidate=RTCIceCandidate||mozRTCIceCandidate||webkitRTCIceCandidate;
//获取摄像头权限
function getMedia(v,a){
  var constraints={video:v,audio:a};
    function success(stream){
      localStream=stream;
    }
  function error(err){console.log(err);}
  navigator.getUserMedia( constraints,success,error);
}
var pc_config = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
function createpc(sid){
  pc=new RTCPeerConnection(null);
  console.log("pc 准备好了");
  pc.onaddstream=function(event){
    video.src=URL.createObjectURL(event.stream);
    remoteStream=event.stream;
  }
  pc.onicecandidate=function(event){
    if(event.candidate){
      socket.emit("candidate",sid,event.candidate);
    }
  }
  pc.addStream(localStream);
}





videoC.onclick=function(){
  getMedia(true,false);
  var inputradio=document.getElementsByClassName("socketId");
  for(var i of inputradio){
    if(i.checked){
      id=i.getAttribute("socketid");
      socket.emit("video",id);
      return;
    }
  }
  alert("请选择要与您视频的人");
}




socket.on("contact",function(){
      createpc(id);
      pc.createOffer(function sendsession(sessionD){
      pc.setLocalDescription(sessionD);
      socket.emit("session",sessionD,id);
      },function(err){
        console.log(err);
      });
})


socket.on("ask",function(name,id){
  if(confirm(name+"请求与您视频")){
    getMedia(true,false);
    createpc(id);
    initiator=id;
    socket.emit("media");//2号
  }
});

socket.on("session",function(sessionD){
  pc.setRemoteDescription(new RTCSessionDescription(sessionD));
  console.log(sessionD.type);
  if(sessionD.type=="offer"){
    pc.createAnswer(function(session){
      pc.setLocalDescription(session);
      socket.emit("session",session,initiator);
    },function(err){})
  }
});
socket.on("candidate",function(candidate){
  var candidate = new RTCIceCandidate({
      sdpMLineIndex: candidate.label,
      candidate: candidate.candidate
    });
    pc.addIceCandidate(candidate);
});