const mongoose = require('mongoose');
const Accept= require('./accept');
const Msg= require('./listmsg'); 
const Room= require('./room');
const NickName= require('./nickname');
const Delete= require('./deletemsg');
const nodemailer = require('../mailer/index');
const ramdomstring = require('randomstring');

const UserSchema = new mongoose.Schema({ 
    name: { type: String},
    userName: { type: String, trim: true}, 
    passWord: { type: String, trim: true},
    friends: { type: Array, default: [],  required: true},
    active: { type: Boolean, default: false,  required: true},
    room: { type: Array, default: [],  required: true},
    urlImg: { type: String, default: 'http://vuongdeptrai.herokuapp.com/uploads/1581676532371.jpeg' },
    created: { type: Number,  required: true},
    notification: { type: Array, default: [],  required: true },
    waitaccept: { type: Array, default: [], required: true }, // loi moi ket ban da goi
    friendaccepts: { type: Array, default: [],  required: true }, // loi moi ket ban hien co
    msg: { type: Array, default: [], required: true},

    hidemsg: { type: Array, default: [], required: true },// an tin nhan o room
    dismissroom: { type: Array, default: [], required: true},// tat thong bao 
    block: { type: Array, default: [], required: true },
    isOffline : Boolean,
    timeOff : Number,
    codeSignUp : String
});

const UserModel = mongoose.model('user', UserSchema);

class User extends UserModel {

    static async findOrCreate(idFb, name) {
       const respone = await User.findOne({idFb});
       if(!respone) {
           console.log(respone);
           console.log("respone")
        const auser = await new User({idFb, name, created: Date.now().toString(), isOffline: false, timeOff: Date.now().toString()});
        await auser.save()
        .then(async user => {
            await User.findOneAndUpdate( { _id: user._id }, { room: user._id })
        });

       }
       const userss = await User.findOne({idFb});
       return userss;
    }

    static async getStatusUser(iduser) {
        const auser = await User.findById({_id : iduser});
        const listStaus = await User.find({_id : { $in: auser.friends } }, { _id: 1, urlImg: 1, name: 1, isOffline: 1, timeOff: 1});
        return listStaus;
    }
    
    static async leaveRoom(iduser, idroom) {
        const auser= await User.findOneAndUpdate({_id: iduser}, { $pull: {room: idroom}});
        const amsg= await Msg.findOne({_id: { $in: auser.msg}, roomname: idroom});
        if(amsg) {
            await User.findOneAndUpdate({_id: iduser}, { $pull:{ msg: amsg._id}});
        }
        return true;
    }

    static async seachUserInListFriends(seach, iduser, skip) {
      const auser = await User.findOne({_id : iduser});
      let listFriends = [];
    
        auser.friends.forEach( item => {
            listFriends.push(item)
        })
      const users= await User.find({_id: { $in: listFriends}, $or: [ {name: seach}, {userName: seach} ] }, { _id: 1, name: 1, urlImg: 1, userName: 1}).skip(skip);
      return users;
    }

    static async unBlockRoom(iduser, idroom) {
        await User.findOneAndUpdate({ _id: iduser}, { $push: { room: idroom}, $pull: { block: idroom} });
        const count= await Room.findOne({idroom});
        await Room.findOneAndUpdate({idroom}, { countBlock: +count.countBlock- 1});
        return true;
    }

    static async blockRoom(iduser, idroom) {
        await User.findOneAndUpdate({ _id: iduser}, { $pull: {room: idroom}, $push: { block: idroom}  });
        const count= await Room.findOne({idroom});
        await Room.findOneAndUpdate({idroom}, { countBlock: +count.countBlock+ 1});
    }

    static async deleteMessageinroom(idroom, iduser, idmsg) {
       // await Delete.findOneAndUpdate({idroom, iduser}, { $push: {deletemsg: idmsg} })
        /// cach  2
   
        const amsg= await Msg.findOne({roomname: idroom, _id: idmsg});

        await Delete.findOneAndUpdate({idroom, iduser}, { $push: {deletemsg:  amsg._id } });
 
        const user= await User.findOne({ _id: iduser });
        const index= user.msg.findIndex( id => {
            return id== idmsg;
        });

        if(index == -1) return { index: 1, message: {} }

        const dlt2= await Delete.findOne({idroom, iduser});
      
        const arrr= dlt2.deletemsg;
        let arrmsg= [];
        const amsg2= await Msg.findOne({roomname: idroom, _id: { $nin: arrr }, created: { $gt: +dlt2.deleteallmsg}   }).sort({ created: -1})
        if(!amsg2) { 
             arrmsg= user.msg
             arrmsg.splice(index, 1);
            await User.findOneAndUpdate({ _id: iduser }, { msg: arrmsg} );
            return { index: 2, message: {} }
         }
         arrmsg= user.msg;
         arrmsg.splice(index, 1, amsg2._id);
         await User.findOneAndUpdate({ _id: iduser }, { msg: arrmsg} );
         await User.findOne({_id: iduser});
         return { index: 3, message: amsg2}

    }

