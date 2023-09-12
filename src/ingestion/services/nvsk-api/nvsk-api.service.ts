import { HttpCustomService } from './../HttpCustomService';
import { DatabaseService } from './../../../database/database.service';
import { GenericFunction } from './../generic-function';
import { UploadService } from './../file-uploader-service';
import { Body, Injectable } from '@nestjs/common';
import axios from 'axios';
import { IngestionDatasetQuery } from 'src/ingestion/query/ingestionQuery';
import { DateService } from '../dateService';
import { Request } from 'express';
const csv = require('csv-parser');
const fs = require('fs');
@Injectable()
export class NvskApiService {
   constructor(private fileService: UploadService, private service: GenericFunction, private databaseService: DatabaseService, private httpService: HttpCustomService,
      private dateService: DateService) {

   }
   /* NVSK side implementations */
   async getEmitterData(inputData: string[],request: Request) {
      let urlData;
      let names;
      if(!inputData || inputData.length == 0){
       names = process.env.PROGRAM_NAMES?.split(',')
      }else{
         names = inputData;
      }
      let body: any = {
         "program_names": names
      }
      try {
         const headers = {
            Authorization: request.headers.authorization
        }; 
         const result = await this.httpService.post(process.env.NVSK_URL + '/getRawData', body,{headers: headers})
         if (result?.data['code'] === 200) {
            urlData = result?.data['data']
         } else {
            console.log("Error ocurred::", JSON.stringify(result.data));
            return { code: 400, error: result?.data['error'] ? result?.data['error'] : "Error occured during the NVSK data emission" }
         }
         this.writeRawDataFromUrl(urlData,headers.Authorization)
         return { code: 200, message: "VSK Writing to the file in process" }
      } catch (error) {
         return { code: 400, errorMsg: error }
      }

   }
   async writeRawDataFromUrl(urlData: Array<{ program_name: string, urls: string[] }>,jwtToken:string) {
      try {
         if (urlData?.length > 0) {
            for (let data of urlData) {
               let pgname = data.program_name;
               for (let url of data.urls) {
                  const parsedUrl = new URL(url);
                  const fileName = `./rawdata-files/` + parsedUrl.pathname.split('/').pop();
                  if(fs.existsSync(fileName)){
                     this.service.deleteLocalFile(fileName);
                  }
                  const stream = (await axios.get(url, { responseType: 'stream' })).data
                  const filteredCsvStream = fs.createWriteStream(`${fileName}`);
                  let isFirstRow = true;
                  stream
                     .pipe(csv({}))
                     .on('data', (row) => {
                        if (isFirstRow) {
                           filteredCsvStream.write(Object.keys(row).join(',') + '\n');
                           isFirstRow = false;
                        }
                        if (row['state_code'].slice(1, -1) === process.env.STATE_ID) {
                           filteredCsvStream.write(Object.values(row).join(',') + '\n');
                        }
                     })
                     .on('end', () => {
                        filteredCsvStream.end();
                        filteredCsvStream.on('finish', async () => {
                           try {
                              let folderName = await this.service.getDate();
                              if (process.env.STORAGE_TYPE == 'local') {
                                 await this.fileService.uploadFiles('local', `${process.env.MINIO_BUCKET}`, fileName, `emission/${folderName}/`);
                              } else if (process.env.STORAGE_TYPE === 'azure') {
                                 await this.fileService.uploadFiles('azure', `${process.env.AZURE_CONTAINER}`, fileName, `emission/${folderName}/`);
                              } else if (process.env.STORAGE_TYPE === 'oracle') {
                                 await this.fileService.uploadFiles('oracle', `${process.env.ORACLE_BUCKET}`, fileName, `emission/${folderName}/`);
                              } else {
                                 await this.fileService.uploadFiles('aws', `${process.env.AWS_BUCKET}`, fileName, `emission/${folderName}/`);
                              }
                              this.service.deleteLocalFile(fileName)

                              const queryStr = await IngestionDatasetQuery.insertIntoEmission(pgname, url,jwtToken.split(' ')[1],'Uploaded')
                              const result = await this.databaseService.executeQuery(queryStr.query, queryStr.values)
                              console.log("The result is:", result);
                              console.log(`Filtered data saved to ${fileName}`);
                           } catch (error) {
                              this.service.deleteLocalFile(fileName)
                           }
                        })
                     })
                     .on('error', async (error) => {
                        const queryStr = await IngestionDatasetQuery.insertIntoEmission(pgname, url,jwtToken.split(' ')[1], error)
                        const result = await this.databaseService.executeQuery(queryStr.query, queryStr.values);
                        
                        this.service.deleteLocalFile(fileName);
                        console.error('Error processing CSV:', error);
                     });
               }
            }
            try {
               // let dateResult = await this.dateService.getCurrentTimeForCronSchedule()
               // let cronExpression = `0 ${dateResult[1]} ${dateResult[0]} * * ?`
               // console.log("Cron expression is:", cronExpression);
               let url = `${process.env.SPEC_URL}` + '/schedule'
               let scheduleBody = {
                  "processor_group_name": "Run_adapters",
                  "scheduled_at": "* 0/2 * * * ?"
               }
               console.log("The schedule body is:",scheduleBody)
               let scheduleResult = await this.httpService.post(url, scheduleBody)
               console.log('The scheudle result is:',scheduleResult?.data['message']);
               if (scheduleResult.status === 200) {
                  return { code: 200, message: scheduleResult?.['data']['message'] }
               } else {
                  return { code: 400, error: "Adapter schedule failed" }
               }
            } catch (err) {
               console.log("error for adapters is:", err);
            }


         }
      } catch (error) {
         console.log("error is:", error);
      }
   }
}






