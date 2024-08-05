export function toCsv(header: string[], rows: any): string {
  const headerRow = header.join(',')
  const rowsStr = rows
    .map((row: any) => header.map((key) => row[key]).join(','))
    .join('\n')

  return `${headerRow}\n${rowsStr}`
}
