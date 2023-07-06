import {Test, TestingModule} from '@nestjs/testing';
import {GenericFunction} from '../generic-function';
import {CsvImportService} from './csvImport.service';
import {HttpCustomService} from "../HttpCustomService";
import * as fs from 'fs';
import {DatabaseService} from '../../../database/database.service';
import {Readable} from 'stream';
import {Request} from "express";
import {Req} from "@nestjs/common";

describe('csvImportService', () => {

    // api error compile

    beforeEach(() => jest.clearAllMocks());

   // afterAll(done => {
        // fs.unlinkSync('./files-test/file_api_call_resume_2.csv');
        // fs.unlinkSync('./files-test/file_unsuccessful_api_finished.csv');
        // fs.unlinkSync('./files-test/file_unsuccessful_api_in_process.csv');
        //fs.rmdirSync('./files-test');
        //done();
   // });

    it('Should be defined', async () => {
        let csvImportService: CsvImportService = await defineTheModuleCompilation();
        expect(csvImportService).toBeDefined();
    });

    // it('Should show validation Error for file', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 3, 'file_validation_error.csv');

    //     const inputData = {
    //         "ingestion_type": "test",
    //         "ingestion_name": "student_attendance"
    //     };
    //     let resultOutput = {
    //         code: 400,
    //         error: [
    //             {
    //                 instancePath: '/ingestion_type',
    //                 schemaPath: '#/properties/ingestion_type/enum',
    //                 keyword: 'enum',
    //                 params: {
    //                     allowedValues: [
    //                         "event",
    //                         "dataset",
    //                         "dimension"
    //                     ]
    //                 },
    //                 message: 'must be equal to one of the allowed values'
    //             }
    //         ]
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation();
    //     await expect(csvImportService.readAndParseFile(inputData, file)).rejects.toEqual(resultOutput);
    //     fs.unlinkSync(file.path);
    // });

    // it('Should return file is not Tracked', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 1003, 'list_valid_large.csv');
    //     const inputData = {
    //         "ingestion_type": "event",
    //         "ingestion_name": "student_attendance"
    //     };
    //     let resultOutput = {"code": 400, "error": "File is not Tracked"};
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation();
    //     await expect(csvImportService.readAndParseFile(inputData, file)).resolves.toEqual(resultOutput);
    //     fs.unlinkSync(file.path);
    // });

    // it('Should show file is being processed', async () => {

    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 1003, 'file_in_process.csv');

    //     const inputData = {
    //         "ingestion_type": "event",
    //         "ingestion_name": "student_attendance"
    //     };

    //     const dbValueMock = {
    //         executeQuery: jest.fn().mockReturnValueOnce([{pid: 1}])
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(undefined, dbValueMock);
    //     jest.spyOn(csvImportService, 'asyncProcessing').mockImplementation();
    //     let resultOutput = {code: 200, message: 'File is being processed'};
    //     expect(await csvImportService.readAndParseFile(inputData, file)).toStrictEqual(resultOutput);
    //     fs.unlinkSync(file.path)
    // });

    // it('Should make an api call with dataset and fail while in stream in process', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 1003, 'file_unsuccessful_api_in_process.csv');
    //     let csvReadStream;
    //     try {
    //         csvReadStream = fs.createReadStream(file.path);
    //         csvReadStream.pause();
    //         const mockErrHttpValue = {
    //             post: jest.fn().mockRejectedValue({response: {data: 'API error'}})
    //         };
    //         let csvImportService: CsvImportService = await defineTheModuleCompilation(mockErrHttpValue, undefined);
    //         expect(csvImportService.resetAndMakeAPICall('dataset', 'ingestionName',
    //             [], csvReadStream, [], true)).rejects.toThrowError('"API error"');
    //         // csvReadStream.destroy();
    //     } catch (e) {
    //         console.error('csvImport.service.spec.file read err: ', e);
    //     } finally {
    //         if (csvReadStream) {
    //             csvReadStream.destroy();
    //         }
    //         // fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should make an api call with dataset and fail while in stream is finished', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 1003, 'file_unsuccessful_api_finished.csv');
    //     let csvReadStream;
    //     try {
    //         csvReadStream = fs.createReadStream(file.path);
    //         csvReadStream.pause();
    //         const mockErrHttpValue = {
    //             post: jest.fn().mockRejectedValue({response: {data: 'API1 error'}})
    //         };
    //         let csvImportService: CsvImportService = await defineTheModuleCompilation(mockErrHttpValue, undefined);
    //         const spyResetAndMakeAPICall = jest.spyOn(csvImportService, 'resetAndMakeAPICall');
    //         csvImportService.resetAndMakeAPICall('dataset', 'ingestionName',
    //             [], csvReadStream, [], false);
    //         expect(spyResetAndMakeAPICall).toHaveBeenCalled();
    //     } catch (e) {
    //         console.error('csvImport.service.spec.file read err: ', e);
    //     } finally {
    //         if (csvReadStream) {
    //             csvReadStream.destroy();
    //         }
    //         // fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should make an api call with event and resume stream', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 1003, 'file_api_call_resume_2.csv');
    //     let csvReadStream;
    //     try {
    //         const mockHttp = {
    //             post: jest.fn().mockResolvedValue(true)
    //         };
    //         csvReadStream = fs.createReadStream(file.path);
    //         csvReadStream.pause();
    //         let csvImportService: CsvImportService = await defineTheModuleCompilation(mockHttp, undefined);
    //         const spyResetAndMakeAPICall = jest.spyOn(csvImportService, 'resetAndMakeAPICall');
    //         csvImportService.resetAndMakeAPICall('event', 'student_attendance',
    //             ['school_id', 'grade', 'count'], csvReadStream, [], false);
    //         expect(spyResetAndMakeAPICall).toHaveBeenCalled();
    //     } catch (e) {
    //         console.error('csvImport.service.spec.file read err: ', e);
    //     } finally {
    //         if (csvReadStream) {
    //             csvReadStream.destroy();
    //         }
    //         // fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should fail if invalid event name is given', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 10, 'file_invalid_event.csv');
    //     const inputData = {
    //         "ingestion_type": "event",
    //         "ingestion_name": "student_attendance"
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(undefined, undefined);
    //     try {
    //         const spyAsyncProcessing = jest.spyOn(csvImportService, 'asyncProcessing');
    //         await csvImportService.asyncProcessing(inputData, file.path);
    //         expect(spyAsyncProcessing).toHaveBeenCalled();
    //         // await expect().toHaveBeenCalled()
    //     } catch (e) {
    //         console.error('csvImport.service.spec.: ', e.message);
    //     } finally {
    //         fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should fail if invalid dimension name is given', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 10, 'file_invalid_dimension.csv');
    //     const inputData = {
    //         "ingestion_type": "dimension",
    //         "ingestion_name": "student_attendance"
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(undefined, undefined);
    //     try {
    //         const spyAsyncProcessing = jest.spyOn(csvImportService, 'asyncProcessing');
    //         await csvImportService.asyncProcessing(inputData, file.path);
    //         expect(spyAsyncProcessing).toHaveBeenCalled();
    //         // await expect().toHaveBeenCalled()
    //     } catch (e) {
    //         console.error('csvImport.service.spec.: ', e.message);
    //     } finally {
    //         fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should fail if invalid dataset name is given', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 10, 'file_invalid_dataset.csv');
    //     const inputData = {
    //         "ingestion_type": "dataset",
    //         "ingestion_name": "student_attendance"
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(undefined, undefined);
    //     try {
    //         const spyAsyncProcessing = jest.spyOn(csvImportService, 'asyncProcessing');
    //         await csvImportService.asyncProcessing(inputData, file.path);
    //         expect(spyAsyncProcessing).toHaveBeenCalled();
    //         // await expect().toHaveBeenCalled()
    //     } catch (e) {
    //         console.error('csvImport.service.spec.: ', e.message);
    //     } finally {
    //         fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should process event successfully', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 100010, 'file_event_success_with_batch.csv');
    //     const inputData = {
    //         "ingestion_type": "event",
    //         "ingestion_name": "student_attendance"
    //     };
    //     const mockDbCall = {
    //         executeQuery: jest.fn().mockReturnValue([{event_data: {input: {properties: {event: {items: {properties: {type: "string"}}}}}}}])
    //     };
    //     const mockPostCall = {
    //         post: jest.fn().mockResolvedValue({data: {code: 200, message: 'success'}})
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(mockPostCall, mockDbCall);
    //     try {
    //         await expect(csvImportService.asyncProcessing(inputData, file.path)).resolves.toStrictEqual('Success -> complete');
    //     } catch (e) {
    //         console.error('csvImport.service.spec.: ', e.message);
    //     } finally {
    //         // fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should process dimension successfully', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 10, 'file_dimension_success.csv');
    //     const inputData = {
    //         "ingestion_type": "dimension",
    //         "ingestion_name": "dimension_district"
    //     };
    //     const mockDbCall = {
    //         executeQuery: jest.fn().mockReturnValue([{dimension_data: {input: {properties: {dimension: {items: {properties: {type: "string"}}}}}}}])
    //     };
    //     const mockPostCall = {
    //         post: jest.fn().mockResolvedValue({data: {code: 200, message: 'success'}})
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(mockPostCall, mockDbCall);
    //     try {
    //         await expect(csvImportService.asyncProcessing(inputData, file.path)).resolves.toStrictEqual('Success -> complete');
    //     } catch (e) {
    //         console.error('csvImport.service.spec.: ', e.message);
    //     } finally {
    //         // fs.unlinkSync(file.path);
    //     }
    // });
    //
   
    //
    // it('Should handle api error for less number of invalid records', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 1000, 'file_event_success_with_batch.csv');
    //     const inputData = {
    //         "ingestion_type": "event",
    //         "ingestion_name": "student_attendance"
    //     };
    //     const mockDbCall = {
    //         executeQuery: jest.fn().mockReturnValue([{event_data: {input: {properties: {event: {items: {properties: {type: "string"}}}}}}}])
    //     };
    //     const mockPostCall = {
    //         post: jest.fn().mockRejectedValue({response: {data: 'API3 error'}})
    //     };
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(mockPostCall, mockDbCall);
    //     try {
    //         await expect(csvImportService.asyncProcessing(inputData, file.path)).resolves.toStrictEqual('Error END -> API err "API3 error"')
    //     } catch (e) {
    //         console.error('csvImport.service.spec.: ', e.message);
    //     } finally {
    //         // fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should handle DB error', async () => {
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 10, 'file_event_db_error.csv');
    //     const inputData = {
    //         "ingestion_type": "event",
    //         "ingestion_name": "student_attendance"
    //     };
    //     const mockDbCall = {
    //         executeQuery: jest.fn().mockRejectedValue(new Error('DB connection fail'))
    //     };
    //
    //     let csvImportService: CsvImportService = await defineTheModuleCompilation(undefined, mockDbCall);
    //     try {
    //         await expect(csvImportService.asyncProcessing(inputData, file.path))
    //             .resolves.toStrictEqual('Error -> catch error DB connection fail')
    //     } catch (e) {
    //         console.error('csvImport.service.spec.: ', e.message);
    //     } finally {
    //         fs.unlinkSync(file.path);
    //     }
    // });
    //
    // it('Should handle Steam error', async () => {
    //
    //     const mockedFs = fs as jest.Mocked<typeof fs>;
    //
    //     const file = createNumberOfLineCSVFile(['school_id', 'grade', 'count'], 10, 'file_stream_err.csv');
    //     const inputData = {
    //         "ingestion_type": "event",
    //         "ingestion_name": "student_attendance"
    //     };
    //     try {
    //
    //         const mReadStream: any = {
    //             pipe: jest.fn().mockReturnThis(),
    //             on: jest.fn().mockImplementation(function (event, handler) {
    //                 if (event === 'error') {
    //                     handler(new Error('Test stream error'));
    //                 }
    //                 return this;
    //             }),
    //         };
    //         jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(mReadStream);
    //         mockedFs.createReadStream.mockReturnValueOnce(mReadStream);
    //         const mockDbCall = {
    //             executeQuery: jest.fn().mockReturnValue([{event_data: {input: {properties: {event: {items: {properties: {type: "string"}}}}}}}])
    //         };
    //         const mockPostCall = {
    //             post: jest.fn().mockReturnValue({data: {code: 200, message: 'success'}})
    //         };
    //         let csvImportService: CsvImportService = await defineTheModuleCompilation(mockPostCall, mockDbCall);
    //         await expect(csvImportService.asyncProcessing(inputData, file.path)).resolves.toStrictEqual('Error -> file stream error Error: Test stream error');
    //         expect(fs.createReadStream).toBeCalledTimes(1);
    //         expect(mReadStream.pipe).toBeCalledTimes(1);
    //         expect(mReadStream.on).toBeCalledWith('error', expect.any(Function));
    //
    //
    //     } catch (e) {
    //         console.error('csvImport.service.spec.error: ', e.message);
    //         expect(e.message).toStrictEqual('Test error');
    //
    //     }
    //
    //
    // });
});

