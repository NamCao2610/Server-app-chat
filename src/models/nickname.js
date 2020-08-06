const mongoose = require('mongoose');
const User= require('./user');
const Room= require('./room');
const Msg= require('./listmsg');
const Delete= require('./deletemsg');
const nickNameSchema = new mongoose.Schema({
    iduser: { type: String},
    name: { type: String},
    nameroom: { type: String},
    seen: { type: Number},
    created: { type: Number}
});

const nickNameModel = mongoose.model('nickname', nickNameSchema);

class NickName extends nickNameModel {

    static async createdNickName(iduser, name, nameroom) {
        const nickname= await new NickName({iduser, name, nameroom, seen: + new Date().getTime(), created: new Date().getTime() })
        await nickname.save();
        return nickname;
    }

    static async upp(iduser, nameroom, seen) {
        const x= await NickName.findOneAndUpdate({iduser, nameroom}, { seen: +seen})
        return x;
    }

    static async chaneNickName(iduser, nameroom, name) {
        await NickName.findOneAndUpdate({iduser, nameroom}, {name});
        return  true;
    }

    static async addMember(iduser, idroom, idadd, usernameadd, username) {
        await NickName.createdNickName(iduser, 'nulls', idroom);
        const msg= await Msg.createAmsg(idadd, false, `${usernameadd} da them ${username} `, new Date().getTime(), idroom );
        const dlt= await Delete.createDelete(idroom, iduser);
        return {
            _id: msg._id,
            seen: msg.seen,
            msg: msg.msg,
            created: msg.created,
            roomname: msg.roomname,
          
            idsend: msg.idsend,
            urlImg:  'chua co',//user.urlImg,
            name: usernameadd,//user.name,
          
            room: 'chua co',
            color: 'chua co',
            type: 'chua co', // loai roomS
          
            nickname: 'nulls', // name ben nickname
          
            listNameUser: [{id: iduser, name: username, seen: dlt.deleteallmsg }]
        }
    }
  //  1581685949190.jpeg
    static async createGroup(namegroup, iduser, idroom, username) {
        const room= await Room.createRoom(idroom, namegroup, 'blue', 'group', 'http://vuongdeptrai.herokuapp.com/uploads/group-chat.png' );
        console.log(room)
        await NickName.createdNickName(iduser, 'nulls', idroom);
        const msg= await Msg.createAmsg(iduser, false, `${username} da tao nhom`, new Date().getTime(), idroom );
        console.log(msg)
        await Delete.createDelete(idroom, iduser)
        return {
            _id: msg._id,
            seen: msg.seen,
            msg: msg.msg,
            created: msg.created,
            roomname: msg.roomname,
          
            idsend: msg.idsend,
            urlImg:  room.urlImg,//user.urlImg,
            name:  username,//user.name,
          
            room: room.name,
            color: room.color,
            type: room.type, // loai room
          
            nickname: 'nulls', // name ben nickname
          
            listNameUser: []
        }
    }

    

}

module.exports= NickName;