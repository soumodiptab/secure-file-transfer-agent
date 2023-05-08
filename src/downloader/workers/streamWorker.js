const workerpool = require('workerpool');
const path = require('path');
const fs = require('fs');
let ss = require('socket.io-stream');
const crypto = require('crypto');
/**
 * Stream part file over socket
 * @param {*} partIndex 
 * @param {*} fileName 
 * @param {*} fileId 
 * @param {*} downloadPath 
 * @param {*} serverAddress 
 * @returns 
 */
function recieveStreamedData(partIndex, fileName, fileId, downloadPath, serverAddress,secretKey) {
    return new Promise((resolve, reject) => {
        try {
            const socket = require('socket.io-client')(`http://${serverAddress}`);
            socket.connect();
            socket.emit('request_part', { partIndex: partIndex, downloadId: fileId });
            const filebasename = path.basename(fileName);
            const destinationPath = path.join(downloadPath, `${filebasename}-p-${partIndex}.part`);
            // const secret_key = 'my_secret_key';
            const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
            ss(socket).on('part', (stream) => {
                const decryptedStream = stream.pipe(decipher);
                decryptedStream.pipe(fs.createWriteStream(destinationPath));
                decryptedStream.on('finish', () => {
                    console.log('Part ' + partIndex + ' received');
                    socket.disconnect();
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            workerpool.workerEmit('status', 'failed');
            reject();
        }
    });
}

workerpool.worker({
    recieveStreamedData: recieveStreamedData
});