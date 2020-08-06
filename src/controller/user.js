const userRoute = require('express').Router();
const User = require('../models/user');
const bodyparser = require('body-parser');
const multer = require("multer");
const Accept= require('../models/accept');
const NickName= require('../models/nickname');
const Msg= require('../models/listmsg');
const jwt= require('jsonwebtoken');

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads/');
    },
    filename: function(req, file, cb){ 
        const filename= new Date().getTime() + '.jpeg'
        cb(null,filename) // new Date().toISOString()+
    }
});

const fileFilter = (req, file, cb)=>{
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ){
        cb(null, true);
    }else{
        cb(null, false);
    }
}

const upload = multer({storage : storage,  
    limits:{
        fileSize: 1024 * 1024 * 5
    }, 
    fileFilter: fileFilter
});



userRoute.use(bodyparser.urlencoded({ extended: false}));
userRoute.use(bodyparser.json());

userRoute.get('/', (req, res) => {    
    User.find()
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
});


userRoute.get('/verify/:id/:code', async (req, res) => {
    const { id, code } = req.params;
    await User.findOneAndUpdate({_id: id, codeSignUp: code}, { active : true}).exec()
    .then( respone => {
        if(!respone) {
            res.json("Xác thực của bạn đã sai");
            return; 
        }
        res.json("Đã xác thực thành công")
    })
    .catch( err => res.json("Lỗi"))
})

userRoute.post( '/getStatusUser', (req, res, next) => {
    const { id } = req.body;
    User.getStatusUser(id)
    .then( respone => res.json(respone))
    .catch( err => console.log(err.message))
})

userRoute.post('/update-user', async (req, res) => {
    const { id, name, userName}= req.body;
    const auser= await User.findOne({userName, _id: { $nin: id}});
    if(auser) { 
         throw new Error('Sdt da ton tai');
       
    }
    await User.findOneAndUpdate({ _id: id }, {name, userName},{name: 1, userName: 1})
    .then( user => {
        const token= jwt.sign({userName: user.userName, passWord: user.passWord}, 'chuot');    
        res.send({user, token });
    })
    .catch(err =>  res.status(400).send(err))
    
    
})

userRoute.post('/add-member', (req, res) => {
    const { idroom, iduser, idadd, usernameadd, username }= req.body;
    NickName.addMember(iduser, idroom, idadd, usernameadd, username)
    .then( async response =>{
        const Users= await NickName.find({nameroom: idroom});
        let arrUser= [];
        Users.forEach(async docs => {
            arrUser.push(docs.iduser);
        });

        arrUser.forEach( async docs => {
            const listmsg= await User.findOne({_id: docs}, { msg: 1});
            const msgold= await Msg.findOne({ _id: { $in: listmsg.msg }, roomname: idroom });
            if(!msgold) {
                await User.findOneAndUpdate({_id: docs}, { $push: { msg: response._id}});
                return;
            }
            await User.addListmsg(docs, msgold._id, response._id);
        })
        

         await User.findOneAndUpdate({_id: iduser}, {  $push: { room: idroom }   });
        res.send(response)})
    .catch(error =>{
        console.log(error.message)
         res.status(400).send( error.message )})
});

userRoute.post('/leave-room', (req, res) => {
    const { iduser, idroom }= req.body;
    User.leaveRoom(iduser, idroom)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message );
    })
})

userRoute.post('/change-nickname', (req, res) => {
    const { iduser, idroom, nickname }= req.body;
    NickName.chaneNickName(iduser, idroom, nickname)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message );
    })
})

userRoute.post('/seach-member', (req, res) => {
    const { contentSeach, iduser, skip }= req.body;
    User.seachUserInListFriends(contentSeach, iduser, skip)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
})

userRoute.post('/create-group', (req, res) => {
    const { namegroup, iduser, idroom, username }= req.body;
    NickName.createGroup(namegroup, iduser, idroom, username)
    .then(async response =>{
         await User.findOneAndUpdate({_id: iduser}, {  $push: { room: idroom, msg: response._id }   });
        res.send(response)
    })
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message )})

});

userRoute.post('/unblock-room', (req, res) => {
    const { iduser, idroom }= req.body;
    User.unBlockRoom(iduser, idroom)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message )})
});

userRoute.post('/block-room', (req, res) => {
    const { iduser, idroom }= req.body;
    User.blockRoom(iduser, idroom)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message )})
});

userRoute.post('/delete-amsg', (req, res) => {
    const { idroom, iduser, idmsg }= req.body;
    User.deleteMessageinroom(idroom, iduser, idmsg)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message )})
})

userRoute.post('/delete-allmsg', (req, res) => {
    const { idroom, iduser, time, idmsg }= req.body;
    User.deleteAllMessageinRoom(idroom, iduser, time, idmsg)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
})

