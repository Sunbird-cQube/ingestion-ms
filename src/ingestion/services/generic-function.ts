import {Injectable} from '@nestjs/common';
import Ajv from "ajv";
import Ajv2019 from "ajv/dist/2019";
import addFormats from "ajv-formats";
import {InputSchema} from "../interfaces/Ingestion-data";
import * as fs from 'fs';

const path = require('path');

const ajv = new Ajv2019();
addFormats(ajv);

const ObjectsToCsv = require('objects-to-csv');
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

@Injectable()
export class GenericFunction {

    // for handling locking and unlocking
    private currentlyLockedFiles: any = {};

    // creating a lock to wait
    async writeToCSVFile(fileName, inputArray) {
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
            const csv = new ObjectsToCsv(inputArray);

            let response = await csv.toDisk(fileName, {append: true});
            // delete the lock after writing
            delete this.currentlyLockedFiles[fileName];
            return response;
        } catch (e) {
            console.error('writeToCSVFile: ', e.message);
            throw new Error(e);
        }
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
        const {properties} = schema;
        Object.keys(input).forEach(property => {
            if (properties[property]) {
                if (addQuotes && properties[property].type === 'string') {
                    input[property] = `'${input[property]}'`;
                } else if (properties[property].type === 'integer' || properties[property].type === 'number' || properties[property].type === 'float') {
                    input[property] = Number(input[property]);
                }
            }
        });
        return input;
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
        })
    }
}