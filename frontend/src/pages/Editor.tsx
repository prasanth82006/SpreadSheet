import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useStore } from '../store';
import { fetchDocument } from '../services/api';
import Grid from '../components/Grid';
import FormulaBar from '../components/FormulaBar';
import PresenceList from '../components/PresenceList';
import { ArrowLeft, CheckCircle, CloudUpload, Bold, Italic, Download } from 'lucide-react';
import { exportToCSV, exportToJSON, exportToXLSX } from '../utils/exportUtils';

export default function Editor() {
     const { docId } = useParams();
     const navigate = useNavigate();
     const { 
          user, setCell, setCells, isSaving, docTitle, 
          setDocTitle, setCollaborators, formatting, setFormat, setAllFormatting,
          setColumnWidth, setRowHeight, setAllLayout, cells,
          setColumnOrder, setRowOrder, setAllOrder
     } = useStore();
     
     const [activeCell, setActiveCell] = useState<string | null>(null);
     const [isEditingTitle, setIsEditingTitle] = useState(false);

     useEffect(() => {
          if (!user) {
               navigate('/login');
               return;
          }

          if (docId) {
               // Load initial data
               fetchDocument(docId).then(doc => {
                    setDocTitle(doc.title);
                    if (doc.data) {
                         const cellData: Record<string, string> = {};
                         Object.entries(doc.data).forEach(([key, val]) => {
                              cellData[key] = val as string;
                         });
                         setCells(cellData);
                    }
                    if (doc.formatting) {
                         setAllFormatting(doc.formatting);
                    }
                    if (doc.columnWidths || doc.rowHeights) {
                         setAllLayout(doc.columnWidths || {}, doc.rowHeights || {});
                    }
                    if (doc.columnOrder || doc.rowOrder) {
                         setAllOrder(doc.columnOrder || [], doc.rowOrder || []);
                    }
               }).catch(console.error);

               // Socket connection management
               if (!socket.connected) {
                    socket.connect();
               }
               
               socket.emit('join-document', { docId, user });

               const onDocumentUpdate = (updatedCells: any) => {
                    Object.entries(updatedCells).forEach(([id, val]) => {
                         setCell(id, val as string);
                    });
               };

               const onTitleUpdate = (newTitle: string) => {
                    setDocTitle(newTitle);
               };

               const onUserListUpdate = (users: any) => {
                    setCollaborators(users);
               };

               const onFormatUpdate = (updatedFormats: any) => {
                    Object.entries(updatedFormats).forEach(([id, format]) => {
                         setFormat(id, format);
                    });
               };

               const onColumnResizeUpdate = ({ colIndex, width }: any) => {
                    setColumnWidth(colIndex, width);
               };

               const onRowResizeUpdate = ({ rowIndex, height }: any) => {
                    setRowHeight(rowIndex, height);
               };

               const onColumnReorderUpdate = (order: number[]) => {
                    setColumnOrder(order);
               };

               const onRowReorderUpdate = (order: number[]) => {
                    setRowOrder(order);
               };

               socket.on('document-update', onDocumentUpdate);
               socket.on('title-update', onTitleUpdate);
               socket.on('user-list-update', onUserListUpdate);
               socket.on('format-update', onFormatUpdate);
               socket.on('column-resize-update', onColumnResizeUpdate);
               socket.on('row-resize-update', onRowResizeUpdate);
               socket.on('column-reorder-update', onColumnReorderUpdate);
               socket.on('row-reorder-update', onRowReorderUpdate);

               return () => {
                    socket.off('document-update', onDocumentUpdate);
                    socket.off('title-update', onTitleUpdate);
                    socket.off('user-list-update', onUserListUpdate);
                    socket.off('format-update', onFormatUpdate);
                    socket.off('column-resize-update', onColumnResizeUpdate);
                    socket.off('row-resize-update', onRowResizeUpdate);
                    socket.off('column-reorder-update', onColumnReorderUpdate);
                    socket.off('row-reorder-update', onRowReorderUpdate);
                    socket.disconnect();
               };
          }
     }, [docId, user?.email, navigate]);
 // Use user.email as a stable identifier instead of the whole object

     const handleTitleChange = (newTitle: string) => {
          setDocTitle(newTitle);
          if (docId) {
               socket.emit('title-change', { docId, title: newTitle });
          }
     };

     const handleFormatChange = (format: any) => {
          if (!activeCell || !docId) return;
          setFormat(activeCell, format);
          socket.emit('format-change', { docId, cellId: activeCell, format });
     };

     const activeFormatting = activeCell ? (formatting[activeCell] || {}) : {};

     if (!user) return null;

     return (
          <div className="flex flex-col h-screen bg-white">
               <header className="flex items-center justify-between p-2 border-b bg-zinc-50">
                    <div className="flex items-center gap-4">
                         <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-200 rounded-full">
                              <ArrowLeft size={20} />
                         </button>
                         <div className="flex flex-col">
                              {isEditingTitle ? (
                                   <input
                                        className="text-lg font-bold bg-white border border-blue-500 rounded px-2 py-0.5 outline-none shadow-sm"
                                        value={docTitle}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        onBlur={() => setIsEditingTitle(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                        autoFocus
                                   />
                              ) : (
                                   <h2 
                                        className="text-lg font-bold cursor-pointer hover:bg-zinc-200 rounded px-2 py-0.5 transition-colors"
                                        onClick={() => setIsEditingTitle(true)}
                                   >
                                        {docTitle || 'Untitled Spreadsheet'}
                                   </h2>
                              )}
                              <div className="flex items-center gap-1.5 px-2 text-[10px] text-zinc-500">
                                   {isSaving ? (
                                        <>
                                             <CloudUpload size={12} className="text-blue-500 animate-pulse" />
                                             <span>Saving changes...</span>
                                        </>
                                   ) : (
                                        <>
                                             <CheckCircle size={12} className="text-green-600" />
                                             <span>All changes saved to MongoDB</span>
                                        </>
                                   )}
                              </div>
                         </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="relative group">
                              <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors shadow-sm">
                                   <Download size={14} />
                                   Download
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-zinc-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                                   <button 
                                        onClick={() => exportToCSV(cells, docTitle)}
                                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-zinc-700 hover:bg-zinc-100 transition-colors border-b border-zinc-100"
                                   >
                                        CSV (.csv)
                                   </button>
                                   <button 
                                        onClick={() => exportToXLSX(cells, docTitle)}
                                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-zinc-700 hover:bg-zinc-100 transition-colors border-b border-zinc-100"
                                   >
                                        Excel (.xlsx)
                                   </button>
                                   <button 
                                        onClick={() => exportToJSON(cells, docTitle)}
                                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
                                   >
                                        JSON (.json)
                                   </button>
                              </div>
                         </div>
                         <PresenceList />
                         <div className="h-8 w-[1px] bg-zinc-200" />
                         <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Created by</span>
                                   <span className="text-xs font-semibold text-zinc-700">Prasanth Kumar</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                   <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                                        style={{ backgroundColor: user?.color || '#2563EB' }}
                                   >
                                        {user?.name?.[0].toUpperCase()}
                                   </div>
                                   <span className="text-[10px] text-zinc-500">{user?.name}</span>
                              </div>
                         </div>
                    </div>
               </header>

               {/* Formatting Toolbar */}
               <div className="flex items-center gap-1 p-1 bg-zinc-50 border-b overflow-x-auto no-scrollbar">
                    <button 
                         onClick={() => handleFormatChange({ bold: !activeFormatting.bold })}
                         className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${activeFormatting.bold ? 'bg-zinc-300 text-blue-600 shadow-inner' : 'text-zinc-600'}`}
                         title="Bold"
                    >
                         <Bold size={16} />
                    </button>
                    <button 
                         onClick={() => handleFormatChange({ italic: !activeFormatting.italic })}
                         className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${activeFormatting.italic ? 'bg-zinc-300 text-blue-600 shadow-inner' : 'text-zinc-600'}`}
                         title="Italic"
                    >
                         <Italic size={16} />
                    </button>
                    <div className="w-px h-4 bg-zinc-300 mx-1" />
                    <div className="flex items-center gap-2 px-2 border-r pr-4">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Text</label>
                         <input 
                              type="color" 
                              className="w-5 h-5 p-0 border-none bg-transparent cursor-pointer"
                              value={activeFormatting.color || '#000000'}
                              onChange={(e) => handleFormatChange({ color: e.target.value })}
                         />
                    </div>
                    <div className="flex items-center gap-2 px-2">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Bg</label>
                         <input 
                              type="color" 
                              className="w-5 h-5 p-0 border-none bg-transparent cursor-pointer"
                              value={activeFormatting.bgColor || '#ffffff'}
                              onChange={(e) => handleFormatChange({ bgColor: e.target.value })}
                         />
                    </div>
               </div>

               <FormulaBar activeCell={activeCell} />

               <div className="flex-1 overflow-hidden bg-zinc-100 p-4">
                    <div className="bg-white shadow-sm ring-1 ring-zinc-200 h-full">
                         <Grid activeCell={activeCell} setActiveCell={setActiveCell} docId={docId!} />
                    </div>
               </div>
          </div>
     );
}
