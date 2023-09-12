import { Injectable } from "@nestjs/common";

const AWS = require("aws-sdk"); // from AWS SDK
const fs = require("fs"); // from node.js
const path = require("path");
import { BlobServiceClient } from "@azure/storage-blob";
import { lookup } from "mime-types";
import { Client } from "minio";
import { objectstorage } from "oci-sdk";
import * as common from "oci-common";
interface FileStructure {
  fileFullPath: string;
  fileName: string;
}

@Injectable()
export class UploadService {
  // using default provider ~/.oci/config
  private provider: common.ConfigFileAuthenticationDetailsProvider;
  private oracleObjectStorageClient;

  private blobServiceClient;
  private connectionStr: string;
  private containerName: string;
  private minioClient: Client;
  constructor() {
    if (process.env.STORAGE_TYPE === "oracle") {
      this.provider = new common.ConfigFileAuthenticationDetailsProvider();
      this.oracleObjectStorageClient = new objectstorage.ObjectStorageClient({
        authenticationDetailsProvider: this.provider,
      });
    }
    else if (process.env.STORAGE_TYPE === "local") {
      this.minioClient = new Client({
        endPoint: process.env.MINIO_END_POINT,
        port: +process.env.MINIO_PORT,
        useSSL: false,
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
      });

    }
  }


