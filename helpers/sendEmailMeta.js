const nodemailer = require('nodemailer');
require('dotenv').config();

const { META_PASSWORD } = process.env;

const sendEmailMeta = async () => {
  const nodemailerConfig = {
    host: 'smtp.meta.ua',
    port: 465,
    secure: true,
    auth: {
      user: 'akarpenko83@meta.ua',
      pass: META_PASSWORD,
    },
  };
  const transport = nodemailer.createTransport(nodemailerConfig);
  const email = {
    to: 'akarpenko83@gmail.com',
    from: 'akarpenko83@meta.ua',
    subject: 'Test email',
    html: 'test email form localhost:3000',
  };
  await transport.sendMail(email);
};
module.exports = sendEmailMeta;
