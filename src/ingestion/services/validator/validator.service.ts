import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EventGrammarValidator } from '../../validators/event-grammar.validator';
import { SingleFileValidationResponse } from '../../dto/response';
import { EventDataValidator } from '../../validators/event-data.validator';
import { DimensionDataValidator } from '../../cqube-spec-checker/dimension.data.validator';
import { DimensionValidator } from '../../cqube-spec-checker/dimension.grammar.validator';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const decompress = require('decompress');
@Injectable()
export class ValidatorService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger(ValidatorService.name);
  }
  checkDimensionDataForValidationErrors(
    grammarContent: string,
    dataContent: string,
  ): SingleFileValidationResponse {
    const dimensionDataValidator = new DimensionDataValidator(
      grammarContent,
      dataContent,
    );
    const errors = dimensionDataValidator.verify();
    return {
      errors,
    };
  }

  checkDimensionGrammarForValidationErrors(
    grammarContent: string,
  ): SingleFileValidationResponse {
    const dimensionGrammarValidator = new DimensionValidator(grammarContent);

    const errors = dimensionGrammarValidator.verify();
    return {
      errors,
    };
  }

  checkEventGrammarForValidationErrors(
    grammarContent: string,
  ): SingleFileValidationResponse {
    const eventGrammarValidator = new EventGrammarValidator(grammarContent);

    const errors = eventGrammarValidator.verify();
    return {
      errors,
    };
  }

  checkEventDataForValidationErrors(
    grammarContent: string,
    dataContent: string,
  ): SingleFileValidationResponse {
    const eventDataValidator = new EventDataValidator(
      grammarContent,
      dataContent,
    );

    const errors = eventDataValidator.verify();
    return {
      errors,
    };
  }

  async handleZipFile(zipFilePath: string) {
    // unzip the file first
    const errors = {
      dimensions: {},
      programs: {},
    };

    // TODO: validate zips folder structure
    if (fs.existsSync('mount')) fs.rmdirSync('mount', { recursive: true });
    fs.mkdirSync('mount');
    await decompress(zipFilePath, 'mount');

    function getFileType(filePath) {
      const stat = fs.statSync(filePath);
      return stat.isFile()
        ? 'file'
        : stat.isDirectory()
        ? 'directory'
        : 'unknown';
    }
    function getFilesWithTypes(directoryPath) {
      const files = fs.readdirSync(directoryPath);

      const filesWithTypes = {};
      files.forEach((file) => {
        const filePath = path.join(directoryPath, file);
        const fileType = getFileType(filePath);
        filesWithTypes[file] = fileType;
      });

      return filesWithTypes;
    }

    const filesWithTypes = getFilesWithTypes('./mount');
    if (filesWithTypes['config.json'] !== 'file')
      throw new BadRequestException('config.json is required in zip');
    if (filesWithTypes['dimensions'] !== 'directory')
      throw new BadRequestException('config.json is required required in zip');
    if (filesWithTypes['programs'] !== 'directory')
      throw new BadRequestException('config.json is required required in zip');

    const config = JSON.parse(fs.readFileSync('./mount/config.json', 'utf-8'));

    errors.dimensions =
      this.handleDimensionFolderValidation('./mount/dimensions');

    const programValidationResponse =
      this.handleProgramsFolderValidation(config);
    errors.programs = programValidationResponse.errors;

    fs.rmdirSync('mount', { recursive: true });
    return { errors, warnings: programValidationResponse.warnings };
  }

  handleDimensionFolderValidation(folderPath: string) {
    const regexDimensionGrammar = /\-dimension\.grammar.csv$/i;
    const inputFilesForDimensions = fs.readdirSync(folderPath);

    const errors = {
      grammar: {},
      data: {},
    };

    for (let i = 0; i < inputFilesForDimensions.length; i++) {
      const grammarErrors = [];
      const dataErrors = [];

      if (regexDimensionGrammar.test(inputFilesForDimensions[i])) {
        const currentDimensionGrammarFileName =
          folderPath + `/${inputFilesForDimensions[i]}`;
        const dimensionDataFileName = currentDimensionGrammarFileName.replace(
          'grammar',
          'data',
        );

        this.logger.debug(
          'currentDimensionGrammarFileName: ',
          currentDimensionGrammarFileName,
        );

        this.logger.debug('dimensionDataFileName: ', dimensionDataFileName);

        const grammarContent = fs.readFileSync(
          currentDimensionGrammarFileName,
          'utf-8',
        );
        if (!fs.existsSync(dimensionDataFileName)) {
          dataErrors.push(
            `Warning: Data file missing for dimension grammar ${currentDimensionGrammarFileName}`,
          );
        } else {
          const dataContent = fs.readFileSync(dimensionDataFileName, 'utf-8');
          dataErrors.push(
            ...this.checkDimensionDataForValidationErrors(
              grammarContent,
              dataContent,
            ).errors,
          );
        }
        grammarErrors.push(
          ...this.checkDimensionGrammarForValidationErrors(grammarContent)
            .errors,
        );

        errors.grammar[inputFilesForDimensions[i]] = grammarErrors;
        errors.data[inputFilesForDimensions[i].replace('grammar', 'data')] =
          dataErrors;
      }
    }

    return errors;
  }

  handleProgramsFolderValidation(config) {
    const regexEventGrammar = /\-event\.grammar.csv$/i;
    const errors = {};
    const warnings = [];

    this.logger.debug('config: ', config);

    for (let i = 0; i < config?.programs.length; i++) {
      const programName = config?.programs[i]?.name;
      const programErrors = {
        grammar: {},
        data: {},
      };

      const inputFiles = fs.readdirSync(config?.programs[i].input?.files);
      // iterating over all the files in the program folder
      for (let j = 0; j < inputFiles.length; j++) {
        const grammarErrors = [];
        const dataErrors = [];
        if (regexEventGrammar.test(inputFiles[j])) {
          const currentEventGrammarFilePath =
            config?.programs[i].input?.files + `/${inputFiles[j]}`;
          const eventGrammarContent = fs.readFileSync(
            currentEventGrammarFilePath,
            'utf-8',
          );

          grammarErrors.push(
            ...this.checkEventGrammarForValidationErrors(eventGrammarContent)
              .errors,
          );

          // programErrors.grammar[inputFiles[j]] = {
          // eventGrammarContent,
          //   grammarErrors,
          // };

          programErrors.grammar[inputFiles[j]] = grammarErrors;

          const dataFilePath = currentEventGrammarFilePath.replace(
            'grammar',
            'data',
          );

          if (!fs.existsSync(dataFilePath)) {
            warnings.push(
              `Warning: Data file missing for dimension grammar ${currentEventGrammarFilePath}`,
            );
          } else {
            const eventContent = fs.readFileSync(dataFilePath, 'utf-8');
            dataErrors.push(
              ...this.checkEventDataForValidationErrors(
                eventGrammarContent,
                eventContent,
              ).errors,
            );
            // programErrors.data[inputFiles[j].replace('grammar', 'data')] = {
            //   eventDataContent: eventContent,
            //   dataErrors,
            // };
            programErrors.data[inputFiles[j].replace('grammar', 'data')] =
              dataErrors;
          }
        }
      }

      errors[programName] = programErrors;
    }

    return { errors, warnings };
  }
}
