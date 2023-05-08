const workerpool = require('workerpool');
const path = require('path');
const fs = require('fs');
let ss = require('socket.io-stream');
/**
 * Stream part file over socket
 * @param {*} partIndex 
 * @param {*} fileName 
 * @param {*} fileId 
 * @param {*} downloadPath 
 * @param {*} serverAddress 
 * @returns 
 */
function recieveStreamedData(partIndex, fileName, fileId,downloadPath,serverAddress) {
    return new Promise((resolve, reject) => {
        try
        {
            const socket = require('socket.io-client')(`http://${serverAddress}`);
            socket.connect();
            socket.emit('request_part', { partIndex: partIndex, downloadId: fileId });
            const filebasename = path.basename(fileName);
            const destinationPath = path.join(downloadPath, `${filebasename}-p-${partIndex}.part`);
            ss(socket).on('part', (stream) => {
                stream.pipe(fs.createWriteStream(destinationPath));
                stream.on('finish', () => {
                    console.log('part recieved');
                    socket.disconnect();
                    resolve();
                });
            });
        }
        catch(err){
            console.log(err);
            workerpool.workerEmit('status','failed');
            reject();
        }
    });
}
workerpool.worker({
    recieveStreamedData: recieveStreamedData
});