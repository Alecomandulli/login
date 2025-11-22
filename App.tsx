
import React, { useState, useMemo, useEffect } from 'react';
import { ChecklistItem } from './components/ChecklistItem';
import { ProblemAnalyzer } from './components/ProblemAnalyzer';
import { CHECKLIST_ITEMS } from './constants';
import { ChecklistItemType } from './types';

// TypeScript declarations for jsPDF libraries loaded from CDN
declare const jspdf: any;

interface ItemState {
    status: 'ok' | 'defect';
    description: string;
    image?: string; // Base64 encoded image
}

interface HistoryRecord {
    id: string;
    savedAt: string; // ISO Date string for sorting
    condutor: string;
    data: string; // Input date
    turno: string;
    vtr: string;
    itemStates: Record<number, ItemState>;
    defectsCount: number;
}

// Componentes definidos fora do App para evitar re-renderizações desnecessárias
const TabButton: React.FC<{
    tabId: string;
    label: string;
    activeTab: string;
    onClick: (tab: any) => void;
    icon?: React.ReactNode;
}> = ({ tabId, label, activeTab, onClick, icon }) => (
    <button
        onClick={() => onClick(tabId)}
        className={`flex-1 py-3 px-2 text-sm sm:text-lg font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-2 ${activeTab === tabId ? 'bg-gray-800 text-cyan-400' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'}`}
    >
        {icon}
        {label}
    </button>
);

const InfoInput: React.FC<{
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    readOnly?: boolean;
}> = ({ id, label, type = 'text', value, onChange, placeholder, readOnly }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full bg-gray-900 rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-white ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
    </div>
);