userRoute.post('/dismiss-room', (req, res) => {
    const {  iduser, idroom }= req.body;
    User.dismissNortifications(iduser, idroom)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
})

userRoute.post('/miss-room', (req, res) => {
    const { iduser, idroom }= req.body;
    User.missNotifications(iduser, idroom)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
})

userRoute.post('/show-room', (req, res) => {
    const { iduser, idmsg }= req.body;
    User.showRooms(iduser, idmsg)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
});

userRoute.post('/hide-room', (req, res) => {
    const { iduser, idmsg }= req.body;
    User.hideRooms(iduser, idmsg)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
});

userRoute.post('/show-room', (req, res) => {
    const { iduser, idmsg }= req.body;
    User.showRooms(iduser, idmsg)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
})


userRoute.post('/get-messagess', (req, res) => {
    const { roomname, skip, iduser}= req.body;
    User.getMessageinRoom(roomname, skip, iduser)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message )})
})

userRoute.post('/getlistmsg', (req, res) => {
    const { arrMsg, skip, myid}= req.body;
    User.getListMsg(arrMsg, skip, myid)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message )})
})

userRoute.post('/getlistmsg-group', (req, res) => {
    const { arrMsg, skip, myid}= req.body;
    User.getListMsgGroup(arrMsg, skip, myid)
    .then(response => res.send(response))
    .catch(error => {
        console.log(error.message)
        res.status(400).send( error.message )})
})

userRoute.post('/getlistuser', (req, res) => {
    const {listUser}= req.body;
    User.getListUser(listUser)
    .then(response => res.send(response))
    .catch(error => res.status(400).send( error.message ))
})


userRoute.post('/getaccept', (req, res) => {
    const { iduser, skip} = req.body;
    Accept.getListFriendAccept(iduser, skip)
    .then(response => {

        res.send(response)})
    .catch(error =>{
        console.log('loi roi')
        console.log(error.message)
         res.status(400).send( error.message )})

})

userRoute.post("/getuser", (req, res) => {
    const { _id}= req.body;
    User.findUser(_id)
    .then( respone => res.send(respone))
    .catch( err => res.status(400).send(err.message))

})

userRoute.post("/addRoom", (req, res) => {
    const { _id, room }= req.body;
    User.addRoomm(_id, room)
    .then( respone => res.send(respone))
    .catch( err => res.status(400).send(err.message))
})


userRoute.post("/users", (req, res) => {
    const { userName, time }= req.body;
    User.findUserName(userName, time)
    .then( respone => res.send(respone))
    .catch( err => {
        res.status(400).send(err.message);
    });
});



userRoute.post("/vuong", upload.single('file'),(req,res,next)=>{
    console.log(req.file);
    res.send({ fileName:   `http://vuongdeptrai.herokuapp.com/uploads/${req.file.filename }`  });
});

userRoute.post("/updateImg", (req, res, next) => {
    const {_id, urlImg } = req.body;
    User.updateImg(_id, urlImg)
    .then( respone => {
      
        res.send(respone);
       
    })
    .catch( err => {
        console.log("loi eroi" + err)
        res.status(400).send(err)});
});

function middleWare(req, res, next){
    const {authorization}= req.headers;
    console.log('day la', authorization)
    if(!authorization) next({})
    jwt.verify(authorization, 'chuot', async (err, respone) => {
        if(err) {
            console.log('loi'+ err.message);
            next({})
            return;
        }
        console.log(respone)
        const auser= await User.findOne({userName: respone.userName, passWord: respone.passWord});
        if(!auser){
            console.log('da vao sai')
            next({})
        
            return;
        }
        res.local.user= auser;
        next();
        
    })

}

userRoute.post('/get-user', async (req, res) => {
    const {authorization}= req.headers;
    if(!authorization) next({})
    jwt.verify(authorization, 'chuot',async (err, respone) => {
       const auser= await User.findOne({userName: respone.userName, passWord: respone.passWord});
       res.send(auser)
    })
})

userRoute.post("/signUp", (req, res) => {
    const { userName, passWord, name } = req.body;
    User.signUp(userName, passWord, name)
    .then( response => res.send(response))
    .catch( err => {throw err});
});

userRoute.post("/signIn", async (req, res) => {  
    const { userName, passWord } = req.body;
    User.signIn( userName, passWord)
    .then( response => {
        console.log(response)
       const token= jwt.sign({ userName, passWord }, 'chuot')
        res.send({user: response.user, token, data: response.data, status: response.status})
    })
    .catch( err =>{ 
        console.log(err.message)
       throw err;
    }); 
});

module.exports = userRoute;