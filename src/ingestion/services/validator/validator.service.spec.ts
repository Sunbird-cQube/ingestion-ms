import { Test, TestingModule } from '@nestjs/testing';
import { ValidatorService } from './validator.service';
import * as fs from 'fs';

describe('ValidatorService', () => {
  let service: ValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidatorService],
    }).compile();

    service = module.get<ValidatorService>(ValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check a dimension data file with no errors', async () => {
    const grammarContent = fs.readFileSync(
      './src/admin/fixtures/academicyear-dimension.grammar.csv',
      'utf8',
    );
    const dataContent = fs.readFileSync(
      './src/admin/fixtures/academicyear-dimension.data.csv',
      'utf8',
    );

    const resp = service.checkDimensionDataForValidationErrors(
      grammarContent,
      dataContent,
    );

    expect(resp.errors).toBeInstanceOf(Array);
    expect(resp.errors.length).toBe(0);
  });

  it('should check a dimension grammar file with no errors', async () => {
    const grammarContent = fs.readFileSync(
      './src/admin/fixtures/academicyear-dimension.grammar.csv',
      'utf8',
    );

    const resp =
      service.checkDimensionGrammarForValidationErrors(grammarContent);

    expect(resp.errors).toBeInstanceOf(Array);
    expect(resp.errors.length).toBe(0);
  });

  it('should throw with a wrong data file', () => {
    const grammarContent = fs.readFileSync(
      './src/admin/fixtures/avgplaytime-event.grammar.csv',
      'utf8',
    );
    const dataContent = fs.readFileSync(
      './src/admin/fixtures/avgplaytime-event.data.csv',
      'utf8',
    );
    const resp = service.checkDimensionDataForValidationErrors(
      grammarContent,
      dataContent,
    );
    expect(resp).toEqual({
      errors: [
        {
          row: 1,
          col: 0,
          errorCode: 1001,
          error: 'Missing header from grammar file: string',
        },
        {
          row: 1,
          col: 1,
          errorCode: 1001,
          error: 'Missing header from grammar file: string',
        },
        {
          row: 1,
          col: 2,
          errorCode: 1001,
          error: 'Missing header from grammar file: string',
        },
        {
          row: 1,
          col: 3,
          errorCode: 1001,
          error: 'Missing header from grammar file: integer',
        },
        {
          row: 1,
          col: 0,
          errorCode: 1001,
          error: 'Extra header not in grammar file: state_id',
        },
        {
          row: 1,
          col: 1,
          errorCode: 1001,
          error: 'Extra header not in grammar file: grade_diksha',
        },
        {
          row: 1,
          col: 2,
          errorCode: 1001,
          error: 'Extra header not in grammar file: subject_diksha',
        },
        {
          row: 1,
          col: 3,
          errorCode: 1001,
          error:
            'Extra header not in grammar file: avg_play_time_in_mins_on_app_and_portal',
        },
      ],
    });
  });

  it('should check a valid event grammar file', () => {
    const grammarContent = fs.readFileSync(
      './src/admin/fixtures/avgplaytime-event.grammar.csv',
      'utf8',
    );

    const resp = service.checkEventGrammarForValidationErrors(grammarContent);

    expect(resp.errors).toBeInstanceOf(Array);
    expect(resp.errors.length).toBe(0);
  });

  it('should check a valid event data file', () => {
    const grammarContent = fs.readFileSync(
      './src/admin/fixtures/avgplaytime-event.grammar.csv',
      'utf8',
    );
    const dataContent = fs.readFileSync(
      './src/admin/fixtures/avgplaytime-event.data.csv',
      'utf8',
    );

    const resp = service.checkEventDataForValidationErrors(
      grammarContent,
      dataContent,
    );

    expect(resp.errors).toBeInstanceOf(Array);
    expect(resp.errors.length).toBe(0);
  });
});
