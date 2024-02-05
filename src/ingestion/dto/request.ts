export enum FileType {
  Dimension = 'dimension',
  Event = 'event',
}

export enum ValidationType {
  Grammar = 'grammar',
  Data = 'data',
}

export class FileValidateRequest {
  type: FileType;
}
