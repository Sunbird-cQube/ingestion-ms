import {HttpCustomService} from './services/HttpCustomService';
import {HttpModule} from '@nestjs/axios';
import {Module} from '@nestjs/common';
import {DatabaseModule} from 'src/database/database.module';
import {IngestionController} from './controller/ingestion.controller';
import {DatasetService} from './services/dataset/dataset.service';
import {DimensionService} from './services/dimension/dimension.service';
import {EventService} from './services/event/event.service';
import {GenericFunction} from './services/generic-function';
import {CsvImportService} from "./services/csvImport/csvImport.service";
import {FileStatusService} from './services/file-status/file-status.service';
import {UpdateFileStatusService} from "./services/update-file-status/update-file-status.service";
import {DataEmissionService} from "./services/data-emission/data-emission.service";
import {UploadService} from "./services/file-uploader-service";
import { RawDataImportService } from './services/rawDataImport/rawDataImport.service';
import { NvskApiService } from './services/nvsk-api/nvsk-api.service';
import { DateService } from './services/dateService';
import { UploadDimensionFileService } from './services/upload-dimension-file/upload-dimension-file.service';
import { GrammarService } from './services/grammar/grammar.service';
import { ValidatorService } from './services/validator/validator.service';

@Module({
    controllers: [IngestionController],
    providers: [DatasetService, DimensionService, EventService, GenericFunction, HttpCustomService, CsvImportService, FileStatusService,
        UpdateFileStatusService, DataEmissionService, UploadDimensionFileService, UploadService,RawDataImportService,NvskApiService,DateService,GrammarService, ValidatorService],
    imports: [DatabaseModule, HttpModule]
})
export class IngestionModule {
}
