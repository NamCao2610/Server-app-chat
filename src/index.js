const app = require('express')();
const express= require('express');
const http = require('http').createServer(app);
const userRoute = require('./controller/user');
const notifiRoute= require('./controller/notification')
const User= require('./models/user');
const Notifica= require('./models/notifica');
const Accept= require('./models/accept');
const ListMsg= require('./models/listmsg');
const Room= require('./models/room');
const NickName= require('./models/nickname');
const Delete= require('./models/deletemsg');
const path = require('path');
const PORT = process.env.PORT || 3000;

const  mongoose = require('mongoose');
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS");
    // res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, application/json, Content-Type, Accept");
    next();
});

app.use(express.static(__dirname + '/views'));
app.use(express.static(path.join(__dirname + '/views')));

const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+ '/views/index.html'));
});



app.use('/uploads', express.static('uploads'));
app.use("/user", userRoute );
app.use("/notifi", notifiRoute);


io.on('connection', socket => {


    let rom="123";
    console.log('a user connected');
    socket.on("Client-send-room", data =>{
        socket.join(data);
        io.sockets.in(data).emit("Server-send-chat", data);
    });
    socket.on("Client-send-room2", room => {
        rom= room;
    });
    socket.emit("test-thu", "vidfjgdf");
    socket.on("Client-send-msg", msg => {
        // io.sockets.in(rom).emit("Server-send-msg", msg);
        socket.broadcast.in(rom).emit("Server-send-msg", msg)
    });
    
    //idsend: this._services.user._id, urlImg: this._services.user.urlImg, name: this._services.user.name ,_idto

    socket.on('Connect', data => {
        socket.emit('Reload-dd', 'vv')
    }) 

    

    socket.on('Client-send-addFriend',async friend => {
        // socket.broadcast.in(friend._idto).emit('Server-notifiAddFr', );
        const x= await User.checkWait(friend._idto, friend._idsend);
        if(x) return; // k bh xay ra

        const msg= friend.name+ '...da goi cho bn loi moi ket ban :)';
        const noti= await Notifica.createNoti(friend._idsend, msg, friend.urlImg, friend._idto  , friend.name, 'none');
        io.sockets.in(friend._idto).emit('Server-notifiAddFr', noti);
        const accept= await Accept.createAccept(friend._idsend, friend._idto);
        await User.addWaitAccept(friend._idsend, friend._idto);  
        await User.addNotifica(friend._idto, noti._id );
        await User.addfriendAccept(friend._idto, accept._id);
        const obj= { _id: accept._id, idsend: accept.idsend, idto: accept.idto, created: accept.created, name: noti.name, urlImg: noti.urlImg};
        io.sockets.in(friend._idto).emit('Server-waitAddFriends', obj);

        io.sockets.in(friend._idsend).emit('Server-send-idsend-dontload', friend._idto);
    });

    socket.on('Client-send-backupAdd', async backup => { 
        const user= await User.deleteWaitAccept(backup.idsend, backup.idto);
        if(!user) {
            io.sockets.in(backup.idsend).emit('Server-send-ReloadUser', backup.idto);
            return;
        }
        const accept= await Accept.deleteAccept(backup.idsend, backup.idto);
        if(!accept) {
            io.sockets.in(backup.idsend).emit('Server-send-ReloadUser', backup.idto);
            return;
        }
        socket.broadcast.in(backup.idto).emit('Backup-addfriend', accept._id); 
        await User.deleteFriendAccept(accept.idto, accept._id);
        io.sockets.in(backup.idsend).emit('Server-send-idsend-dontload', backup.idto);
    })

    socket.on('Client-accepAdd',async room => {
        const msg= room.nameaccep + ' da chap nhan loi moi ket ban cua ban';
        const noti= await Notifica.createNoti(room._idaccep, msg, room.urlImg, room._idfd, room.nameaccep, 'ban be');
        socket.broadcast.in(room._idfd).emit('Server-notifiAddFr', noti);
        User.addNotifica(room._idfd, noti._id);
        const x= await User.acceptFriends(room);
        if(!x) {
            console.log('vao return')
            return;
        }


        const objfd1= { idfd: room._idaccep, nameroom: room.name };
        const objfd2= { idfd: room._idfd, nameroom: room.name};
        io.sockets.in(room._idfd).emit('Server-addFriend', objfd1);
        io.sockets.in(room._idaccep).emit('Server-addFriend', objfd2);
        
            // io.sockets.in(room._idfd).emit('Server-send-ReloadUser', room._idaccep);
            // io.sockets.in(room._idaccep).emit('Server-send-ReloadUser', room._idfd); 

        const amsg= `${room.namefriend} va ${room.nameaccep} ket noi voi nhau `
        const message= await ListMsg.createAmsg( room._idfd, false,  amsg, new Date().getTime(), room.name );
        // await User.gggg(room._idaccep, room._idfd, message._id)
        await User.addListmsg(room._idaccep, '1', message._id);
        await User.addListmsg(room._idfd, '1', message._id);
       const aroom= await Room.createRoom(room.name, 'nulls', 'blue', 'aroom', 'nulls');
       const nickname1= await NickName.createdNickName(room._idaccep, 'nulls', room.name);
       const nickname2= await NickName.createdNickName(room._idfd, 'nulls', room.name);
       const abo= { id: nickname1.iduser, name: room.nameaccep, nickname: nickname1.name, seen: new Date().getTime()-100  }
        let obj= {
            _id: message._id,
            idsend: room._idfd,
            // myid: room._idaccep,
            seen: false,
            msg: message.msg,
            created: message.created,
            roomname: room.name, 
            name: room.namefriend,
            urlImg: room.imgfd,
            
            nickname: nickname2.name,
            room: aroom.name,
            color: aroom.color,
            type: aroom.type,
            listNameUser: [ abo ]


        }
        io.sockets.in(room._idaccep).emit('Server-send-amsg', obj);
        let obj2= obj;
        obj2.idsend= room._idaccep;
        obj2.urlImg= room.urlImg;
        obj2.name= room.nameaccep;
        io.sockets.in(room._idfd).emit('Server-send-amsg', obj2);

        Delete.createDelete(room.name, room._idaccep);
        Delete.createDelete(room.name, room._idfd);
        // io.sockets.in(room._idfd).emit('Server-send-ReloadUser', room._idaccep);
        // io.sockets.in(room._idaccep).emit('Server-send-ReloadUser', room._idfd); 
                    
        })
        
    socket.on('Client-send-messages', async message => {
        const times= message.created;
        let obj= message;
        console.log(message.created)
        obj.created= +new Date().getTime();
        socket.broadcast.in(message.roomname).emit('Server-send-message', obj);
        const idolds= await ListMsg.findOne( {roomname: message.roomname}, { _id: 1}).sort( { created: -1});
        const amsg= await ListMsg.createAmsg(message.idsend, message.seen, message.msg, obj.created, message.roomname);
        if(!amsg) return;
        let idold= '1'
        if(idolds) idold= idolds._id;

        let obj2= message;
        obj2._id= amsg._id;
        obj2.created= amsg.created;

        io.sockets.in(message.roomname).emit('Server-send-amsg',  obj2 );

       await  User.addListmsg(message.idsend, idold, amsg._id);
        // User.addListmsg(room._idfd, idold, amsg._id);
        const aobj = { _id: amsg._id, creatednew: obj.created, createdold: times, idsend: message.idsend };
        io.sockets.in(message.roomname).emit('Server-send-updateTime', aobj);

        const listid= await User.find( { room: message.roomname}, { _id: 1});
        await listid.forEach(async list => {
            if(list._id ==  message.idsend) return;
            await User.addListmsg(list._id, idold, amsg._id);
        })

        
    }) 


    socket.on('Client-join-room', data => { 
        socket.check = false;
        console.log(data)
        socket.idd = data.id;
        data.rooms.forEach(room => {
            socket.join(room)
        });
        data.rooms.forEach( room => {
            if(room == socket.idd) return;
            console.log("emit online");
            socket.broadcast.in(room).emit('Server-send-online',
             { urlImg: data.urlImg, isOffline : false ,time : Date.now().toString(), _id : data.id});
        })
    })
    
    // dang xuat 
    socket.on('log-out', data => { // k can gi ca
    
            socket.broadcast.in(socket.idd).emit('Server-check-user', false);
            setTimeout( () => {
                if(!socket.check) {
                    //emit offline
                    User.findById({_id : socket.idd}, { room: 1, urlImg: 1 }).exec()
                    .then( respone => {
                        respone.room.forEach( item => {
                            console.log('off line')
                            socket.broadcast.in(item).emit('Server-logout', 
                            { urlImg: respone.urlImg, isOffline : true ,time : Date.now().toString(), _id : socket.idd}
                            )
                        })
                    })
                }
             }, 10000) 
    })
    //

    socket.on('Client-check-user', data => {
        socket.check = data;
    })

    // loi thoat
    socket.on('disconnect', async reson => {
        socket.broadcast.in(socket.idd).emit('Server-check-user', false);
        console.log("vao")
        if(!socket.idd) return;
            // { isOffline : true ,time : Date.now().toString(), id : socket.idd});
         setTimeout( () => {
             console.log(socket.check)
            if(!socket.check) {
                //emit offline
                User.findByIdAndUpdate({_id : socket.idd}, {isOffline: true, timeOff : Date.now().toString()}, { room: 1, urlImg: 1 }).exec()
                .then( respone => {
                    respone.room.forEach( item => {
                        console.log('thoat ung dung')
                        socket.broadcast.in(item).emit('Server-logout', 
                        { urlImg: respone.urlImg, isOffline : true ,time : Date.now().toString(), _id : socket.idd}
                        )
                    })
                }).catch( err => console.log('loi', err.message))
            }
         }, 1000)
    });

    socket.on('Client-send-leave', data =>{
        // socket.broadcast.in(data).emit('Client-send-out-room');
        socket.leave(data);
    });

    socket.on('Client-send-dismiss-room', data => {
        socket.broadcast.in(data.iduser).emit('Server-send-dismiss-room', data)
    })

    socket.on('Client-send-miss-room', data =>{
        socket.broadcast.in(data.iduser).emit('Server-send-miss-room', data);
    })

    socket.on('Client-send-hide-room', data => {
        socket.broadcast.in(data.iduser).emit('Server-send-hide-room', data)
    });

    socket.on('Client-send-show-room', data => {
        socket.broadcast.in(data.iduser).emit('Server-send-show-room', data);
    })

    socket.on('Client-send-deleteAllmsg', data => {
        socket.broadcast.in(data.iduser).emit('Server-send-deleteAllmsg',data);
    })

    socket.on('Client-send-deleteAllmsg-inRoom', data => {
        io.sockets.in(data.iduser).emit('Server-send-deleteAllmsg-inRoom', data);
    })

    socket.on('Client-send-seen-msg',async  data => {
        io.sockets.in(data.idroom).emit('Server-send-seen-msg', data);
        socket.in(data.idroom).emit('chi-toi', data);
       // await NickName.findOneAndUpdate({iduser: data.iduser, nameroom: data.idroom}, { seen: data.time });
         NickName.upp(data.iduser, data.idroom, data.time)

    })

    socket.on('Server-send-updatemsg-delete', data => {
        io.sockets.in(data.iduser).emit('Client-send-updatemsg-delete', data )
    })

    socket.on('Client-send-createdGroup', data => {
        // socket.broadcast.in(data.idsend).emit('Server-send-createdGroup', data);
        io.sockets.in(data.idsend).emit('Server-send-createdGroup', data);
    });

    socket.on('Client-send-blocked-room', data => {
        socket.broadcast.in(data.iduser).emit('Server-send-blocked-room', data);
        io.sockets.in(data.idroom).emit('Server-send-blocked-room-alluser', data)
        
    });

    socket.on('Client-send-unblock-room', data => {
        io.sockets.in(data.iduser).emit('Server-send-unblock-room', data);
        io.sockets.in(data.idroom).emit('Server-send-unblock-room-alluser', data);
    });

    socket.on('Client-send-addMember', data => {
        io.sockets.in(data.roomname).emit('Server-send-addMember', data)
    })

    socket.on('Client-addMember-joinsocket', data => {
        io.sockets.in(data.iduser).emit('Server-send-join-room', data);
    });

    socket.on('Client-send-change-nickName', data => {
        io.sockets.in(data.idroom).emit('Server-send-change-nickName', data)
    });

    socket.on('Client-send-leave-room', data => {
        io.sockets.in(data.iduser).emit('Server-send-leave-room', data);
    });

    socket.on("tangdiem", data => {
        console.log("day la idem", data);
    })

  });

//   const httpsServer = https.createServer(credentials, app);

 const uri = 'mongodb://localhost/deappchatcham7';
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect( uri, { useNewUrlParser: true,  useUnifiedTopology: true });
mongoose.connection.once('open', ()=>{
    http.listen( PORT , () => console.log('Server is started'));
});


