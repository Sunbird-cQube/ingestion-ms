import {
    Dataset,
    Dimension,
    FileStatusInterface,
    CSVBody,
    CsvToJson,
    FileStatus,
    IEvent,
    Pipeline,
    Result, EmissionBody, RawDataPullBody
} from '../interfaces/Ingestion-data';
import {
    BadRequestException,
    Body,
    Controller, FileTypeValidator,
    Get,
    Logger,
    ParseFilePipe,
    Post,
    Query,
    Res,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
    Put,
    UseGuards, Req, Param
} from '@nestjs/common';
import {DatasetService} from '../services/dataset/dataset.service';
import {DimensionService} from '../services/dimension/dimension.service';
import {RawDataImportService} from '../services/rawDataImport/rawDataImport.service'
import {EventService} from '../services/event/event.service';
import {Response, Request} from 'express';
import {CsvImportService} from "../services/csvImport/csvImport.service";
import {diskStorage} from "multer";
import {FileIsDefinedValidator} from "../validators/file-is-defined-validator";
import {FileStatusService} from '../services/file-status/file-status.service';
import {UpdateFileStatusService} from '../services/update-file-status/update-file-status.service';
import {ApiConsumes, ApiTags} from '@nestjs/swagger';
import {DatabaseService} from '../../database/database.service';
import {DataEmissionService} from '../services/data-emission/data-emission.service';
import {JwtGuard} from '../../guards/jwt.guard';
import * as jwt from 'jsonwebtoken';
import { NvskApiService } from '../services/nvsk-api/nvsk-api.service';
import { UploadDimensionFileService } from '../services/upload-dimension-file/upload-dimension-file.service';
import { GrammarService } from '../services/grammar/grammar.service';
import { GenericFunction } from '../services/generic-function';
import {
    FileFieldsInterceptor,
    FileInterceptor,
} from '@nestjs/platform-express';
import { FileType, FileValidateRequest } from '../dto/request';
import * as fs from 'fs';
import { ValidatorService } from '../services/validator/validator.service';

let validateBodySchema = {
    "type": "object",
    "properties": {
        "type": {
            "type": "string",
            "enum": [
                "event",
                "dimension"
            ]
        },
        "id": {
            "type": "string",
            "shouldnotnull": true
        }
    },
    "required": [
        "type",
        "id"
    ]
};

const defaultStorageConfig = diskStorage({
    destination: './upload',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
});

@ApiTags('ingestion')
@Controller('')
export class IngestionController {
    private logger: Logger;

    constructor(
        private datasetService: DatasetService, private dimensionService: DimensionService
        , private eventService: EventService, private csvImportService: CsvImportService, private fileStatus: FileStatusService, private updateFileStatus: UpdateFileStatusService,
        private databaseService: DatabaseService, private dataEmissionService: DataEmissionService,
        private rawDataImportService:RawDataImportService,
        private nvskService:NvskApiService,
        private grammarService: GrammarService,
        private service: GenericFunction,
        private uploadDimension:UploadDimensionFileService,
        private validatorService: ValidatorService) {
        this.logger = new Logger(IngestionController.name);
    }

    @Get('generatejwt')
    testJwt(@Res() res: Response): any {
        let jwtSecretKey = process.env.JWT_SECRET;
        let data = {
            time: Date(),
        };
        try {
            const token: string = jwt.sign(data, jwtSecretKey);
            if (token) {
                res.status(200).send(token)
            }
            else {
                res.status(400).send("Could not generate token");
            }

        } catch (error) {
            res.status(400).send("Error Ocurred");
        }

    }