  /**
   * To upload files to
   * @param {string} bucketName
   * @param {string} inputPath
   * @param {string} uploadPath
   * @param {boolean} isDirInput
   * @returns {Promise<any>}
   */
  public uploadFiles(
    to: string,
    bucketName: string,
    inputPath: string,
    uploadPath: string,
    isDirInput = false
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let filesFullPathToUpload: FileStructure[] = [];
      if (isDirInput) {
        filesFullPathToUpload = this.getFilesFromDir(inputPath);
      } else {
        const fileName = path.basename(inputPath);
        filesFullPathToUpload.push({
          fileFullPath: inputPath,
          fileName: fileName,
        });
      }
      // setting proper dir
      let uploadPathKey = "";
      for (let file of filesFullPathToUpload) {
        try {
          uploadPathKey = `${uploadPath}${file.fileName}`;
          if (to === "aws") {
            await this.uploadToS3(
              bucketName,
              file.fileFullPath,
              `${uploadPathKey}`
            );
          } else if (to === "azure") {
            await this.uploadBlob(
              bucketName,
              file.fileFullPath,
              `${uploadPathKey}`
            );
          } else if (to === "oracle") {
            await this.uploadToOracleObjectStorage(
              process.env.ORACLE_NAMESPACE,
              bucketName,
              file.fileFullPath,
              `${uploadPathKey}`
            );
          } else {
            await this.uploadToMinio(
              bucketName,
              file.fileFullPath,
              `${file.fileName}`,
              `${uploadPathKey}`
            );
          }
        } catch (e) {
          console.error(`file failed to upload: file ${file} - error - `, e);
          reject(e);
          break;
        }
      }
      resolve("Success");
    });
  }

  public uploadToS3(
    bucket: string,
    fileFullPath: string,
    fileName: string
  ): Promise<any> {
    const s3 = new AWS.S3({
      signatureVersion: "v4",
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });
    return new Promise( (resolve, reject) => {
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

  public fileDownloaderUrl(fileName: string) {
    if (process.env.STORAGE_TYPE === 'aws') {
      const s3 = new AWS.S3({
        signatureVersion: "v4",
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION
      });
      return new Promise((resolve, reject) => {
        // file name
        const params = {
          Bucket: process.env.AWS_BUCKET,
          Key: fileName,
          Expires: 3600
        };
        s3.getSignedUrl('getObject', params, (err, url) => {
          if (err) {
            reject(err);
          } else {
            resolve(url);
          }
        });
      });
    }
    else if (process.env.STORAGE_TYPE === 'local') {
      const minioClient = new Client({
        endPoint: process.env.MINIO_END_POINT,
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
      });
      return new Promise((resolve, reject) => {
        minioClient.presignedUrl('GET', process.env.MINIO_BUCKET, fileName, 3600, function (err, presignedUrl) {
          if (err) {
            console.log(err)
          } else {
            resolve(presignedUrl)
          }
        });
      })

    }
  }

  public getFolderNames(folderName: string) {
    if (process.env.STORAGE_TYPE === 'aws') {
      const s3 = new AWS.S3({
        signatureVersion: "v4",
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: 'ap-south-1'
      });
      return new Promise((resolve, reject) => {
        // file name
        const params = {
          Bucket: process.env.AWS_BUCKET,
          Prefix: folderName+'/',
          Delimiter: '/'
        };

        s3.listObjects(params, async (err, data) => {
          if (err) {
            reject(err);
          } else {
            const folderNames = data.CommonPrefixes.map(prefix => prefix.Prefix);
            resolve(folderNames);
          }
        });
      });
    } else if (process.env.STORAGE_TYPE === 'local') {
      return new Promise((resolve,reject)=>{
      let minioFolderNames = []
        this.minioClient.listObjects(process.env.MINIO_BUCKET, folderName, true)
        .on('data', (obj) => {         
          minioFolderNames.push(obj.name?.split('/')[1]);
        })
        .on('error', (err) => {
          console.error('Error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log("the object names are:",minioFolderNames);
          resolve(minioFolderNames)
        });
    });
  }
}

  public async getFolderObjects(folderName){
    
    if (process.env.STORAGE_TYPE == 'aws') {
     const result =  await this.getObjectsFromS3(folderName);
     return result;
    } else if (process.env.STORAGE_TYPE == 'local') {
     const result =  await  this.getObjectsFromMinio(folderName);
     return result;
    }

  }

  public async getObjectsFromS3(folderName: string) {
    const s3 = new AWS.S3({
      signatureVersion: "v4",
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: 'ap-south-1'
    });
    return new Promise((resolve, reject) => {
      // file name
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Prefix: folderName,
      };

       s3.listObjects(params, async (err, data) => {
        if (err) {
          reject(err);
        } else {
          let objectData = await data.Contents.map((content) => content.Key);
          resolve(objectData);
        }
      });
    });
  }

  public async getObjectsFromMinio(folderName) {
    return new Promise(async(resolve,reject)=>{
      let minioFolderNames = []
       await this.minioClient.listObjectsV2(process.env.MINIO_BUCKET, folderName, true)
        .on('data', (obj) => {         
          minioFolderNames.push(obj.name?.split('/')[2]);
        })
        .on('error', (err) => {
          console.error('Error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log("the object names are:",minioFolderNames);
          resolve(minioFolderNames)
        });
    });
  }

  public async uploadBlob(
    container: string,
    localFileFullPath: string,
    uploadFilePath: string
  ) {
    // if the file gets too large convert to stream, currently not much info is there
    /*const containerClientStream = this.blobServiceClient.createWriteStreamToBlockBlob(container, uploadFilePath,
            (err, result, res) => {

            }
            const blockBlobClientStream = containerClient.createWriteStreamToBlockBlob();
        );*/
    try {
      this.connectionStr = process.env.AZURE_CONNECTION_STRING;
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        this.connectionStr
      );
      const localFile = fs.readFileSync(localFileFullPath);
      const containerClient =
        this.blobServiceClient.getContainerClient(container);
      const blockClient = containerClient.getBlockBlobClient(uploadFilePath);
      return blockClient.upload(localFile, localFile.length);
    } catch (e) {
      console.error(
        `azure-upload.uploadBlob: container - ${container} , localFileFullPath - ${localFileFullPath}, uploadFilePath - ${uploadFilePath} `,
        e
      );
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
      secretKey: process.env.MINIO_SECRET_KEY,
    });
    return new Promise((resolve, reject) => {
      minioClient.fPutObject(
        bucketName,
        `${folderName}`,
        file,
        metaData,
        function (err, objInfo) {
          if (err) {
            console.log("errrr ::::: ", err);

            reject(err);
          }
          console.log("Success", objInfo);
          resolve(objInfo);
        }
      );
    });
  }

  private getFilesFromDir(dirInputName: string): FileStructure[] {
    let fileFullPath: string, fileStat;
    let fileFullPathToReturn: FileStructure[] = [];
    fs.readdirSync(dirInputName).forEach((fileName) => {
      fileFullPath = path.join(dirInputName, fileName);
      fileStat = fs.statSync(fileFullPath);
      if (fileStat.isFile()) {
        fileFullPathToReturn.push({
          fileFullPath: fileFullPath,
          fileName: fileName,
        });
      } else if (fileStat.isDirectory()) {
        fileFullPathToReturn.push(...this.getFilesFromDir(fileFullPath));
      }
    });
    return fileFullPathToReturn;
  }

  public async uploadToOracleObjectStorage(
    nameSpaceName: string,
    bucketName: string,
    localFileFullPath: string,
    uploadFilePath: string
  ): Promise<objectstorage.responses.PutObjectResponse> {
    if (this.oracleObjectStorageClient) {
      const putObjectRequest: objectstorage.requests.PutObjectRequest = {
        objectName: uploadFilePath,
        bucketName: bucketName,
        namespaceName: nameSpaceName,
        putObjectBody: fs.createReadStream(localFileFullPath),
        retryConfiguration: {
          terminationStrategy: new common.MaxAttemptsTerminationStrategy(3),
        },
      };
      return this.oracleObjectStorageClient.putObject(putObjectRequest);
    } else {
      throw new Error(
        "Oracle object storage not initialized ... Current store Config = " +
        process.env.STORAGE_TYPE
      );
    }
  }

}
