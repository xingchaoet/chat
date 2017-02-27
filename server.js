var  http=require("http");
var fs=require("fs");
var path=require("path");
var io=require("socket.io");
var cache={};
var NICKNAME=[];
var sId=[];



//404
function send404(res) {
    res.writeHead(404,{"Content-Type":"text/plain"});
    res.write("resource not found");
    res.end();
}


//静态服务器
function staticServer(res,cache,filePath){
    if(cache[filePath]){
        res.end(cache[filePath]);
    }else{
        fs.exists(filePath,function(exists){
            if(exists){
                fs.readFile(filePath,function(err,data){
                    if(err){
                        send404(res);
                    }else{
                        res.end(data);
                        cache[filePath]=data;
                    }
                })
            }else{
                send404(res);
            }
        });
    }
}



//开启服务器
var server=http.createServer(function(req,res){
    var filePath="/";
    if(req.url=="/"){
        filePath="dist/index.html";
    }else{
        filePath="dist/"+req.url;
    }
    staticServer(res,cache,filePath);
});


io=io.listen(server);
server.listen(3333);

//监听事件
io.on("connection",function(socket){
    socket.on("login",function(data){//socket.broadcast和io.emit的顺序好像是不一样的！！！！！
        if(data==="") return;
        if(NICKNAME.indexOf(data)!==-1){
            socket.emit("system-nickname");
        }else{
            socket.index=NICKNAME.length;
            socket.nickname=data;
            sId.push(socket.id)
            NICKNAME.push(data);
            socket.emit("login");
            io.emit("system",NICKNAME,sId);
        }
    });
    socket.on("disconnect",function(){
        NICKNAME.splice(socket.index,1);
        sId.splice(socket.index,1);
        io.emit("system",NICKNAME,sId);
    });
    socket.on("sendMsg",function(data){
        data=safeHtml(data);
        socket.broadcast.emit("Msg",data,socket.nickname);
    });







    
    socket.on("video",function(socketid){
        if(socketid==socket.id){console.log(socketid);console.log(socket.id);return;}
        io.sockets.sockets[socketid].emit("ask",NICKNAME[socket.index],socket.id);
    });

    socket.on("session",function(sessionD,id){
        io.sockets.sockets[id].emit("session",sessionD);
    });

    socket.on("candidate",function(id,candidate){
        io.sockets.sockets[id].emit("candidate",candidate);
    });

    socket.on("media",function(){
        socket.broadcast.emit("contact")
    })
});
//定义一个控制消息的函数
function safeHtml(html){
    html= html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return html;
}