async function defineTheModuleCompilation(mockHttpValue = undefined, mockDatabaseValue = undefined) {
    let mockHttpServiceValue, mockDBServiceValue;
    if (mockHttpValue) {
        mockHttpServiceValue = mockHttpValue
    } else {
        mockHttpServiceValue = {
            post: jest.fn()
        };
    }

    if (mockDatabaseValue) {
        mockDBServiceValue = mockDatabaseValue
    } else {
        mockDBServiceValue = {
            executeQuery: jest.fn().mockReturnValueOnce([])
        };
    }
    const module: TestingModule = await Test.createTestingModule({
        providers: [HttpCustomService, GenericFunction, CsvImportService, DatabaseService,
            {
                provide: HttpCustomService,
                useValue: mockHttpServiceValue
            },
            {
                provide: GenericFunction,
                useClass: GenericFunction
            },
            {
                provide: DatabaseService,
                useValue: mockDBServiceValue
            },
            {
                provide: CsvImportService,
                useClass: CsvImportService
            }],
    }).compile();
    return module.get<CsvImportService>(CsvImportService);
}


// dynamically create csv file on specified number of line
function createNumberOfLineCSVFile(columns, csvNumberOfLine, fileName): Express.Multer.File {
    let csvFileData = columns.join(',') + '\n';
    const columnLength = columns.length;
    let individualLine = [];
    for (let i = 0; i < csvNumberOfLine; i++) {
        individualLine = [];
        for (let j = 1; j <= columnLength; j++) {
            individualLine.push((i + j).toString());
        }
        csvFileData += `${individualLine.join(',')}\n`
    }
    const dirName = './files-test/';
    createFile(dirName, fileName, csvFileData);
    let mutlerFile: Express.Multer.File = {
        originalname: fileName,
        mimetype: 'text/csv',
        path: dirName + fileName,
        buffer: null,
        fieldname: '',
        encoding: '',
        size: 0,
        stream: new Readable,
        destination: '',
        filename: ''
    };
    return mutlerFile;
}

const createFile = (
    path: string,
    fileName: string,
    data: string,
): void => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    fs.writeFileSync(`${path}${fileName}`, data, 'utf8');

};