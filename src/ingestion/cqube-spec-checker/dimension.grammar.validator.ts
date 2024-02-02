export class DimensionValidator {
  content: any;
  lines: any;
  pkIndexLine: any;
  dataTypesLine: any;
  headerLine: any;

  constructor(content) {
    this.content = content;
    this.lines = this.content.trim().split('\n');
    this.pkIndexLine = this.lines[0].trim().split(',');
    this.dataTypesLine = this.lines[1].trim().split(',');
    this.headerLine = this.lines[2].trim().split(',');
  }

  verify() {
    const errors = [];
    errors.push(...this.verifyColumns());
    errors.push(...this.verifyPkIndexLine());
    errors.push(...this.verifyDataTypes());
    return errors;
  }

  verifyColumns() {
    const errors = [];
    const columnCount = this.pkIndexLine.length;
    this.lines.forEach((line, lineNumber) => {
      if (line !== '') {
        // Ignore last line
        const lineColumns = line.split(',').length;
        if (lineColumns !== columnCount) {
          errors.push({
            row: lineNumber,
            col: 0,
            errorCode: 2003,
            error: `Line ${lineNumber + 1
              }: Invalid number of columns ${lineColumns} (expected ${columnCount}), ${line.split(
                ',',
              )}`,
            data: line,
          });
        }
      }
    });
    return errors;
  }

  verifyPkIndexLine() {
    if (this.pkIndexLine && this.pkIndexLine.length > 0) {
      const errors = [];
      let isAllEmpty = true;
      this.pkIndexLine.forEach((index, ind) => {
        console.log(index);
        if (typeof index === 'string'){
          index.trim();
        }

        if (index && index !== '' && index !== "PK" && index !== "Index") {
          errors.push({
            row: 0,
            col: ind,
            errorCode: 1003,
            error: `Invalid PK/Index: First row must include 'PK' and 'Index' but found "${index}"`,
            data: this.pkIndexLine,
          });
        } else if (index === "PK" || index === "Index") {
          isAllEmpty = false;
        }
      });
      
      if (isAllEmpty) {
        errors.push({
          row: -1,
          col: "common",
          errorCode: 1003,
          error: `Dimension should contain atleast one PK or Index Field`,
          data: this.pkIndexLine,
        });
      }

      return errors;
    }

    return [];
  }

  verifyDataTypes() {
    const errors = [];
    this.dataTypesLine.forEach((dataType, columnIndex) => {
      if (dataType !== 'string' && dataType !== 'number' && dataType !== 'integer') {
        errors.push({
          row: 1,
          col: columnIndex,
          errorCode: 1002,
          error: `Invalid data type at column ${columnIndex + 1
            }: Only 'string', 'number', and 'integer' are allowed but found '${dataType}'`,
          data: this.dataTypesLine,
        });
      }
    });
    return errors;
  }
}
