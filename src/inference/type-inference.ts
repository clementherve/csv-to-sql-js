type type = 'double' | 'int' | 'bool' | 'string';

const typesFn: Record<type, (val: string) => Boolean> = {
  double: (value: string) => Number.parseFloat(value).toString() != 'NaN' && value.includes('.'),
  int: (value: string) => Number.parseInt(value).toString() != 'NaN' && !value.includes('.'),
  bool: (value: string) => value.toLowerCase() == 'true' || value.toLowerCase() == 'false',
  string: (_: string) => true,
};

const inferSqlTypeFrom = (value: string): type => {
  return (Object.keys(typesFn) as type[]).find((type: type) => typesFn[type](value)) ?? 'string';
};

export type typedColumns = Record<string, string | undefined>;
export type untypedColumns = Record<string, string[]>;

/**
 * Infers SQL types based on values typing consistency across each column.
 * @param columns Values of each column, referenced by their column's name.
 * @returns A columnsType object, with keys being the name from the header, and the value being a valid SQL type.
 */
export const inferTypeFromData = (columns: untypedColumns): typedColumns => {
  // todo: fixme. this is mssql binding
  const typeGuess: { [index: string]: any } = {
    tinyint: (value: any): boolean => inferSqlTypeFrom(value) === 'bool',
    int: (value: any): boolean => inferSqlTypeFrom(value) === 'int',
    double: (value: any): boolean => inferSqlTypeFrom(value) === 'double',
    text: (value: any): boolean => inferSqlTypeFrom(value) === 'string',
  };
  const types: typedColumns = {};

  Object.keys(columns).forEach((colName: string, i: number): void => {
    if (types[colName] != undefined) return;

    types[colName] = undefined;

    Object.keys(typeGuess).forEach((value: string, index: number): void => {
      const type: string = Object.keys(typeGuess)[index];

      const isTypeConsistent: boolean = columns[colName]
        .filter((value) => value != '')
        .every((value: any): boolean => {
          return typeGuess[type](value);
        });

      types[colName] = isTypeConsistent ? type : types[colName];
    });
  });

  return types;
};
