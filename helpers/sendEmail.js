const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
require('dotenv').config();

const { MAILGUN_API_KEY } = process.env;

const sendEmail = async data => {
  const mg = mailgun.client({
    username: 'akarpenko83@gmail.com',
    key: MAILGUN_API_KEY,
  });

  mg.messages
    .create('sandbox0ad3d86c89874fdc9638a40c267d56bf.mailgun.org', {
      from: 'Mailgun Sandbox <akarpenko83@gmail.com>',
      to: [data.to],
      subject: 'Verify your email',
      text: 'Verify your email',
      html: data.html,
    })
    .then(msg => console.log(msg))
    .catch(err => console.log(err));
};

module.exports = sendEmail;