    @Post('/dataset')
    @UseGuards(JwtGuard)
    async createDataset(@Body() inputData: Dataset, @Res()response: Response) {
        try {
            let result: Result = await this.datasetService.createDataset(inputData);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            } else {
                response.status(200).send({
                    "message": result.message, invalid_record_count: result.errorCounter,
                    valid_record_count: result.validCounter
                });
            }
        }
        catch (e) {
            console.error('create-dataset-impl: ', e.message);
            throw new Error(e);
        }
    }

    @Post('/dimension')
    @UseGuards(JwtGuard)
    async createDimenshion(@Body() inputData: Dimension, @Res()response: Response) {
        try {
            let result: Result = await this.dimensionService.createDimension(inputData);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            } else {
                response.status(200).send({
                    "message": result.message, invalid_record_count: result.errorCounter,
                    valid_record_count: result.validCounter
                });
            }
        } catch (e) {
            console.error('create-dimension-impl: ', e.message);
            throw new Error(e);
        }
    }

    @Post('/event')
    @UseGuards(JwtGuard)
    async createEvent(@Body() inputData: IEvent, @Res()response: Response) {
        try {
            let result: Result = await this.eventService.createEvent(inputData);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            } else {
                response.status(200).send({
                    "message": result.message, invalid_record_count: result.errorCounter,
                    valid_record_count: result.validCounter
                });
            }
        } catch (e) {
            console.error('create-event-impl: ', e.message);
            throw new Error(e);
        }
    }

    @Post('/telemetryEvent')
    @UseGuards(JwtGuard)
    async createTelemetryEvent(@Body() inputData: IEvent, @Res()response: Response){
        try {
            let result: Result = await this.eventService.createTelemetryEvent(inputData);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            } else {
                response.status(200).send({
                    "message": result.message, invalid_record_count: result.errorCounter,
                    valid_record_count: result.validCounter
                });
            }
        } catch (error) {
            
        }
    }

    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './files',
        })
    }))
    @Post('/new_programs')
    @UseGuards(JwtGuard)
    @ApiConsumes('multipart/form-data')
    async csv(@Body() body: CSVBody, @Res()response: Response, @UploadedFile(
        new ParseFilePipe({
            validators: [
                new FileIsDefinedValidator(),
                new FileTypeValidator({fileType: 'text/csv'}),
            ],
        }),
    ) file: Express.Multer.File, @Req() request: Request) {
        try {
            let result = await this.csvImportService.readAndParseFile(body, file, request);
            if (result.code == 400) {
                response.status(400).send({message: result.error});
            } else {
                response.status(200).send({message: result.message});
            }
        } catch (e) {
            console.error('ingestion.controller.csv: ', e);
            response.status(400).send({message: e.error || e.message});
            // throw new Error(e);
        }
    }

    @Get('/file-status')
    @UseGuards(JwtGuard)
    async getFileStatus(@Query() query: FileStatus, @Res()response: Response) {
        try {
            let result: any = await this.fileStatus.getFileStatus(query);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            } else {
                response.status(200).send({"response": result.response});
            }
        }
        catch (e) {
            console.error('get-filestatus-impl: ', e.message);
            throw new Error(e);
        }
    }

    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './temp-files',
            filename: (req, file, cb) => {
                cb(null, `${file.originalname}`);
            }
        })
    }))
    @Post('/national_programs')
    @UseGuards(JwtGuard)
    @ApiConsumes('multipart/form-data')
    async uploadFile(@Body() body: EmissionBody, @Res()response: Response, @UploadedFile(
        new ParseFilePipe({
            validators: [
                new FileIsDefinedValidator(),
                new FileTypeValidator({fileType: 'zip'}),
            ],
        }),
    ) file: Express.Multer.File) {
        try {
            let result = await this.dataEmissionService.readAndParseFile(file);
            if (result.code == 400) {
                response.status(400).send({message: result.error});
            } else {
                response.status(200).send({message: result.message});
            }
        } catch (e) {
            console.error('ingestion.controller.csv: ', e);
            response.status(400).send({message: e.error || e.message});
        }
    }


    @Get('/upload-dimension')
    async dataEmission(@Res()response: Response) {
        try {
            const result: any = await this.uploadDimension.uploadFiles();
            if (result.code == 400) {
                response.status(400).send({message: result.error});
            } else {
                response.status(200).send({message: result.message});
            }
        } catch (e) {
            console.error('ingestion.controller.uploadDimensionFiles: ', e.message);
            throw new Error(e);
        }
    }

    @Post('/getRawData')
    @UseGuards(JwtGuard)
    async getPresignedUrls(@Body() inputData: RawDataPullBody, @Res()response: Response){
        try {

            const getUrls = await this.rawDataImportService.readFiles(inputData);
            response.status(200).send(getUrls)
        } catch (e) {
            console.error('ingestion.controller.getRawDataApi: ', e.message);
            throw new Error(e);
        }
    }
    @Post('/data-emitter')
    // @UseGuards(JwtGuard)
    async fetchData(@Body()inputData:RawDataPullBody ,@Res()response: Response,@Req() request: Request){
        try {
            const result: any = await this.nvskService.getEmitterData(inputData?.program_names, request);
            console.log("result is", result);
            if (result?.code == 400) {
                response.status(400).send({message: result.error});
            } else {
                response.status(200).send({message: result.message});
            }
        } catch (e) {
            console.error('ingestion.controller.nvskAPI service: ', e.message);
            throw new Error(e);
        }

    }

    @Get('/grammar/:type')
    async fetchGrammar(@Param() params: any, @Res()response: Response){
        try {
            const { type } = params;
            let result;
            if (type === "event") {
                result = await this.grammarService.getEventSchemas();
            } else if (type === "dimension") {
                result = await this.grammarService.getDimensionSchemas();
            } else {
                throw new Error(`Invalid type found ${type}`);
            }

            response.status(200).send(result);
        } catch (e) {
            console.error('ingestion.controller.nvskAPI service: ', e.message);
            throw new Error(e);
        }
    }

    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './files',
        })
    }))

    @Post('/validate-old')
    @ApiConsumes('multipart/form-data')
    async validateEventOrDimension(@Body() body: any, @Res()response: Response, @UploadedFile(
        new ParseFilePipe({
            validators: [
                new FileIsDefinedValidator(),
                new FileTypeValidator({fileType: 'text/csv'}),
            ],
        }),
    ) file: Express.Multer.File, @Req() request: Request) {
        try {
            let isValidSchema: any = await this.service.ajvValidator(validateBodySchema, body);
            if (isValidSchema && isValidSchema.errors) {
                response.status(400).send({error: isValidSchema.errors});
            } else {
                let result: any;
                if (body.type === "dimension") {
                    result = await this.dimensionService.validateDimension(body, file, request);
                } else if (body.type === "event") {
                    result = await this.eventService.validateEvent(body, file, request);
                }

                response.status(200).send({data: result});
            }
        } catch (e) {
            console.error('ingestion.controller.csv: ', e);
            response.status(400).send({message: e.error || e.message || e});
            // throw new Error(e);
        }
    }

    @Post('validate')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'grammar', maxCount: 1 },
                { name: 'data', maxCount: 1 },
            ],
            {
                storage: defaultStorageConfig,
                fileFilter(req, file, callback) {
                if (file.mimetype !== 'text/csv') {
                    return callback(
                    new BadRequestException('Only CSV files are allowed'),
                    false,
                    );
                }
                callback(null, true);
                },
            },
        )
    )
    uploadFileN(
        @UploadedFiles()
        files: {
            grammar?: Express.Multer.File[];
            data?: Express.Multer.File[];
        },
        @Body() body: FileValidateRequest,
    ) {
        const { type } = body;
        this.logger.debug(files.grammar);
        const grammarFilePath = files.grammar[0].path;

        if (!type)
            throw new BadRequestException('Schema Type is required'); 

        if (!grammarFilePath || !fs.existsSync(grammarFilePath))
            throw new BadRequestException('Grammar file is required');

        const grammarContent = fs.readFileSync(grammarFilePath, 'utf8');
        const dataFilePath = files?.data ? files?.data[0]?.path : undefined;

        let resp;
        switch (type.trim()) {
        case FileType.Dimension:
            if (!dataFilePath) {
                resp = this.validatorService.checkDimensionGrammarForValidationErrors(
                    grammarContent,
                );
            } else {
                resp = this.validatorService.checkDimensionDataForValidationErrors(
                    grammarContent,
                    fs.readFileSync(dataFilePath, 'utf8'),
                );
            }
            break;
        case FileType.Event:
            if (!dataFilePath) {
                resp = this.validatorService.checkEventGrammarForValidationErrors(
                    grammarContent,
                );
            } else {
                resp = this.validatorService.checkEventDataForValidationErrors(
                    grammarContent,
                    fs.readFileSync(dataFilePath, 'utf8'),
                );
            }
            break;
        default:
            throw new BadRequestException('Invalid file type');
        }

        // delete the files
        if (grammarFilePath) fs.unlinkSync(grammarFilePath);
        if (dataFilePath) fs.unlinkSync(dataFilePath);

        return resp;
    }

    @Post('bulk')
    @UseInterceptors(
        FileInterceptor('folder', {
        storage: defaultStorageConfig,
        }),
    )
    async uploadBulkZip(@UploadedFile() file: Express.Multer.File) {
        const zipFilePath = file.path;

        const resp = await this.validatorService.handleZipFile(zipFilePath);
        // delete the file
        if (zipFilePath) fs.unlinkSync(zipFilePath);
        return resp;
    }
}
