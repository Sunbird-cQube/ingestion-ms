import {Injectable} from "@nestjs/common";

const AWS = require("aws-sdk"); // from AWS SDK
const fs = require("fs"); // from node.js
const path = require("path");
import {BlobServiceClient} from "@azure/storage-blob";
import {lookup} from "mime-types";
import {Client} from "minio"

interface FileStructure {
    fileFullPath: string,
    fileName: string
}





@Injectable()
export class UploadService {
    /**
     * To upload files to
     * @param {string} bucketName
     * @param {string} inputPath
     * @param {string} uploadPath
     * @param {boolean} isDirInput
     * @returns {Promise<any>}
     */
    public uploadFiles(to: string, bucketName: string, inputPath: string, uploadPath: string, isDirInput = false): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let filesFullPathToUpload: FileStructure[] = [];
            if (isDirInput) {
                filesFullPathToUpload = this.getFilesFromDir(inputPath);
            } else {
                const fileName = path.basename(inputPath);
                filesFullPathToUpload.push({fileFullPath: inputPath, fileName: fileName});
            }
            // setting proper dir
            let uploadPathKey = '';
            for (let file of filesFullPathToUpload) {
                try {
                    uploadPathKey = `${uploadPath}${file.fileName}`;
                    if (to === 'aws') {
                        await this.uploadToS3(bucketName, file.fileFullPath, `${uploadPathKey}`);
                    } else if (to === 'azure') {
                        await this.uploadBlob(bucketName, file.fileFullPath, `${uploadPathKey}`);
                    } else {
                        await this.uploadToMinio(bucketName, file.fileFullPath, `${file.fileName}`, `${uploadPathKey}`)
                    }
                } catch (e) {
                    console.error(`file failed to upload: file ${file} - error - `, e);
                    reject(e);
                    break;
                }
            }
            resolve('Success');

        });
    }

    public uploadToS3(bucket: string, fileFullPath: string, fileName: string): Promise<any> {
        const s3 = new AWS.S3({
            signatureVersion: 'v4',
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY
        });
        return new Promise((resolve, reject) => {
            // file name
            const params = {
                Bucket: bucket,
                Key: fileName,
                Body: fs.readFileSync(fileFullPath),
            };
            s3.putObject(params, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`uploaded ${params.Key} to ${params.Bucket}`);
                    resolve(path);
                }
            });
        });
    }

    private blobServiceClient;
    private connectionStr: string;
    private containerName: string;

    constructor() {
        
    }

    public async uploadBlob(container: string, localFileFullPath: string, uploadFilePath: string) {
        // if the file gets too large convert to stream, currently not much info is there
        /*const containerClientStream = this.blobServiceClient.createWriteStreamToBlockBlob(container, uploadFilePath,
            (err, result, res) => {

            }
            const blockBlobClientStream = containerClient.createWriteStreamToBlockBlob();
        );*/
        try {
            this.connectionStr = process.env.AZURE_CONNECTION_STRING;
            this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionStr);
            const localFile = fs.readFileSync(localFileFullPath);
            const containerClient = this.blobServiceClient.getContainerClient(container);
            const blockClient = containerClient.getBlockBlobClient(uploadFilePath);
            return blockClient.upload(localFile, localFile.length);
        } catch (e) {
            console.error(`azure-upload.uploadBlob: container - ${container} , localFileFullPath - ${localFileFullPath}, uploadFilePath - ${uploadFilePath} `, e);
        }
    }


    public async uploadToMinio(bucketName, file, fileName, folderName) {
        let metaData = {
            "Content-Type": lookup(fileName),
        };
        const minioClient = new Client({
            endPoint: process.env.MINIO_END_POINT,
            port: +process.env.MINIO_PORT,
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY
        });
        return new Promise((resolve, reject) => {
            minioClient.fPutObject(
                bucketName,
                `${folderName}`,
                file,
                metaData,
                function (err, objInfo) {
                    if (err) {
                        reject(err);
                    }
                    console.log("Success", objInfo);
                    resolve(objInfo);
                }
            );
        })
    }

    private getFilesFromDir(dirInputName: string): FileStructure[] {
        let fileFullPath: string, fileStat;
        let fileFullPathToReturn: FileStructure[] = [];
        fs.readdirSync(dirInputName).forEach(fileName => {
            fileFullPath = path.join(dirInputName, fileName);
            fileStat = fs.statSync(fileFullPath);
            if (fileStat.isFile()) {
                fileFullPathToReturn.push({fileFullPath: fileFullPath, fileName: fileName});
            } else if (fileStat.isDirectory()) {
                fileFullPathToReturn.push(...this.getFilesFromDir(fileFullPath));
            }
        });
        return fileFullPathToReturn;
    }
}