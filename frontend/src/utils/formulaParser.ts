export const evaluateFormula = (formula: string, cells: Record<string, string>, seen: Set<string> = new Set()): string => {
     if (!formula.startsWith('=')) return formula;

     let expression = formula.trim().substring(1).trim().toUpperCase();

     // Auto-close parentheses if missing
     const openP = (expression.match(/\(/g) || []).length;
     const closeP = (expression.match(/\)/g) || []).length;
     if (openP > closeP) {
          expression += ')'.repeat(openP - closeP);
     }

     const resolveRef = (ref: string): number => {
          if (seen.has(ref)) return 0;
          const cellValue = (cells[ref] || '').trim();
          if (cellValue.startsWith('=')) {
               const newSeen = new Set(seen);
               newSeen.add(ref);
               const evaluated = evaluateFormula(cellValue, cells, newSeen);
               const parsed = parseFloat(evaluated);
               return isNaN(parsed) ? 0 : parsed;
          }
          const parsed = parseFloat(cellValue);
          return isNaN(parsed) ? 0 : parsed;
     };

     const getEvaluatedRange = (range: string): number[] => {
          const [start, end] = range.split(':').map(s => s.trim());
          if (!start || !end) return [];
          const startMatch = start.match(/([A-Z]+)([0-9]+)/);
          const endMatch = end.match(/([A-Z]+)([0-9]+)/);
          if (!startMatch || !endMatch) return [];

          const startCol = startMatch[1];
          const startRow = parseInt(startMatch[2]);
          const endCol = endMatch[1];
          const endRow = parseInt(endMatch[2]);

          const result: number[] = [];
          for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
               for (let c = Math.min(colToNumber(startCol), colToNumber(endCol)); c <= Math.max(colToNumber(startCol), colToNumber(endCol)); c++) {
                    const cellId = `${numberToCol(c)}${r}`;
                    result.push(resolveRef(cellId));
               }
          }
          return result;
     };

     let evalStr = expression;

     // 1. Handle Functions: SUM, AVG, MEAN, PRODUCT, DIVIDE, MULTIPLY, MIN, MAX
  evalStr = evalStr.replace(/(SUM|AVG|MEAN|PRODUCT|DIVIDE|MULTIPLY|MIN|MAX)\(([^)]*)\)/g, (_match, fn, args) => {
    let values: number[] = [];
    if (!args.trim()) return '0';
    
    if (args.includes(':')) {
      values = getEvaluatedRange(args);
      if (values.length === 0) return '#INVALID_REF';
    } else {
      values = args.split(',').map((a: string) => resolveRef(a.trim()));
    }

    switch (fn) {
      case 'SUM':
        return values.reduce((a, b) => a + b, 0).toString();
      case 'AVG':
      case 'MEAN':
        return values.length === 0 ? '0' : (values.reduce((a, b) => a + b, 0) / values.length).toString();
      case 'PRODUCT':
        return values.reduce((a, b) => a * b, 1).toString();
      case 'MULTIPLY':
        return (values[0] * (values[1] ?? 1)).toString();
      case 'DIVIDE':
        if (values[1] === 0) return '#DIV/0';
        return (values[0] / (values[1] ?? 1)).toString();
      case 'MIN':
        return values.length === 0 ? '0' : Math.min(...values).toString();
      case 'MAX':
        return values.length === 0 ? '0' : Math.max(...values).toString();
      default:
        return '0';
    }
  });

  // 2. Resolve remaining Cell References
  evalStr = evalStr.replace(/([A-Z]+[0-9]+)/g, (match) => {
    const val = resolveRef(match);
    return val.toString();
  });

  // 3. Final Arithmetic Evaluation
  try {
    // Check for explicit division by /0
    if (/\/\s*0(?![0-9.])/.test(evalStr)) return '#DIV/0';

    // Basic sanitization
    if (!/^[0-9+\-*/(). ]+$/.test(evalStr)) return '#ERROR';
    
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${evalStr}`)();
    if (!Number.isFinite(result)) return '#ERROR';
    return result.toString();
  } catch {
    return '#ERROR';
  }
};

const colToNumber = (col: string): number => {
     let num = 0;
     for (let i = 0; i < col.length; i++) {
          num = num * 26 + (col.charCodeAt(i) - 64);
     }
     return num;
};

const numberToCol = (num: number): string => {
     let col = '';
     while (num > 0) {
          let rem = num % 26;
          if (rem === 0) {
               col = 'Z' + col;
               num = Math.floor(num / 26) - 1;
          } else {
               col = String.fromCharCode(rem + 64) + col;
               num = Math.floor(num / 26);
          }
     }
     return col;
};
