import {Test, TestingModule} from '@nestjs/testing';
import {GenericFunction} from '../generic-function';
import {EventService} from './event.service';
import {DatabaseService} from '../../../database/database.service';
import {UploadService} from "../file-uploader-service";

describe('EventService', () => {
    let service: EventService;
    let genericFunc: GenericFunction;
    const eventInfo = [{
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
        executeQuery: jest.fn().mockReturnValue(eventInfo)
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
                    provide: EventService,
                    useClass: EventService
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }],
        }).compile();
        service = module.get<EventService>(EventService);
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

    it('No Event Found', async () => {
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }]
        };
        let resultOutput =
            {code: 400, error: "No event found"};
        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput)
    });

    it('Event Name is Missing', async () => {
        const eventData = {
            "event_name": "",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }]
        };

        let resultOutput =
            {code: 400, error: "Event name is missing"};

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);

    });

    it('Event array should not be empty', async () => {
        const eventData = {
            "event_name": "school",
            "event": []
        };

        let resultOutput =
            {code: 400, error: "Event array is required and cannot be empty"};

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);

    });

    it('Success message with error counter', async () => {
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with error counter and storage as local', async () => {
        process.env.STORAGE_TYPE = 'local';
        
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with error counter and storage as azure', async () => {
        process.env.STORAGE_TYPE = 'azure';
        
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with error counter and storage as oracle', async () => {
        process.env.STORAGE_TYPE = 'oracle';
        
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 1,
            validCounter: 0
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter', async () => {
        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter and storage as local', async () => {
        process.env.STORAGE_TYPE = 'local';

        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter and storage as azure', async () => {
        process.env.STORAGE_TYPE = 'azure';

        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });

    it('Success message with valid counter and storage as oracle', async () => {
        process.env.STORAGE_TYPE = 'oracle';

        const eventData = {
            "event_name": "school",
            "event": [{
                "school_id": "6677",
                "school_name": "test"
            }],
            "file_tracker_pid": "school"
        };

        let spy = jest.spyOn(genericFunc, 'writeToCSVFile').mockImplementation(() => new Promise((resolve, reject) => resolve(null)));

        let resultOutput = {
            code: 200,
            message: "Event added successfully",
            errorCounter: 0,
            validCounter: 1
        };

        expect(await service.createEvent(eventData)).toStrictEqual(resultOutput);
        spy.mockRestore();
    });
});
