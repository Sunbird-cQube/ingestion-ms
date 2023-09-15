export class EventGrammarValidator {
  private content: string[];

  constructor(grammarContent: string) {
    this.content = grammarContent
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => line.trim());
  }

  verify() {
    const errors: any[] = [];
    // check for length
    const len = this.content.length;
    if (len !== 5) {
      errors.push({
        row: 0,
        col: 0,
        errorCode: 2005,
        error: `Structural Error: Event Grammar file should contain exactly 5 rows but found ${len} rows`,
      });
    }

    // check for equal number of columns in each row
    const colCount = [];
    this.content.forEach((row) => {
      colCount.push(row.split(',').length);
    });

    if (colCount.every((val) => val === colCount[0]) === false) {
      errors.push({
        row: 0,
        col: 0,
        errorCode: 2003,
        error: 'Invalid CSV file: all rows should have equal number of columns',
      });
    }
    // TODO: add check for dimension names

    // TODO: add check for dimension key names

    // Check for supported data types
    const dataTypeRow = this.content[2];
    // const dataTypeErrors = [];

    dataTypeRow.split(',').forEach((dataType: string, index: number) => {
      if (!['string', 'integer', 'date'].includes(dataType.trim())) {
        errors.push({
          row: 1,
          col: index,
          errorCode: 1002,
          error: `Invalid data type: ${dataType}. Supported data types are: string, integer, date`,
          data: dataType,
        });
      }
    });

    // errors.push({
    //   row: 3,
    //   col: 0,
    //   errorCode: 1002,
    //   error: dataTypeErrors,
    // });
    // TODO: Add check to ensure the mentioned data type matches the dimension's datatype

    // check that last row only contains dimensions, timeDimensions and metric
    const dimensionIdxs = [];
    const lastRow = this.content[4];
    lastRow.split(',').forEach((item: string, idx: number) => {
      if (!['timeDimension', 'dimension', 'metric'].includes(item.trim())) {
        errors.push({
          row: 4,
          col: idx,
          errorCode: 1004,
          error: `Dimension Grammar Specification Error: Wrong values in fieldType row, allowed values are 1. dimension 2.timeDimension 3. metric, but received ${item}`,
          data: lastRow,
        });
      } else if (item.trim() === 'dimension') {
        dimensionIdxs.push(idx);
      }
    });

    // make sure second (fk fields row) and fourth row (header row) have same column names
    const fkKeysRow = this.content[1]
      .split(',')
      .map((item: string) => item.trim());
    const headerRow = this.content[3]
      .split(',')
      .map((item: string) => item.trim());

    dimensionIdxs.forEach((idx: number) => {
      if (fkKeysRow[idx] !== headerRow[idx]) {
        errors.push(
          {
            row: 1,
            col: idx,
            errorCode: 1005,
            error: `Event Grammar Specification Error: Mismatch header and dimension fk field names. Given header field name is: ${headerRow[idx]} and expected fk field name is: ${fkKeysRow[idx]}`,
            data: headerRow,
          },
          {
            row: 3,
            col: idx,
            errorCode: 1005,
            error: `Event Grammar Specification Error: Mismatch header and dimension fk field names. Given header field name is: ${headerRow[idx]} and expected fk field name is: ${fkKeysRow[idx]}`,
            data: headerRow,
          },
        );
      }
    });

    return errors;
  }
}
