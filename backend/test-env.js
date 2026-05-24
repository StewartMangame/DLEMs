const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('c:/Users/manga/Desktop/app/backend/.env'));
console.log(env.SMTP_USER);
