const mongoose = require('mongoose');
const User= require('./user');
const roomSchema = new mongoose.Schema({
    idroom: {type: String},
    name: { type: String},
    color: { type: String, default: 'blue'},
    type: { type: String},
    created: { type: Number},
    urlImg: { type: String},
    countBlock: { type: Number, default: 0}
});

const roomModel = mongoose.model('room', roomSchema);

class Room extends roomModel {


    static async createRoom(idroom, name, color, type, urlImg) {
        const room= await new Room({ idroom, name, color, type, created: new Date().getTime(), urlImg });
        await room.save();
        return room;
    }

}

module.exports= Room;