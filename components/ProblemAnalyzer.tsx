
import React, { useState, useEffect, useRef } from 'react';
import { analyzeProblem, getQuickDiagnosis } from '../services/geminiService';
import { AnalysisResult } from '../types';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center my-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
    </div>
);

const RiskBadge: React.FC<{ risk: AnalysisResult['risco'] }> = ({ risk }) => {
    const riskColor =
        risk === 'Alto' ? 'bg-red-500' :
        risk === 'Médio' ? 'bg-yellow-500' :
        risk === 'Baixo' ? 'bg-green-500' :
        'bg-gray-500';

    return <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${riskColor}`}>{risk}</span>;
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
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Analisador de Problemas Mecânicos</h2>
            <p className="text-gray-400 mb-6">Descreva o problema ou envie uma foto para obter uma análise via IA.</p>
            
            <div className="space-y-4">
                <textarea
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Ex: Barulho estranho vindo do motor ao acelerar..."
                    className="w-full p-3 bg-gray-900 rounded-md border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-white"
                    rows={4}
                />
                
                {(isQuickLoading || quickDiagnosis) && (
                     <div className="p-3 bg-gray-900/70 rounded-md border border-gray-700 text-sm">
                        <h4 className="font-semibold text-cyan-300 flex items-center">
                           Diagnóstico Rápido
                           {isQuickLoading && 
                                <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                           }
                        </h4>
                        {quickDiagnosis && <p className="text-gray-300 mt-1">{quickDiagnosis}</p>}
                    </div>
                )}

                <div className="flex items-center space-x-4">
                     <label htmlFor="file-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition">
                        {imageFile ? "Trocar Imagem" : "Enviar Imagem"}
                    </label>
                    <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {imageFile && <span className="text-gray-400">{imageFile.name}</span>}
                </div>

                {imagePreview && (
                    <div className="mt-4">
                        <img src={imagePreview} alt="Preview do problema" className="max-h-60 rounded-lg mx-auto" />
                    </div>
                )}
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isLoading ? 'Analisando...' : 'Análise Completa'}
            </button>

            {isLoading && <LoadingSpinner />}
            {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
            
            {result && (
                <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-4">
                    <h3 className="text-xl font-semibold text-white">Resultado da Análise</h3>
                    
                    <div>
                        <h4 className="font-bold text-cyan-400">Diagnóstico Preliminar:</h4>
                        <p className="text-gray-300">{result.diagnostico}</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-cyan-400 mb-2">Nível de Risco:</h4>
                        <RiskBadge risk={result.risco} />
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-cyan-400">Ações Recomendadas:</h4>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 mt-2">
                            {result.acoes.map((action, index) => <li key={index}>{action}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
