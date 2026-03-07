import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDocuments, createDocument } from '../services/api';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { useStore } from '../store';

export default function Home() {
  const [documents, setDocuments] = useState<{ _id: string; title: string; updatedAt: string }[]>([]);
  const { user, logout } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDocuments().then(setDocuments).catch(console.error);
  }, [user, navigate]);

  const handleCreate = async () => {
    try {
      const doc = await createDocument('Untitled Spreadsheet');
      navigate(`/editor/${doc._id}`);
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-zinc-50 to-white">
      {/* Premium Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-zinc-200/50 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-zinc-950">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <FileSpreadsheet className="text-white" size={24} />
              </div>
              <span className="tracking-tight uppercase">Trademarkia Sheets</span>
            </h1>
            <div className="h-6 w-[1px] bg-zinc-200" />
            <div className="flex items-center gap-3 group px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 transition-all hover:bg-blue-100 cursor-default">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white"
                style={{ backgroundColor: user?.color || '#2563EB' }}
              >
                {user?.name?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-blue-600 leading-none">Logged in as</span>
                <span className="text-sm font-semibold text-zinc-800">{user?.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={logout}
              className="text-zinc-500 px-4 py-2 hover:text-zinc-900 rounded-lg text-sm font-bold transition-all"
            >
              Sign Out
            </button>
            <button 
              onClick={handleCreate}
              className="bg-zinc-950 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-zinc-800 font-bold shadow-lg shadow-zinc-200 transition-all active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> Create Sheet
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 pt-12">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2">My Documents</h2>
          <p className="text-zinc-500 font-medium">Manage and collaborate on your technical spreadsheets</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* New Sheet Shadow Card */}
          <div 
            onClick={handleCreate}
            className="group relative bg-white/40 border-2 border-dashed border-zinc-200 rounded-3xl p-8 cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-4 aspect-square"
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-zinc-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-100 transition-all duration-300">
              <Plus size={32} className="text-zinc-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="font-bold text-zinc-400 group-hover:text-blue-600 transition-colors">Start Empty</span>
          </div>

          {documents.map(doc => (
            <div 
              key={doc._id} 
              onClick={() => navigate(`/editor/${doc._id}`)}
              className="group bg-white border border-zinc-200/60 hover:border-white rounded-3xl p-6 cursor-pointer transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] relative flex flex-col hover:-translate-y-2 aspect-square"
            >
              <div className="h-full w-full bg-zinc-50 rounded-2xl mb-6 flex items-center justify-center border border-zinc-100 group-hover:bg-blue-50 transition-colors overflow-hidden">
                <FileSpreadsheet size={64} className="text-zinc-200 group-hover:text-blue-200 group-hover:scale-110 transition-all duration-500" />
              </div>
              <div className="mt-auto">
                <h3 className="font-bold text-zinc-900 truncate group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-zinc-200 group-hover:bg-blue-500 flex transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
