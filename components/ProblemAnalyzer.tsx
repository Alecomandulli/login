import React, { useState, useEffect, useRef } from 'react';
import { analyzeProblem, getQuickDiagnosis } from '../services/geminiService';
import { AnalysisResult } from '../types';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center my-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
    </div>
);

const RiskBadge: React.FC<{ risk: AnalysisResult['risco'] }> = ({ risk }) => {
    const riskColor =
        risk === 'Alto' ? 'bg-red-600 text-white' :
        risk === 'Médio' ? 'bg-orange-500 text-white' :
        risk === 'Baixo' ? 'bg-green-500 text-white' :
        'bg-gray-500 text-white';

    return <span className={`px-3 py-1 text-sm font-bold rounded-full shadow-sm ${riskColor}`}>{risk}</span>;
};


export const ProblemAnalyzer: React.FC = () => {
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [quickDiagnosis, setQuickDiagnosis] = useState<string | null>(null);
    const [isQuickLoading, setIsQuickLoading] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (description.trim().length <= 15) {
            setQuickDiagnosis(null);
            setIsQuickLoading(false);
            return;
        }

        setIsQuickLoading(true);
        setQuickDiagnosis(null);

        debounceTimeoutRef.current = window.setTimeout(async () => {
            try {
                const diagnosis = await getQuickDiagnosis(description);
                if (diagnosis) {
                    setQuickDiagnosis(diagnosis);
                }
            } catch (e) {
                console.error("Quick diagnosis failed:", e);
            } finally {
                setIsQuickLoading(false);
            }
        }, 1000);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [description]);
    
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
        if (result) setResult(null);
        if (error) setError(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!description && !imageFile) {
            setError('Por favor, forneça uma descrição ou uma imagem do problema.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        setQuickDiagnosis(null);
        setIsQuickLoading(false);
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        try {
            const analysis = await analyzeProblem(description, imageFile);
            setResult(analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-800">Analisador Mecânico IA</h2>
            </div>
            
            <p className="text-gray-600 mb-6">Descreva o problema ou envie uma foto para obter uma análise técnica imediata.</p>
            
            <div className="space-y-4">
                <textarea
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Ex: Barulho estranho vindo do motor ao acelerar..."
                    className="w-full p-4 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-gray-800 text-lg placeholder-gray-400"
                    rows={4}
                />
                
                {(isQuickLoading || quickDiagnosis) && (
                     <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                        <h4 className="font-bold text-blue-800 flex items-center">
                           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                           Diagnóstico Rápido
                           {isQuickLoading && 
                                <svg className="animate-spin ml-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                           }
                        </h4>
                        {quickDiagnosis && <p className="text-blue-900 mt-1 font-medium">{quickDiagnosis}</p>}
                    </div>
                )}

                <div className="flex items-center space-x-4">
                     <label htmlFor="file-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-bold py-2 px-4 rounded-md transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {imageFile ? "Trocar Imagem" : "Adicionar Foto"}
                    </label>
                    <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {imageFile && <span className="text-gray-600 text-sm truncate max-w-[200px]">{imageFile.name}</span>}
                </div>

                {imagePreview && (
                    <div className="mt-4 p-2 border rounded-lg bg-gray-50 inline-block">
                        <img src={imagePreview} alt="Preview do problema" className="max-h-60 rounded-lg" />
                    </div>
                )}
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center shadow-lg text-lg"
            >
                {isLoading ? 'Consultando Especialista IA...' : 'ANALISAR PROBLEMA AGORA'}
            </button>

            {isLoading && <LoadingSpinner />}
            {error && <p className="mt-4 text-red-700 bg-red-100 border border-red-200 p-3 rounded-md font-medium">{error}</p>}
            
            {result && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-6 shadow-inner">
                    <h3 className="text-2xl font-bold text-gray-900 border-b pb-2">Resultado da Análise</h3>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h4 className="font-bold text-red-600 uppercase text-xs tracking-wider mb-1">Diagnóstico Preliminar</h4>
                        <p className="text-gray-800 text-lg leading-relaxed">{result.diagnostico}</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h4 className="font-bold text-red-600 uppercase text-xs tracking-wider">Nível de Risco:</h4>
                        <RiskBadge risk={result.risco} />
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h4 className="font-bold text-red-600 uppercase text-xs tracking-wider mb-2">Ações Recomendadas</h4>
                        <ul className="space-y-2">
                            {result.acoes.map((action, index) => (
                                <li key={index} className="flex items-start gap-2 text-gray-800">
                                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {action}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};