const App: React.FC = () => {
    // App State
    const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
    const [activeTab, setActiveTab] = useState<'checklist' | 'analyzer' | 'history'>('checklist');
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    
    const [condutor, setCondutor] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [turno, setTurno] = useState('');
    const [vtr, setVtr] = useState('');

    // Load data state from localStorage on initial render
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('ambulanceChecklistData');
            if (savedData) {
                const { itemStates: savedItems, headerData } = JSON.parse(savedData);
                setItemStates(savedItems || {});
                if (headerData) {
                    if (headerData.condutor) setCondutor(headerData.condutor);
                    setData(headerData.data || new Date().toISOString().split('T')[0]);
                    setTurno(headerData.turno || '');
                    setVtr(headerData.vtr || '');
                }
            }

            const savedHistory = localStorage.getItem('ambulanceChecklistHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []); 

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            const dataToSave = {
                itemStates,
                headerData: { condutor, data, turno, vtr }
            };
            localStorage.setItem('ambulanceChecklistData', JSON.stringify(dataToSave));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }, [itemStates, condutor, data, turno, vtr]);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('ambulanceChecklistHistory', JSON.stringify(history));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    }, [history]);

    const handleSetStatus = (id: number, status: 'ok' | 'defect') => {
        setItemStates(prev => {
            const newStates = { ...prev };
            if (newStates[id]?.status === status) {
                delete newStates[id];
            } else {
                newStates[id] = { status, description: newStates[id]?.description || '', image: newStates[id]?.image };
            }
            return newStates;
        });
    };
    
    const handleDescriptionChange = (id: number, description: string) => {
        setItemStates(prev => {
            if (prev[id]?.status === 'defect') {
                const newStates = { ...prev };
                newStates[id] = { ...newStates[id], description };
                return newStates;
            }
            return prev;
        });
    };

    const handleImageChangeForItem = (id: number, file: File | null) => {
        if (!file) {
            setItemStates(prev => {
                const newStates = { ...prev };
                if (newStates[id]) {
                    delete newStates[id].image;
                }
                return newStates;
            });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Image = reader.result as string;
            setItemStates(prev => {
                const newStates = { ...prev };
                if (newStates[id]) {
                    newStates[id] = { ...newStates[id], image: base64Image };
                }
                return newStates;
            });
        };
        reader.onerror = (error) => {
            console.error("Error converting file to base64", error);
        };
    };

    const saveToHistory = () => {
        if (!condutor || !vtr) {
            alert("Por favor, preencha o nome do condutor e o número da VTR para salvar no histórico.");
            return;
        }

        const defectsCount = Object.values(itemStates).filter((s: ItemState) => s.status === 'defect').length;
        
        const newRecord: HistoryRecord = {
            id: Date.now().toString(),
            savedAt: new Date().toISOString(),
            condutor,
            data,
            turno,
            vtr,
            itemStates: { ...itemStates },
            defectsCount
        };

        setHistory(prev => [newRecord, ...prev]);
        
        if (window.confirm("Checklist salvo no histórico com sucesso! Deseja limpar o formulário para um novo checklist?")) {
            setItemStates({});
            // Keep condutor and turno, usually they don't change instantly
            setVtr('');
        } else {
            setActiveTab('history');
        }
    };

    const deleteHistoryItem = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este registro do histórico?")) {
            setHistory(prev => prev.filter(item => item.id !== id));
        }
    };

    const groupedItems = useMemo(() => {
        return CHECKLIST_ITEMS.reduce<Record<string, ChecklistItemType[]>>((acc, item) => {
            const category = item.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});
    }, []);
    
    const completionPercentage = Math.round((Object.keys(itemStates).length / CHECKLIST_ITEMS.length) * 100);

    const generatePDFReport = (historyRecord?: HistoryRecord) => {
        // Determine which data to use: current state or history record
        const reportCondutor = historyRecord ? historyRecord.condutor : condutor;
        const reportData = historyRecord ? historyRecord.data : data;
        const reportTurno = historyRecord ? historyRecord.turno : turno;
        const reportVtr = historyRecord ? historyRecord.vtr : vtr;
        const reportItemStates = historyRecord ? historyRecord.itemStates : itemStates;

        const reportCompletionPercentage = Math.round((Object.keys(reportItemStates).length / CHECKLIST_ITEMS.length) * 100);

        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text("Relatório de Vistoria de Ambulância", 105, 20, { align: 'center' });
        
        // Header Info
        doc.setFontSize(12);
        doc.text(`Condutor: ${reportCondutor || 'Não informado'}`, 14, 35);
        doc.text(`Data: ${reportData}`, 14, 42);
        doc.text(`Turno: ${reportTurno || 'Não informado'}`, 105, 35);
        doc.text(`Nº VTR: ${reportVtr || 'Não informada'}`, 105, 42);
        
        doc.setFontSize(14);
        doc.text(`Progresso do Checklist: ${reportCompletionPercentage}%`, 14, 55);

        const tableBody: any[] = [];
        for (const [category, items] of Object.entries(groupedItems) as [string, ChecklistItemType[]][]) {
            tableBody.push([{ content: category, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [22, 163, 163] } }]);
            for (const item of items) {
                const state = reportItemStates[item.id] as ItemState | undefined;
                const status = state ? (state.status === 'ok' ? 'OK' : 'Defeito') : 'Não verificado';
                const description = state?.status === 'defect' ? state.description : '';
                tableBody.push([item.label, status, description]);
            }
        }

        (doc as any).autoTable({
            startY: 65,
            head: [['Item de Verificação', 'Status', 'Observações']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            didDrawCell: (data: any) => {
                if (data.section === 'body' && data.column.index === 1) {
                    if (data.cell.raw === 'OK') {
                        data.cell.styles.textColor = [0, 128, 0];
                    } else if (data.cell.raw === 'Defeito') {
                        data.cell.styles.textColor = [255, 0, 0];
                    }
                }
            }
        });

        // --- Signatures Section ---
        let finalY = (doc as any).lastAutoTable.finalY + 30;
        const pageHeight = doc.internal.pageSize.height;

        if (finalY + 40 > pageHeight) {
            doc.addPage();
            finalY = 40;
        }

        doc.setLineWidth(0.5);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); 

        // Driver Signature
        doc.line(20, finalY, 90, finalY);
        doc.text(`Condutor: ${reportCondutor || ''}`, 20, finalY + 5);

        // Supervisor Signature
        doc.line(120, finalY, 190, finalY);
        doc.text("Supervisor Responsável", 120, finalY + 5);
        // --------------------------

        const itemsWithImages = CHECKLIST_ITEMS.filter(item => reportItemStates[item.id]?.image);
        if (itemsWithImages.length > 0) {
            doc.addPage();
            let currentY = 20;
            doc.setFontSize(16);
            doc.text("Anexos: Imagens de Defeitos", 105, currentY, { align: 'center' });
            currentY += 15;

            for (const item of itemsWithImages) {
                const state = reportItemStates[item.id];
                if (!state || !state.image) continue;

                if (currentY > 190) { 
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Item: ${item.label}`, 14, currentY);
                currentY += 7;

                try {
                    const imgProps = doc.getImageProperties(state.image);
                    const imgWidth = 100;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                    
                    doc.addImage(state.image, imgProps.fileType, 14, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 15;
                } catch (e) {
                    console.error("Error adding image to PDF:", e);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(255, 0, 0);
                    doc.text("Erro ao carregar imagem.", 14, currentY);
                    doc.setTextColor(0, 0, 0);
                    currentY += 10;
                }
            }
        }

        const fileName = `relatorio-vtr-${reportVtr || 'desconhecida'}-${reportData}.pdf`;
        doc.save(fileName);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 shadow-lg shadow-black/20">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Checklist Ambulância
                        </h1>
                        <p className="text-gray-400 text-xs sm:text-sm">
                            Sistema de Vistoria Inteligente
                        </p>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

                <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                    <TabButton 
                        tabId="checklist" 
                        label="Checklist" 
                        activeTab={activeTab} 
                        onClick={setActiveTab} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                    />
                    <TabButton 
                        tabId="analyzer" 
                        label="IA Mecânico" 
                        activeTab={activeTab} 
                        onClick={setActiveTab}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                    />
                    <TabButton 
                        tabId="history" 
                        label="Histórico" 
                        activeTab={activeTab} 
                        onClick={setActiveTab}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>
                
                {/* Header Inputs - Only visible on checklist tab to avoid clutter */}
                {activeTab === 'checklist' && (
                    <div className="bg-gray-800 p-4 rounded-xl shadow-lg mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoInput id="condutor" label="Condutor" value={condutor} onChange={(e) => setCondutor(e.target.value)} placeholder="Nome do condutor" />
                            <InfoInput id="data" label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                            <InfoInput id="turno" label="Turno" value={turno} onChange={(e) => setTurno(e.target.value)} placeholder="Ex: Dia, Noite" />
                            <InfoInput id="vtr" label="Nº VTR" value={vtr} onChange={(e) => setVtr(e.target.value)} placeholder="Ex: USA-01" />
                        </div>
                    </div>
                )}

                <div className={activeTab === 'checklist' ? 'block' : 'hidden'}>
                     <div className="my-6">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-gray-300">Progresso</span>
                           <span className="font-bold text-cyan-400">{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                        </div>
                    </div>
                
                    {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="mb-8">
                            <h2 className="text-xl font-semibold text-cyan-400 border-b-2 border-cyan-800/50 pb-2 mb-4">{category}</h2>
                            {(items as ChecklistItemType[]).map(item => (
                                <ChecklistItem
                                    key={item.id}
                                    id={item.id}
                                    label={item.label}
                                    state={itemStates[item.id]}
                                    onSetStatus={(status) => handleSetStatus(item.id, status)}
                                    onDescriptionChange={(description) => handleDescriptionChange(item.id, description)}
                                    onImageChange={(file) => handleImageChangeForItem(item.id, file)}
                                />
                            ))}
                        </div>
                    ))}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <button
                            onClick={saveToHistory}
                            className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Salvar/Finalizar
                        </button>
                         <button
                            onClick={() => generatePDFReport()}
                            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Baixar PDF
                        </button>
                        <button
                            onClick={() => { if (window.confirm('Tem certeza que deseja limpar todo o checklist atual?')) { setItemStates({}); setTurno(''); setVtr(''); } }}
                            className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                            </svg>
                            Limpar
                        </button>
                    </div>
                </div>

                <div className={activeTab === 'analyzer' ? 'block' : 'hidden'}>
                    <ProblemAnalyzer />
                </div>
                
                <div className={activeTab === 'history' ? 'block' : 'hidden'}>
                    <h2 className="text-2xl font-bold text-cyan-400 mb-6">Histórico de Checklists</h2>
                    {history.length === 0 ? (
                        <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700">
                            <p className="text-gray-400 text-lg">Nenhum checklist salvo no histórico.</p>
                            <p className="text-gray-500 text-sm mt-2">Finalize um checklist na aba principal para salvá-lo aqui.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map(record => (
                                <div key={record.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2 py-1 bg-blue-900 text-blue-200 text-xs font-bold rounded-md border border-blue-700">VTR {record.vtr || '---'}</span>
                                            <span className="text-gray-300 text-sm font-mono">{new Date(record.data).toLocaleDateString('pt-BR')}</span>
                                            <span className="text-gray-500 text-xs">Salvo em: {new Date(record.savedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="text-white font-semibold text-lg mb-1">
                                            Condutor: <span className="font-normal text-gray-300">{record.condutor || 'Não informado'}</span>
                                        </div>
                                        <div className="text-sm text-gray-400 mb-2">
                                            Turno: {record.turno || 'N/A'}
                                        </div>
                                        <div className="flex items-center">
                                             {record.defectsCount > 0 ? (
                                                <span className="flex items-center text-red-400 text-sm font-medium">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                    {record.defectsCount} defeito(s) relatado(s)
                                                </span>
                                             ) : (
                                                <span className="flex items-center text-green-400 text-sm font-medium">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                                    Nenhum defeito
                                                </span>
                                             )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <button 
                                            onClick={() => generatePDFReport(record)}
                                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Baixar PDF"
                                        >
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={() => deleteHistoryItem(record.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Excluir registro"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default App;
