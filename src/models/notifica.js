const mongoose= require('mongoose');

const NotificaSchema= new mongoose.Schema({
    _idsend: { type: String},
    _idto: { type: String},
    msg: { type: String},
    urlImg: { type: String},
    created: { type: Number},
    server: { type: Boolean, default: false},
    status: { type: String, default: 'none'},
    name: { type: String}
})

const NotificaModel = mongoose.model('notifica', NotificaSchema);

class Notifica extends NotificaModel {

    static async createNoti(_idsend, msg, urlImg, _idto, name, status) {
        const notifica= await new Notifica({_idsend, msg, urlImg, _idto, created: Date.now().toString(), name, status});
        await notifica.save()
        return notifica;
    }

    static async getListNoti(iduser, skip) {
        const notifica = await Notifica.find( { _idto : iduser}).sort({ created: -1}).skip(skip).limit(10);
        return notifica;
    }

    static async updateFriends(_idto, status) {
        const noti= await Notifica.findOneAndUpdate({_id}, { status});   
        return noti;
    }


};


module.exports = Notifica;