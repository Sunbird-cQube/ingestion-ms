export type ValidationErrors = {
  row: string | number;
  col: string | number;
  errorCode: number;
  error: string;
  data?: any;
};
