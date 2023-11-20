import { GenericFunction } from './../generic-function';
import { Injectable } from "@nestjs/common";
import { HttpCustomService } from "../HttpCustomService";
import { RawDataResponse } from "../../interfaces/Ingestion-data";
import { UploadService } from "../file-uploader-service";

@Injectable()
export class RawDataImportService {
  constructor(
    private http: HttpCustomService,
    private uploadService: UploadService,
    private service: GenericFunction
  ) { }
  async readFiles(inputBody): Promise<RawDataResponse> {
    const schema = {
      type: 'object',
      properties: {
        program_names: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['program_names'],
      additionalProperties: false,
    };
    const isValidSchema: any = await this.service.ajvValidator(schema, inputBody);
    if (isValidSchema.errors) {
      return { code: 400, error: isValidSchema.errors }
    }
    else {
      return new Promise(async (resolve, reject) => {
        try {
          const result = inputBody.program_names.map(async (program_name) => {
            const obj = {
              program_name: program_name,
              urls: [],
            };
            const key = `emission`;
            await this.uploadService
              .getFolderNames(key)
              .then(async (objects: any) => {
                const parsedDates = objects.map((dateStr) => new Date(dateStr));
                var latestDate: any = new Date(Math.max(...parsedDates));
                latestDate = `${latestDate.getDate() < 10 ? '0'+latestDate.getDate() : latestDate.getDate()}-${formatMonth(latestDate.getMonth())}-${latestDate.getFullYear()}`;
                function formatMonth(monthIndex) {
                  const monthNames = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ];
                  return monthNames[monthIndex];
                }
                await this.uploadService
                  .getFolderObjects(`${key}/${latestDate}`)
                  .then(async (objectNames: any) => {
                    objectNames = objectNames.filter((objectName) =>
                    objectName?.toLowerCase().includes(program_name.toLowerCase())
                    );
                    const promises = objectNames.map(async (objectKey) => {
                      const url = await this.uploadService.fileDownloaderUrl(
                        objectKey,`${key}/${latestDate}`
                      );
                      return url;
                    });
                    // Wait for all promises to resolve
                    const a = await Promise.all(promises);
                    obj.urls = a;
                  });
              });
            return obj;
          });
          const data = await Promise.all(result);
          resolve({ code: 200, data: data });
        } catch (error) {
          reject({ code:400, error:error });
        }
      });
    }
  }
}
