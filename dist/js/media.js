var modal=document.getElementById("modal");
    var chat=document.getElementById("chat");
    var socket;
    var videoContain=document.getElementById("videoContain");
    var disconnect=document.getElementById("disconnect");
    var audiodisconnect=document.getElementById("audiodisconnect");
    var audioC=document.getElementById("audioControl");
    var video=document.getElementById("video");
    var sendMsg=document.getElementById("sendMsg");
    var Msg=document.getElementsByClassName("Msg")[0];
    var chatContent=document.getElementsByClassName("chatContent")[0];
    var name="";
     var localStream,remoteStream,peerconnection;
    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var videoC=document.getElementById("videoControl");
    var initiator;//发送者ID
    var id;//接受者的ID
    var AudioContext=AudioContext||webkitAudioContext;
    var context=new AudioContext;
    var streamNode;//音频节点
    var left=[],right=[],sampleRate,recordingLength=0;//左右音道数据数组,采样频率,音频数据长度
    modal.style.height=window.screen.availHeight+"px";
//浏览器兼容
    var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
    var isOpera = userAgent.indexOf("Opera") > -1;
    if (userAgent.indexOf("Firefox") > -1) {
        RTCSessionDescription=mozRTCSessionDescription;
        RTCIceCandidate=mozRTCIceCandidate;
    } 
//侧边单选栏
    var tempRadio=null;
    function checkradio(radio) {
      var inputradio=document.getElementsByClassName("socketId");
      for(i of inputradio){
        if(i==radio) continue;
        i.checked=false;
      }
      if(tempRadio==radio){
        radio.checked=false;
        tempRadio=null;
      }else{
        tempRadio=radio;
      }
    }
    //bug  如果不登陆 其实也会也有信息接受
    //--------------------验证登陆
    document.getElementById("sendNickName").onclick=function login(){
        name=document.getElementById("nickName").value
        socket=io();
        socket.emit("login",name);
    //-------------------------登录成功
    socket.on("login",function(){
      modal.style.display="none";
      chat.style.display="block";
    });
    //----------------------------用户登进登出
    socket.on("system",function(data,socketid){//后面data要变成对象，因为要添加头像     
      var loginStr="";
      var arr=data;
      for (var k in arr){
        loginStr+='<input type="radio" onclick="checkradio(this)" class="socketId" socketId="'+socketid[k]+'"><img src="images/tx.jpg" height="64" width="64" alt="" class="img-thumbnail" /><span>'+data[k]+'</span><br /></a>'
      }
      document.getElementsByClassName("chat-member")[0].innerHTML=loginStr;
      if(arr.length==0){location.reload();}
    });
    //--------------------名字已经存在
    socket.on("system-nickname",function(){
      alert("名字已经存在");
    });
    //------------------------发送消息  
    sendMsg.onclick=function(){
      if(Msg.value===""){alert("消息不能为空");return;}
      socket.emit("sendMsg",Msg.value);
      var p=document.createElement("p");
      p.className="self";
      Msg.value=safeHtml(Msg.value);
      p.innerHTML="<span>"+Msg.value+"</span>:"+name;
      chatContent.appendChild(p);
      Msg.value="";
      chatContent.scrollTop=chatContent.scrollHeight;
    }
    socket.on("Msg",function(data,nickname){
      var p=document.createElement("p");
      p.className="other";
      p.innerHTML=nickname+":<span>"+data+"</span>"
      chatContent.appendChild(p);
      chatContent.scrollTop=chatContent.scrollHeight;
    });
    socket.on("audio",function(leftChannel,rightChannel){
      var L=[],R=[];
      for(var f32a of leftChannel){
        var temLarray=new Float32Array(4096);
        for(var k in f32a){
          temLarray[k]=f32a[k];
        }
        L.push(temLarray);
      }
      for(var f32a of rightChannel){
        var temLarray=new Float32Array(4096);
        for(var k in f32a){
          temLarray[k]=f32a[k];
        }
        R.push(temLarray);
      }
      createaudio("other",L,R);
    })
    //--------------------两个回车事件提高用户体验
    document.onkeydown=function(e){
      e=e||event;
      if(document.activeElement.id=="Msg"&&e.keyCode==13){
        sendMsg.click();
      }
    }
    function safeHtml(html){
        html= html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return html;
    }
//这里开始就是视频聊天的
navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;
//获取摄像头权限
function getMedia(v,a,answer){
  var constraints={video:v,audio:a};
    function success(stream){
      videoContain.style.display="block";
      localStream=stream;
      if(answer){
        createpc(initiator);
        socket.emit("media");
      }else{
        socket.emit("video",id);
      }
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
  getMedia(true,false.false);
  var inputradio=document.getElementsByClassName("socketId");
  for(var i of inputradio){
    if(i.checked){
      id=i.getAttribute("socketid");
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
  initiator=id;
  if(confirm(name+"请求与您视频")){
  getMedia(true,false,true);
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
disconnect.onclick=function(){
  pc.close();
  pc=null;
  videoContain.style.display="none";
}
//这里开始是语音聊天
audiodisconnect.onclick=function (){
  streamNode.disconnect();
  createaudio("self",left,right);
  socket.emit("audio",left,right);
  audiodisconnect.style.display="none";
}
//
  audioC.onclick=function(){
    function save(stream){
      audiodisconnect.style.display="inline-block";
        console.log(1);
      sampleRate=context.sampleRate;
      streamNode=context.createMediaStreamSource(stream);
      var recorder=context.createScriptProcessor(4096,2,2);
      recorder.onaudioprocess=function(audioStream){
        left.push(audioStream.inputBuffer.getChannelData(0));
        right.push(audioStream.inputBuffer.getChannelData(1));
        recordingLength+=4096;
      }
      streamNode.connect(recorder);
    }
    navigator.getUserMedia({audio:true},save,function(){alert("不支持")});
  }
};
function createaudio(className,leftChannel,rightChannel){
  var flag=0;
  var btn=document.createElement("button");
  btn.innerHTML="语音播放"
  var p=document.createElement("p");
  p.className=className;
  p.appendChild(btn);
  play=context.createScriptProcessor(4096,2,2);
  play.onaudioprocess=function(stream){
    var audioL=leftChannel[flag++],audioR=rightChannel[flag++];
    if(!audioL) return play.disconnect(),flag=0;
    var Lbuffer=stream.outputBuffer.getChannelData(0);
    var Rbuffer=stream.outputBuffer.getChannelData(1);
    for(var i=0;i<audioL.length;i++){
      Lbuffer[i]=audioL[i];
      Rbuffer[i]=audioR[i];
    }
  }
  btn.onclick=function(){
    play.connect(context.destination);
  }
  chatContent.appendChild(p);
}