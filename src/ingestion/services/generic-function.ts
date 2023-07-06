import { Injectable } from '@nestjs/common';
import Ajv from "ajv";
import Ajv2019 from "ajv/dist/2019";
import addFormats from "ajv-formats";
import { InputSchema } from "../interfaces/Ingestion-data";
import * as fs from 'fs';
const path = require('path');
const csv = require('fast-csv');

const ajv = new Ajv2019();
addFormats(ajv);

const ObjectsToCsv = require('objects-to-csv');
ajv.addKeyword({ keyword: 'indexes' })
ajv.addKeyword({ keyword: 'psql_schema' })
ajv.addKeyword({
    keyword: 'shouldnotnull',
    validate: (schema, data) => {
        if (schema) {
            if (typeof data === 'object') return typeof data === 'object' && Object.keys(data).length > 0
            if (typeof data === 'string') return typeof data === 'string' && data.trim() !== ''
            if (typeof data === 'number') return typeof data === 'number'
        }
        else return true;
    }
});
ajv.addKeyword({
    keyword: 'shouldNotNull',
    validate: (schema, data) => {
        if (schema) {
            if (typeof data === 'object') return typeof data === 'object' && Object.keys(data).length > 0
            if (typeof data === 'string') return typeof data === 'string' && data.trim() !== ''
            if (typeof data === 'number') return typeof data === 'number'
        }
        else return true;
    }
});
ajv.addKeyword({
    keyword: 'unique',
    validate: (schema, data) => {
        if (schema) {
            if (typeof data === 'object') return typeof data === 'object' && Object.keys(data).length > 0
            if (typeof data === 'string') return typeof data === 'string' && data.trim() !== ''
            if (typeof data === 'number') return typeof data === 'number'
        }
        else return true;
    }
});

ajv.addKeyword('stripNewline', {
    keyword: 'stripNewline',
    type: 'string',
    validate: (schema, data) => {
        if (typeof data === 'string') {
            return true;
        }
        return false;
    },
    compile: (schema, parentSchema) => {
        return (data) => {
            if (typeof data === 'string') {
                return data.replace(/\n/g, '');
            }
            return data;
        };
    },
});


@Injectable()
export class GenericFunction {

    // for handling locking and unlocking
    private currentlyLockedFiles: any = {};

    // creating a lock to wait
    async writeToCSVFile(fileName, inputArray) {
        return new Promise( async (resolve, reject) => {
        try {
            do {
                // check is the lock is released
                if (this.currentlyLockedFiles[fileName]) {
                    await this.processSleep(10);
                } else {
                    // console.log('Lock released ');
                    break;
                }
            } while (true);
            // get the lock on the file
            this.currentlyLockedFiles[fileName] = true;

            const stream = fs.createWriteStream(fileName);
            await csv.write(inputArray, { headers: true})
                .pipe(stream)
                .on('finish', () => {
                    console.log('CSV file has been written successfully');
                    // delete the lock after writing
                    delete this.currentlyLockedFiles[fileName];
                    resolve('done')
                })
                .on('error', (err) => {
                    console.error('Error writing CSV file:', err);
                    reject(err)
                });
        } catch (e) {
            console.error('writeToCSVFile: ', e.message);
            throw new Error(e);
        }
    });

} 

    ajvValidator(schema, inputData) {
        const isValid = ajv.validate(schema, inputData);
        if (isValid) {
            return inputData;
        } else {
            return {
                errors: ajv.errors
            };
        }
    }

    async processSleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    async formatDataToCSVBySchema(input: any, schema: InputSchema, addQuotes = true) {
        const { properties } = schema;
        Object.keys(input).forEach(property => {
            if (properties[property]) {
                if (addQuotes && properties[property].type === 'string') {
                    let inputData = this.removeNewLine(`${input[property]}`);
                    input[property] = `'${inputData}'`;
                } else if (properties[property].type === 'integer' || properties[property].type === 'number' || properties[property].type === 'float') {
                    input[property] = Number(input[property]);
                }
            }
        });
        return input;
    }

    removeNewLine(input) {
        return input.replace(/\n/g, '').replace('\'', '');
    }

    async getDate() {
        let yourDate = new Date();
        const formattedDate = yourDate.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        }).replace(/ /g, '-');
        return formattedDate;
    }

    deleteLocalFile(fullFilePath) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(fullFilePath)) {
                fs.unlink(fullFilePath, (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve('File deleted successfully! ' + fullFilePath);
                });
            }
            else {
                resolve('File not present to be deleted' + fullFilePath)
            }
        })
    }
}
