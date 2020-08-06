const mongoose = require('mongoose');
const User= require('./user');
const deleteSchema = new mongoose.Schema({
    idroom: {type: String},
    iduser: { type: String},
    deletemsg: { type: Array, default: []},
    deleteallmsg: { type: Number, default: + new Date().getTime()},
    created: { type: Number}
});

const deleteModel = mongoose.model('delete', deleteSchema);

class Delete extends deleteModel {

    static async createDelete(idroom, iduser) {
        const dlt= await new Delete({idroom, iduser, created: new Date().getTime() });
        await dlt.save();
        return dlt;
    }

    static async deleteAmsg(idroom, iduser, idmsg) {
        await Delete.findByIdAndUpdate({ idroom, iduser}, { $push: { deletemsg: idmsg} });
        return true;
    }

    static async deleteAllmsg(idroom, iduser, time) {
        await Delete.findByIdAndUpdate({ idroom, iduser}, { deleteallmsg: +time });
        return true;
    }

}

module.exports= Delete;