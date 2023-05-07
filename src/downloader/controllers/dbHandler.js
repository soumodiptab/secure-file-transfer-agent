const {Sequelize} = require('sequelize');
const sequelize = new Sequelize('node-db','user','pass',{
    dialect: 'sqlite',
    host: './db.sqlite'
});
module.exports = sequelize;