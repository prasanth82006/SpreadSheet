import * as XLSX from 'xlsx';

export const exportToCSV = (cells: Record<string, string>, title: string) => {
  const rows: string[][] = [];
  const maxRow = 100;
  const maxCol = 26;

  for (let r = 1; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c < maxCol; c++) {
      const id = `${String.fromCharCode(65 + c)}${r}`;
      row.push(cells[id] || '');
    }
    rows.push(row);
  }

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}.csv`);
  link.click();
};

export const exportToJSON = (cells: Record<string, string>, title: string) => {
  const data = JSON.stringify(cells, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}.json`);
  link.click();
};

export const exportToXLSX = (cells: Record<string, string>, title: string) => {
  const data: string[][] = [];
  const maxRow = 100;
  const maxCol = 26;

  for (let r = 1; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c < maxCol; c++) {
      const id = `${String.fromCharCode(65 + c)}${r}`;
      row.push(cells[id] || '');
    }
    data.push(row);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${title}.xlsx`);
};
