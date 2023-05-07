const fs = require('fs');
const path = require('path');
/**
 * 
 * @param {*} filepath 
 * @param {*} fileName 
 * @param {*} outputDirectory 
 * @param {*} start 
 * @param {*} end 
 * @param {*} index 
 */
const createPartition = (filepath,fileName,outputDirectory,start,end,index) =>{
    const inputFilePath = filepath;
    const outputFilePath = path.join(outputDirectory, `${fileName}-p-${index}.part`);
    const inputStream = fs.createReadStream(inputFilePath,{start:start,end:end});
    let outputStream = fs.createWriteStream(outputFilePath);
    inputStream.on('data', function(chunk) {
        outputStream.write(chunk);
      });
    inputStream.on('end', function() {
        outputStream.end();
    });
}
/**
 * 
 * @param {*} fileName 
 * @param {*} downloadPath 
 * @param {*} fileId 
 * @param {*} parts 
 */
const mergeFiles = (fileName, downloadPath,fileId,parts) => {
    if(!fs.existsSync(path.join(downloadPath,fileId))){
      throw new Error('Merge Folder not found');
    }
    const mergedFilePath = path.join(downloadPath, fileName);
    if (fs.existsSync(mergedFilePath)) {
      fs.rmSync(mergedFilePath);
    }
    const fileOutStream = fs.createWriteStream(mergedFilePath);
    const mergeFile = (partIndex) => {
      const partFilePath = path.join(downloadPath, fileId,`${fileName}-p-${partIndex}.part`);
      const inputStream = fs.createReadStream(partFilePath);
      inputStream.pipe(fileOutStream, { end: false });
      inputStream.on('end', () => {
        fs.rmSync(partFilePath);
        console.log (`${partFilePath} merged into ${mergedFilePath}`);
        if(partIndex<parts-1){
          mergeFile(partIndex+1);
          return;
        }
        else{
          fileOutStream.end();
          return ;
        }
      });
    };
    mergeFile(0);
    fileOutStream.on('finish', () => {
      fs.rmSync(path.join(downloadPath,fileId), { recursive: true });
      console.log('Merging finished');
      return;
    });
  };

  module.exports = {
    createPartition,
    mergeFiles
};