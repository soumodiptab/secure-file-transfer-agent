const {Model, DataTypes} = require('sequelize');
const sequelize = require('../controllers/dbHandler');
class Agent extends Model {
};

Agent.init({
    id :{type: DataTypes.INTEGER, primaryKey: true},
    port :{type: DataTypes.INTEGER},
    downloadPath:{type: DataTypes.STRING},
},{
    sequelize,
    modelName: 'agent'
});
module.exports = Agent;