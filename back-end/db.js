const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host:process.env.CONNECTION_HOST,
    user:process.env.CONNECTION_USER,
    password:process.env.CONNECTION_PASSWORD,
    database:process.env.CONNECTION_DATABASE,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 10,
    decimalNumbers: true
})

module.exports = db