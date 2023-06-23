import {Injectable} from "@nestjs/common";
import {HttpCustomService} from "../HttpCustomService";
import {Result} from "../../interfaces/Ingestion-data";
import {GenericFunction} from "../generic-function";
import {ReadStream} from "fs";
import {IngestionDatasetQuery} from "../../query/ingestionQuery";
import {DatabaseService} from '../../../database/database.service';
import {Request} from "express";

const fs = require('fs');
const {parse} = require('@fast-csv/parse');

let csvImportDimensionSchema = {
    "type": "object",
    "properties": {
        "ingestion_type": {
            "type": "string",
            "enum": [
                "event",
                "dataset",
                "dimension"
            ]
        },
        "ingestion_name": {
            "type": "string",
            "shouldnotnull": true
        }
        
    },
    "required": [
        "ingestion_type",
        "ingestion_name"
    ]
};
let csvImportEventSchema = {
    "type": "object",
    "properties": {
        "ingestion_type": {
            "type": "string",
            "enum": [
                "event",
                "dataset",
                "dimension"
            ]
        },
        "ingestion_name": {
            "type": "string",
            "shouldnotnull": true
        },
        "program_name": {
            "type": "string",
            "shouldnotnull": true    
        }
    },
    "required": [
        "ingestion_type",
        "ingestion_name",
        "program_name"
    ]
};

interface CSVInputBodyInterface {
    ingestion_type: string;
    ingestion_name: string;
    program_name?: string;
}

interface CSVAPIResponse {
    message: string;
    invalid_record_count: number;
    valid_record_count: number;
}

@Injectable()
export class CsvImportService {
    constructor(private http: HttpCustomService, private service: GenericFunction, private DatabaseService: DatabaseService) {
    }

    async readAndParseFile(inputBody: CSVInputBodyInterface, file: Express.Multer.File, request?: Request): Promise<Result> {
        return new Promise(async (resolve, reject) => {
            let isValidSchema: any;
            if(inputBody.ingestion_type === 'dimension'){
                 isValidSchema = await this.service.ajvValidator(csvImportDimensionSchema, inputBody);
            }
            else{
                isValidSchema = await this.service.ajvValidator(csvImportEventSchema, inputBody);
            }
            if (isValidSchema.errors) {
                reject({code: 400, error: isValidSchema.errors});
            } else {
                const fileCompletePath = file.path;
                const fileSize = file.size;
                const uploadedFileName = file.originalname;

                const queryStr = await IngestionDatasetQuery.createFileTracker(uploadedFileName, inputBody.ingestion_type, inputBody.ingestion_name, fileSize);
                const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                if (queryResult?.length === 1) {
                    this.asyncProcessing(inputBody, fileCompletePath, queryResult[0].pid, request);
                    resolve({code: 200, message: 'File is being processed'})
                } else {
                    resolve({code: 400, error: 'File is not Tracked'})
                }
            }
        });
    }