    static async deleteAllMessageinRoom(idroom, iduser, time, idmsg) {
        
        await Delete.findOneAndUpdate({ idroom, iduser}, { deleteallmsg: +time});
        const amsg=  await Msg.findOne({roomname: idroom}, { _id: 1}).sort({ created: -1});
        // console.log(idmsg)
        // console.log(  amsg._id)
        // const idd= idmsg+ '';
        // const listmsg= await User.findOne({_id: iduser});
        // if(listmsg.msg.length == 0) {
        //     await User.findOneAndUpdate( {_id: iduser}, { msg: [] });
        //     return true;
        // }
        await User.findOneAndUpdate({ _id: iduser}, { $pull: { msg : amsg._id} });//
        // { $push: {friends: friend  } }
        // console.log(x.msg);

        return true;
    }

    static async dismissNortifications(_id, idroom) {// them vao dissmiss
        await User.findOneAndUpdate({_id}, { $pull: { dismissroom: idroom } });
        await User.findOneAndUpdate({_id}, { $push: { dismissroom: idroom} });
        return true;
    }

    static async missNotifications(_id, idroom) {// xoakhoi dissmiss
        await User.findOneAndUpdate({_id}, { $pull: {dismissroom: idroom } });
        return true;
    };

    static async showRooms(_id, idmsg) {
        await User.findOneAndUpdate({_id}, { $pull: { hidemsg: idmsg} });
        return true;
    }

    static async hideRooms(_id, idmsg) {// an tin nhan
        await User.findOneAndUpdate({_id}, { $pull: { hidemsg: idmsg} });
        await User.findByIdAndUpdate({_id}, { $push: { hidemsg: idmsg } })
        return true;
    }

    static async showRooms(_id, idmsg) {
        await User.findOneAndUpdate({_id}, { $pull: { hidemsg: idmsg} });
        return true;
    }



    static async gggg(id1, id2, id) {
        console.log(id1)
        const x= await User.findOneAndUpdate( { _id: id1}, { $push: { msg: id} });
        await User.findOneAndUpdate( { _id: id2}, { $push: { msg: id}});
        return 1;
    }


    static async addListmsg(_id, idmsgold, idmsgnew) {

        await User.findOneAndUpdate({_id}, { $pull: { msg: idmsgold} });
         await User.findOneAndUpdate({_id}, { $push: { msg: idmsgnew} })
       
    }


    static async getMessageinRoom(roomname, skip, iduser) {
    
        const dlt= await Delete.findOne({idroom: roomname, iduser})
        // const listMsg= await Msg.find( {roomname}).sort({ created: -1}).skip(skip).limit(10);
        console.log('mot');
        let arr= [];
        dlt.deletemsg.forEach( docs => {
            arr.push(docs);
        })
        console.log(arr.toString())
        const aarr= dlt.deletemsg;
        console.log(aarr)
        const listMsg= await Msg.find( {roomname, _id : { $nin: dlt.deletemsg }, created: { $gt: +dlt.deleteallmsg}   }).sort({ created: -1}).skip(skip).limit(10);
        console.log('hai')
        let listRoom= [];
        listMsg.forEach( msg => {
            listRoom.push(msg.roomname);
    })
        const nickname= await NickName.find({ nameroom:roomname});
        let listIdUser= [];
        nickname.forEach( docs => {
            listIdUser.push(docs.iduser);
        });
        //{room: {$in: listRoom }}, {block: { $in: listRoom}} 
        const user= await User.find({ _id: { $in: listIdUser}}, { _id:1, name: 1, urlImg: 1 });
        const room= await Room.findOne({ idroom: roomname  });
        // const nickname= await NickName.find({ nameroom:roomname});
        console.log(nickname)
        return {  user, listMsg, room, nickname}
    }

    static async getListMsg(arrMsg, skip, myid) {
  
       const auser= await User.findOne({_id: myid}, { msg: 1})
        const listMsg= await Msg.find( { _id: { $in: auser.msg} }, { __v: 0}).sort({ created: -1}).skip(skip).limit(10);
        
        let listRoom= [];
        listMsg.forEach( msg => {
                listRoom.push(msg.roomname);
        });
        const nickname= await NickName.find({ nameroom:{ $in: listRoom } });
        let listIdUser= [];
        nickname.forEach( docs => {
            listIdUser.push(docs.iduser);
        })

        const user= await User.find({ _id: {$in: listIdUser }}, { _id:1, name: 1, urlImg: 1 });
        const room= await Room.find({ idroom: { $in: listRoom }  });
 
        
        return {  user, listMsg, room, nickname}
        
    }

