import { ValidationErrors } from '../dto/errors';

export class EventDataValidator {
  private grammarRows: string[];
  private dataRows: string[];

  constructor(grammarContent: string, dataContent: string) {
    this.grammarRows = grammarContent
      .split('\n')
      .filter((line) => line.trim() !== '');

    this.dataRows = dataContent
      .split('\n')
      .filter((line) => line.trim() !== '');
  }

  verify() {
    const errors: ValidationErrors[] = [];

    // check that the header matches the grammar
    errors.push(
      ...this.matchHeaders(
        this.dataRows[0].split(','),
        this.grammarRows[3].split(','),
      ),
    );
    // check that datatypes match the grammar
    errors.push(
      ...this.matchDataTypes(this.dataRows.slice(1), this.grammarRows[2]),
    );

    //TODO: check for structural errors with quote characters and delimiters

    return errors;
  }

  private matchHeaders(
    contentHeaders: string[],
    grammarHeaders: string[],
  ): ValidationErrors[] {
    const errors: ValidationErrors[] = [];

    if (contentHeaders.length !== grammarHeaders.length) {
      return [
        {
          row: 0,
          col: 0,
          errorCode: 2003,
          error:
            'Mismatch number of columns: Data file header length does not match the one specified in the grammar',
          data: contentHeaders,
        },
      ];
    }

    for (let i = 0; i < contentHeaders.length; i++) {
      if (contentHeaders[i] !== grammarHeaders[i]) {
        errors.push({
          row: 0,
          col: i,
          errorCode: 1005,
          error: `Mismatched header: Expected ${grammarHeaders[i]} but found ${contentHeaders[i]}`,
          data: contentHeaders,
        });
      }
    }

    return errors;
  }

  private matchDataTypes(contentData: string[], grammarDataTypes: string) {
    const errors: ValidationErrors[] = [];
    const dataTypes: string[] = grammarDataTypes.split(',');
    const numCols = dataTypes.length;

    for (let i = 0; i < contentData.length; i++) {
      const currentRow = contentData[i].split(',');
      const len = currentRow.length;
      if (currentRow.length !== dataTypes.length) {
        errors.push({
          row: i,
          col: 0,
          errorCode: 2003,
          error: `Expected ${numCols} columns at row ${i + 1} got ${len}`,
          data: currentRow,
        });

        continue;
      }

      dataTypes.forEach((dataType, idx) => {
        switch (dataType) {
          // TODO: Figure out a better way to manage the supported data types
          case 'string':
            if (typeof currentRow[idx] !== 'string') {
              errors.push({
                row: i,
                col: idx,
                errorCode: 1002,
                error: `Mismatched data type: Expected ${dataType} but found ${typeof currentRow[
                  idx
                ]}`,
                data: currentRow[idx],
              });
            }
            break;
          case 'integer':
            if (isNaN(parseFloat(currentRow[idx]))) {
              errors.push({
                row: i + 1 + '',
                col: idx + '',
                errorCode: 1002,
                error: `Mismatched data type: Expected ${dataType} but found ${typeof currentRow[
                  idx
                ]}`,
                data: currentRow[idx],
              });
            }
            break;
          case 'date-time':
            if (
              typeof currentRow[idx] !== 'string' ||
              isNaN(Date.parse(currentRow[idx]))
            ) {
              errors.push({
                row: i + 1 + '',
                col: idx + '',
                errorCode: 1002,
                error: `Mismatched data type: Expected ${dataType} but found ${typeof currentRow[
                  idx
                ]}`,
                data: currentRow[idx],
              });
            }
            break;
        }
      });
    }

    return errors;
  }
}