    async asyncProcessing(inputBody: CSVInputBodyInterface, fileCompletePath: string, fileTrackerPid: number, request: Request) {
        return new Promise(async (resolve, reject) => {
            // will not implement reject since it will be error and crash the server
            try {
                const ingestionType = inputBody.ingestion_type, ingestionName = inputBody.ingestion_name, program_name = inputBody?.program_name;
                const batchLimit: number = 100000;
                let batchCounter: number = 0,
                    ingestionTypeBodyArray: any = [], apiResponseDataList: CSVAPIResponse[] = [];
                let queryStr, queryResult, schema;
                switch (ingestionType) {
                    case 'event':
                            queryStr = await IngestionDatasetQuery.getEvents(ingestionName);
                            queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                            if (queryResult?.length === 1) {
                                schema = queryResult[0].schema;
                            } else {
                                const queryStr = await IngestionDatasetQuery.updateFileTracker(fileTrackerPid, `Error ->No event found`);
                                await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                                resolve('Error ->No event found');
                                return;
                            }
                        
                        
                        break;
                    case 'dimension':
                        queryStr = await IngestionDatasetQuery.getDimension(ingestionName);
                        queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                        if (queryResult?.length === 1) {
                            schema = queryResult[0].schema;
                        } else {
                            const queryStr = await IngestionDatasetQuery.updateFileTracker(fileTrackerPid, `Error ->No dimension found`);
                            await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                            resolve('Error ->No dimension found');
                            return;
                        }
                        break;
                    default:
                        queryStr = await IngestionDatasetQuery.getDataset(ingestionName);
                        queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                        if (queryResult?.length === 1) {
                            schema = queryResult[0].schema;
                        } else {
                            const queryStr = await IngestionDatasetQuery.updateFileTracker(fileTrackerPid, `Error ->No dataset found`);
                            await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                            resolve(`Error ->No dataset found`);
                            return;
                        }
                }

                const csvReadStream = fs.createReadStream(fileCompletePath)
                    .pipe(parse({headers: true}))
                    .on('data', (csvrow) => {
                        this.service.formatDataToCSVBySchema(csvrow, schema, false);
                        batchCounter++;
                        ingestionTypeBodyArray.push({...csvrow});
                        if (batchCounter > batchLimit) {
                            batchCounter = 0;
                            csvReadStream.pause();
                            this.resetAndMakeAPICall(ingestionType, ingestionName, ingestionTypeBodyArray, csvReadStream, apiResponseDataList, false, fileTrackerPid, request, program_name);
                            ingestionTypeBodyArray = []
                        }
                    })
                    .on('error', async (err) => {
                        // delete the file
                        try {
                            await fs.unlinkSync(fileCompletePath);
                            await this.service.deleteLocalFile(`./error-files/${ingestionName}_${fileTrackerPid}_errors.csv`);
                            const queryStr = await IngestionDatasetQuery.updateFileTracker(fileTrackerPid, 'Error');
                            await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                            resolve(`Error -> file stream error ${err}`);
                        } catch (e) {
                            console.error('csvImport.service.file delete error: ', e);
                        }
                    })
                    .on('end', async () => {
                        try {
                            // flush the remaining csv data to API
                            if (ingestionTypeBodyArray.length > 0) {
                                batchCounter = 0;
                                await this.resetAndMakeAPICall(ingestionType, ingestionName, ingestionTypeBodyArray, csvReadStream, apiResponseDataList, true, fileTrackerPid, request, program_name);
                                ingestionTypeBodyArray = undefined;
                                const queryStr = await IngestionDatasetQuery.updateFileTracker(fileTrackerPid, 'Uploaded', ingestionName + '_' + fileTrackerPid);
                                await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                            }
                            // delete the file
                            try {
                                await fs.unlinkSync(fileCompletePath);
                                if(ingestionType === 'dimension'){
                                    await this.service.deleteLocalFile(`./input-files/${ingestionName}-dimension.data.csv`);
                                }
                                if(ingestionType === 'event')
                                {
                                    await this.service.deleteLocalFile(`./input-files/${ingestionName}-event.data.csv`);
                                }
                                await this.service.deleteLocalFile(`./error-files/${ingestionName}_${fileTrackerPid}_errors.csv`);
                                console.log("error file should be deleted");
                            } catch (e) {
                                console.error('csvImport.service.file delete error: ', e);
                            }

                            resolve(`Success -> complete`);
                        } catch (apiErr) {
                            /*let validObject = 0, invalidObject = 0;
                            for (let responseData of apiResponseDataList) {
                                invalidObject += responseData.invalid_record_count;
                                validObject += responseData.valid_record_count;
                            }*/
                            apiResponseDataList = undefined;
                            let apiErrorData: any = {};
                            apiErrorData = JSON.parse(apiErr.message);
                            const queryStr = await IngestionDatasetQuery.updateFileTracker(fileTrackerPid, `Error ->${apiErrorData.message}`);
                            await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                            // delete the file
                            fs.unlinkSync(fileCompletePath);
                            await this.service.deleteLocalFile(`./error-files/${ingestionName}_${fileTrackerPid}_errors.csv`);
                            resolve(`Error END -> API err ${apiErr.message}`);
                        }
                    });
            } catch (e) {
                console.error('csvImport.service.asyncProcessing: ', e.message);
                resolve('Error -> catch error ' + e.message)
            }
        });
    }

    async resetAndMakeAPICall(ingestionType: string, ingestionName: string, ingestionTypeBodyArray: any[],
                              csvReadStream: ReadStream, apiResponseData: CSVAPIResponse[], isEnd = false, fileTrackerPid: number, request: Request, program_name?: string) {
        let postBody: any = {};
        const headers = {
            Authorization: request.headers.authorization,
        };       
        const url: string = process.env.URL + `/${ingestionType}`;
        const mainKey = ingestionType + '_name';    
        if(ingestionType === 'event'){
            postBody['program_name'] = program_name;   
           }
        postBody[mainKey] = ingestionName;

        postBody[ingestionType] = [...ingestionTypeBodyArray];
        postBody.file_tracker_pid = fileTrackerPid;
       
        try {
            let response = await this.http.post<CSVAPIResponse>(url, postBody, {headers: headers});
            apiResponseData.push(response.data);
            if (!isEnd) {
                csvReadStream.resume();
            }
        } catch (apiErr) {
            if (isEnd) {
                throw new Error(JSON.stringify(apiErr.response?.data || apiErr.message))
            } else {
                csvReadStream.destroy(apiErr.response?.data || apiErr.message);
            }
            return;
        }
    }
}