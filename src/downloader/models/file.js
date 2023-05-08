const {Model, DataTypes, Sequelize} = require('sequelize');
const sequelize = require('../server');
class File extends Model {
};

File.init({
    id :{type: DataTypes.STRING,primaryKey:true},
    fileName:{type: DataTypes.STRING},
    filePath:{type: DataTypes.STRING},
    partPAth:{type: DataTypes.STRING},
    size:{type:DataTypes.INTEGER},
    parts:{type:DataTypes.INTEGER},
    partsSent:{type:DataTypes.INTEGER},
    partsReceived:{type:DataTypes.INTEGER},
    partsArray:{type:DataTypes.ARRAY(DataTypes.INTEGER)},
    progress:{type:DataTypes.INTEGER},
    type:{type: DataTypes.STRING},
    status:{type: DataTypes.STRING},
    senderId:{type: DataTypes.STRING},
    receiverId :{type: DataTypes.STRING},
    secretKey : {type: DataTypes.STRING} 
},{
    sequelize,
    modelName: 'file'
});
module.exports = File;