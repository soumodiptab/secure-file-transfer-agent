let fileObj ={
    name: 'xyz.txt',
    path: './asdas/aasasds/xyz.txt',
    type: 'upload',
    uuid: 'asdasd',
    chunk_size: 1024*1024,
    status: 'uploading',
    chunks: [1,0,1,0,0,1],
    chunks_uploaded: 3,
    chunks_total: 6,
};

function pausedownload(fileObj){
    if (fileObj.status !== 'uploading') return 0;
    fileObj.status = 'paused';
    return 1;
    // save fileObj to db
}

function resumedownload(fileObj){
    if (fileObj.status !== 'paused') return 0;
    fileObj.status = 'uploading';
    return 1;
    // save fileObj to db
}