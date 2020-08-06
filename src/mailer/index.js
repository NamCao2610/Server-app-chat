const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'username',
        pass: 'pass'
    }
});


function sendVerifyEmail(name, email,  addlink) {
    transporter.sendMail({
        from: '"App Chat" <appchat@gmail.com>',
        to: email,
        subject: 'Verification email',
        html: `
        <div>
            <h2>Hi ${name}</h2>
            Click to <a href=${addlink} >ĐÂY</a>để verify account.
        </div>`,
    }, function(err, info){
        if (err) {
            console.log(err.message);
        } else {
            console.log('Message sent: ' +  info.response);       
        }
    });
};



module.exports = { sendVerifyEmail } 