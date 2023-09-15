export enum FileType {
  DimensionGrammar = 'dimension-grammar',
  DimensionData = 'dimension-data',
  EventGrammar = 'event-grammar',
  EventData = 'event-data',
}

export class FileValidateRequest {
  type: FileType;
}
