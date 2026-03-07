import { useStore } from '../store';

interface FormulaBarProps {
  activeCell: string | null;
}

export default function FormulaBar({ activeCell }: FormulaBarProps) {
  const { cells, setCell } = useStore();

  const value = activeCell ? (cells[activeCell] || '') : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeCell) {
      setCell(activeCell, e.target.value);
      // In a real app we would throttle the socket emission here too
    }
  };

  return (
    <div className="flex items-center gap-2 border-b bg-white p-2">
      <div className="w-10 min-w-[40px] text-center font-mono font-medium text-xs text-zinc-500 bg-zinc-100 rounded px-1 py-1 border border-zinc-200">
        {activeCell || ' '}
      </div>
      <div className="text-zinc-400 font-bold px-2 italic text-lg px-2 border-r border-zinc-200 border-l border-zinc-200">&fnof;</div>
      <input 
        className="flex-1 px-2 py-1 focus:outline-none placeholder-zinc-400 font-sans"
        value={value}
        onChange={handleChange}
        placeholder="Select a cell to view or edit its contents"
        disabled={!activeCell}
      />
    </div>
  );
}
