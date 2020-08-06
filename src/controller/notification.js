const notiRoute = require('express').Router();
const Notifica = require('../models/notifica');
const bodyparser = require('body-parser');
notiRoute.use(bodyparser.urlencoded({ extended: false}));
notiRoute.use(bodyparser.json());


notiRoute.get("/", (req, res) => {
    Notifica.find()
    .then(response => res.send(response))
    .catch(error => res.status(400).send({ message: error.message }))
})

notiRoute.post("/getnoti", (req, res) => {
    const { iduser, skip } = req.body;
    Notifica.getListNoti(iduser, skip)
    .then( response => res.send(response))
    .catch( err => res.status(400).send(err));
})

module.exports= notiRoute;