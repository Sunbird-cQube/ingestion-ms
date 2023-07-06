import {Test, TestingModule} from '@nestjs/testing';
import {DimensionService} from './dimension.service';
import {GenericFunction} from '../generic-function';
import {DatabaseService} from '../../../database/database.service';
import * as fs from 'fs';
import {UploadService} from "../file-uploader-service";

describe('DimensionService', () => {
    let service: DimensionService;
    let genericFunc: GenericFunction;
    const dimensionInfo = [{
        schema: {
            "type": "object",
            "required": [
                "school_id",
                "school_name"
            ],
            "properties": {
                "school_id": {
                    "type": "string",
                    "shouldNotNull": true
                },
                "school_name": {
                    "type": "string",
                    "shouldNotNull": true
                }
            }
        }
    }];


    const mockDatabaseService = {
        executeQuery: jest.fn().mockReturnValue(dimensionInfo)
                                .mockReturnValueOnce([])
    };
    
    const mockUploadService = {
        uploadFiles: jest.fn()
    };
    jest.useFakeTimers();
    const env = process.env;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService, GenericFunction,UploadService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService
                },
                {
                    provide: UploadService,
                    useValue: mockUploadService
                },
                {
                    provide: DimensionService,
                    useClass: DimensionService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }],
        }).compile();
        service = module.get<DimensionService>(DimensionService);
                genericFunc = module.get<GenericFunction>(GenericFunction);
            jest.resetModules();
        process.env = { ...env };
    });
        afterEach(() => {
        process.env = env
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('No Dimension Found', async () => {
        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "name": "jhaha",
                "district_id": "SH123"
            }]
        };
        let resultOutput =
            {code: 400, error: "No dimension found"};
        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput)
    });

    it('Dimension Name is Missing', async () => {
        const dimensionData = {
            "dimension_name": "",
            "dimension": [{
                 "name": "jhaha",
                "district_id": "SH123"
            }]
        };

        let resultOutput =
            {code: 400, error: "Dimension name is missing"};

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);

    });

    it('Dimension array should not be empty', async () => {
        
        const dimensionData = {
            "dimension_name": "district",
            "dimension": []
        };

        let resultOutput =
            {code: 400, error: "Dimension array is required and cannot be empty"};

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);

    });

    it('Success message with error counter', async () => {
        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "district"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });
    
    
    
    it('Success message with error counter and storage as local', async () => {
        process.env.STORAGE_TYPE = 'local';
        
        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "district"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with error counter and storage as azure', async () => {
        process.env.STORAGE_TYPE = 'azure';
        
        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "district"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with error counter and storage as oracle', async () => {
        process.env.STORAGE_TYPE = 'oracle';
        
        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "district"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter', async () => {
        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "district"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter and storage as local', async () => {
        process.env.STORAGE_TYPE = 'local';

        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "district"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter and storage as azure', async () => {
        process.env.STORAGE_TYPE = 'azure';

        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "district"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter and storage as oracle', async () => {
        process.env.STORAGE_TYPE = 'oracle';

        const dimensionData = {
            "dimension_name": "district",
            "dimension": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "district"
        };
        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Dimension added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createDimension(dimensionData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

});