    static async getListMsgGroup(arrMsg, skip, myid) {
  
        const auser= await User.findOne({_id: myid}, { msg: 1})
         const listMsg= await Msg.find( { _id: { $in: auser.msg} }, { __v: 0}).sort({ created: -1}).skip(skip).limit(10);
         
         let listRoom= [];
         listMsg.forEach( msg => {
                 listRoom.push(msg.roomname);
         });
         const nickname= await NickName.find({ nameroom:{ $in: listRoom } });
         let listIdUser= [];
         nickname.forEach( docs => {
             listIdUser.push(docs.iduser);
         })
 
         const user= await User.find({ _id: {$in: listIdUser }}, { _id:1, name: 1, urlImg: 1 });
         const room= await Room.find({ idroom: { $in: listRoom }  });
  
         
         return {  user, listMsg, room, nickname}
         
     }

    static async findUser(_id) {
        const user= await User.findById({_id});
        return user;
    }

    static async checkWait(_id, idfriend) {
        const user= await User.findOne({_id});
        const index= user.waitaccept.findIndex( wait => {
            return wait== idfriend;
        });
        if(index== -1) return false;
        return true;
    }

    static async acceptFriends(room) {
        
        const accept= await Accept.deleteAccept(room._idfd, room._idaccep);
        
        if(!accept) throw new Error('loi1');
         await this.deleteFriendAccept(room._idaccep, accept._id)
        const user= await User.findOne({_id: room._idfd});

        const index= user.waitaccept.findIndex( wait => {
            return wait== room._idaccep
        });
        if(index== -1) throw new Error('loi2');
        await this.deleteWaitAccept(room._idfd, room._idaccep);

        await this.addFriedns( accept.idsend, accept.idto);
        await this.addRoomm(accept.idsend, room.name);
        await this.addFriedns(accept.idto, accept.idsend);
        await this.addRoomm(accept.idto, room.name);
        return 1;
    }

    static async addFriedns(_id, friend) {
        const user= await User.findOneAndUpdate( {_id}, { $push: {friends: friend  } });
        return user;
    }

    static async addRoomm(_id, rooms) {
        const user= await User.findOneAndUpdate( {_id}, { $push: {room: rooms  } });
        return user;
    }

    static async deleteFriendAccept(_id, friendaccept) {
        const user= await User.findOneAndUpdate( {_id}, { $pull: {friendaccepts: friendaccept} });
        return user;
    }

    static async deleteWaitAccept (_id, wait) {
 
        const user= await User.findOneAndUpdate( {_id}, { $pull: {waitaccept: wait} });
        return user;
    }

    static async addfriendAccept( _id, friendaccept) {

        const user= await User.findOneAndUpdate( {_id}, { $push: {friendaccepts: friendaccept} });
        return user;
    }

    static async addWaitAccept(_id, accept) {
   
        const user= await User.findOneAndUpdate( {_id}, { $push: {waitaccept: accept }});
        return user;
    }

    static async addNotifica(_id, notifica) {
        const x=await User.findOneAndUpdate({_id}, { $push: { notification: notifica }  });
        return x;
    }

    static async getListUser(listUser) {
        const users= await User.find({ _id: { $in: listUser}}, { name: 1, urlImg: 1, _id:1});
        return users;
    }

    static async findUserName(username, time) {
        const users= await User.find(  {$or: [ {userName:  username }, { name: username}]}).skip(time).limit(10);
        // const users= await User.find( { name: userName});
        if(users.length==0) throw new Error("Không tìm thấy sdt hoặc tên người dùng");                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
        return users;
    }

    static async updateImg(_id, urlImg) {
        const user= await User.findOneAndUpdate( {_id},{ urlImg});
        if( !user) {
            return {
                message : "Loi"
            }
        };
        return {
            message: "Thanh cong"
        }
    }

    static async signIn(userName, passWord) {
        const user = await User.findOneAndUpdate({ userName}, {isOffline: false, timeOff: Date.now().toString()})
        if(!user) return { status : 400, data : 'Email chưa được đăng ký'};
        if(!user.active) return { status : 400, data : 'Email chưa được xác thực'};
        if(user.passWord != passWord) return { status : 400, data : 'Sai mật khẩu'};
        return { status : 200, user, data: '' };
    };

    static async signUp(userName, passWord, name) {
        const code = await ramdomstring.generate();
        const auserr = await User.findOne({userName});
        if(auserr) return { status: 400, data : 'Taì khoản đã được đăng ký'} 

        const user = await new User({ userName, passWord, name, created: Date.now().toString(), isOffline: false, timeOff: Date.now().toString() });
        await user.save()
        .then(async user => {
         await User.findOneAndUpdate( { _id: user._id }, { room: user._id, codeSignUp : code });
        });
        await nodemailer.sendVerifyEmail(name, userName, `http://vuongdeptrai.herokuapp.com/user/verify/${user._id}/${code}`);
        return { status: 200, data: '' };
        
    };
};

module.exports = User;