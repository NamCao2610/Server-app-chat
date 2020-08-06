const mongoose = require('mongoose');
const User= require('./user');
const listmsgSchema = new mongoose.Schema({
    seen: { type: String},
    msg: { type: String},
    created: { type: Number},
    roomname: { type: String},
    idsend: { type: String}
    
    //default: +(new Date().getTime()) 
});

const ListMsgModel = mongoose.model('listmsg', listmsgSchema);

class ListMsg extends ListMsgModel {
    

    static async createAmsg( idsend, seen, msg, created, roomname) {
        const amsg= await new ListMsg({ idsend, seen, msg, created, roomname });
        await amsg.save();
        return amsg;
    }

}

module.exports= ListMsg;