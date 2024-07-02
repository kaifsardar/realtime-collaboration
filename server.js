const express=require('express');
const path=require('path')
const {Server}=require('socket.io')
const http=require('http');
const app=express();
const server=http.createServer(app);
// {
//     cors: {
//         origin: "http://localhost:3000"
//       }
// }
const io=new Server(server);

app.use(express.static('build'))
app.use((req,res,next)=>{
    res.sendFile(path.join(__dirname,'build','index.html'));
})

function getAllClients(roomId){
    return Array.from(io.sockets.adapter.rooms.get(roomId)||[]).map((socketId)=>{
        return {
            socketId,
            userName:userSocketMap[socketId],
        }
    });
}

const userSocketMap={};

io.on('connection',(socket)=>{
    socket.on('join',({roomId,userName})=>{
        userSocketMap[socket.id]=userName;
        socket.join(roomId);
        const clients=getAllClients(roomId);
        clients.forEach(({socketId})=>{
            io.to(socketId).emit('joined',{
                clients,
                userName,
                sockekId:socket.id,
            });
        });
    });

    socket.on('code-change',({roomId,code})=>{
        socket.in(roomId).emit('code-change',{code});
    });
    
    socket.on('disconnecting',()=>{
        const rooms=Array.from(socket.rooms);
        rooms.forEach((roomId)=>{
            socket.in(roomId).emit('disconnected',{
                socketId:socket.id,
                userName:userSocketMap[socket.id],
            })
        })

        delete userSocketMap[socket.id];
        socket.leave();
    })
})


const PORT=process.env.PORT||9000;
server.listen(PORT,()=>{console.log('Running on '+PORT)})
