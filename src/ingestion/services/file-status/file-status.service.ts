import { Injectable } from '@nestjs/common';
import { GenericFunction } from '../generic-function';
import { DatabaseService } from '../../../database/database.service';
import { IngestionDatasetQuery } from '../../query/ingestionQuery';
import { FileStatus } from './../../interfaces/Ingestion-data';

@Injectable()
export class FileStatusService {
    constructor(private DatabaseService: DatabaseService, private service: GenericFunction,) { }
    async getFileStatus(inputData: FileStatus) {
        try {
            let getFileSchema = {
                "input": {
                    "type": "object",
                    "properties": {
                        "filename": {
                            "type": "string",
                            "pattern":"^.*\.(csv|zip)$",
                            "shouldnotnull": true
                        },
                        "ingestion_type": {
                            "type": "string",
                            "enum": [
                                "event",
                                "dimension"
                            ],
                            "shouldnotnull": true
                        },
                        "ingestion_name": {
                            "type": "string",
                            "shouldnotnull": true
                        },

                    },
                    "required": [
                        "filename",
                        "ingestion_type",
                        "ingestion_name"
                    ]
                }
            };
            const FileName = inputData.filename;
            const ingestionType = inputData.ingestion_type;
            const ingestionName = inputData.ingestion_name;
            const isValidSchema: any = await this.service.ajvValidator(getFileSchema.input, inputData);
            if (isValidSchema.errors) {
                return { code: 400, error: isValidSchema.errors }
            }
            else {
                const queryStr = await IngestionDatasetQuery.getFileStatus(FileName, ingestionType, ingestionName);
                const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                if (queryResult.length > 0) {
                    const latestRecord = queryResult[0];
                    return {
                        "code": 200,
                        "response": latestRecord
                    }
                }
                else {
                    return {
                        "code": 400,
                        "error": "No records found"
                    }
                }
            }
        }
        catch (e) {
            console.error('getFileStatus :service : ', e.message);
            throw new Error(e);
        }
    }
}