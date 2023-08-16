import {ApiProperty} from "@nestjs/swagger";

export class dimesionobj {
    @ApiProperty()
    grade?: number
    @ApiProperty()
    school_id?: number
    @ApiProperty()
    school_name?: string
    @ApiProperty()
    school_type?: string
    @ApiProperty()
    school_category?: string
    @ApiProperty()
    cluster_id?: number
    @ApiProperty()
    cluster_name?: string
    @ApiProperty()
    block_id?: number
    @ApiProperty()
    block_name?: string
    @ApiProperty()
    district_id?: number
    @ApiProperty()
    district_name?: string
    @ApiProperty()
    state_id?: number
    @ApiProperty()
    state_name?: string
}

export class Dimension {
    @ApiProperty()
    dimension_name: string
    @ApiProperty({isArray: true, type: () => dimesionobj})
    dimension: dimesionobj[];
}

export class eventObj {
    @ApiProperty()
    date?: string
    @ApiProperty()
    school_id?: string
    @ApiProperty()
    grade?: number
    @ApiProperty()
    gender?: string
    @ApiProperty()
    total_students?: number
    @ApiProperty()
    students_attendance_marked?: number
    @ApiProperty()
    students_attendance_present?: number
    @ApiProperty()
    school_category: string
    @ApiProperty()
    students_marked_present: number
}

export class IEvent {
    @ApiProperty()
    event_name: string
    @ApiProperty({isArray: true, type: () => eventObj})
    event: eventObj[];
    @ApiProperty()
    isEnd: boolean;
}

export class datasetobj {
    @ApiProperty()
    date?: string
    @ApiProperty()
    school_id?: number
    @ApiProperty()
    grade?: number
    @ApiProperty()
    sum_students_attendance_marked?: number
    @ApiProperty()
    sum_total_students?: number
    @ApiProperty()
    percentage?: number
}

export class datasetItems {
    @ApiProperty({isArray: true, type: () => datasetobj})
    items: datasetobj[]
}

export class Dataset {
    @ApiProperty()
    dataset_name: string
    @ApiProperty()
    dataset: datasetItems
}

export class Pipeline {
    @ApiProperty()
    pipeline_name: string
}


export interface Result {
    code: number,
    message?: string,
    error?: string,
    errorCounter?: number,
    validCounter?: number
}

export class FileStatus {
    @ApiProperty()
    filename?: string
    @ApiProperty()
    ingestion_type?: string
    @ApiProperty()
    ingestion_name?: string
}

export class CSVBody {
    @ApiProperty({type: 'string', format: 'binary', required: true})
    file: Express.Multer.File;
    @ApiProperty({type: 'string'})
    ingestion_type: string;
    @ApiProperty({type: 'string'})
    ingestion_name: string;
    @ApiProperty({type: 'string'})
    program_name: string;
}

export class FileStatusInterface {
    @ApiProperty()
    file_name: string;
    @ApiProperty()
    ingestion_type: string;
    @ApiProperty()
    ingestion_name: string;
    @ApiProperty()
    status: string;
}

export class CsvToJson {
    @ApiProperty({ type: 'string', format: 'binary', required: true })
    file: Express.Multer.File
}

export interface InputSchema {
    type: string;
    properties: Items;
    shouldnotnull: boolean;
}

export interface Items {
    type: string;
    required: string[];
    properties: any;
}

export class EmissionBody {
    @ApiProperty({type: 'string', format: 'binary', required: true})
    file: Express.Multer.File;
}