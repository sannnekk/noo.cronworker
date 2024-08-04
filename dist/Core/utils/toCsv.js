export function toCsv(header, rows) {
    const headerRow = header.join(',');
    const rowsStr = rows
        .map((row) => header.map((key) => row[key]).join(','))
        .join('\n');
    return `${headerRow}\n${rowsStr}`;
}
