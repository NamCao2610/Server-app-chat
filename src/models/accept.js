const mongoose = require('mongoose');
const AcceptSchema = new mongoose.Schema({
    idsend: { type: String},
    idto: { type: String},
    created: { type: Number}
});

const AcceptModel = mongoose.model('accept', AcceptSchema);

class Accept extends AcceptModel {


    static async getListFriendAccept(iduser, skip) {
        const accept= await Accept.find( { idto : iduser }).sort({ created: -1}).skip(skip).limit(10);
        return accept;
    }



    static async deleteAccept(idsend, idto) {
        const accept= await Accept.findOneAndDelete({idsend, idto});
        return accept;
    }

    static async createAccept(idsend, idto) {
        const accept= await new Accept( { idsend, idto, created: Date.now().toString() });
        await accept.save();
        return accept;
    }

}

module.exports= Accept;