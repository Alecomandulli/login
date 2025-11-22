import React from 'react';

interface ChecklistItemProps {
  id: number;
  label: string;
  state?: { status: 'ok' | 'defect'; description: string; image?: string };
  onSetStatus: (status: 'ok' | 'defect') => void;
  onDescriptionChange: (description: string) => void;
  onImageChange: (file: File | null) => void;
}


const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const DefectIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
);

const RemoveIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


export const ChecklistItem: React.FC<ChecklistItemProps> = ({ id, label, state, onSetStatus, onDescriptionChange, onImageChange }) => {
    const status = state?.status;
    const description = state?.description ?? '';

    const itemBgColor =
        status === 'ok' ? 'bg-green-900/50 border-green-500' :
        status === 'defect' ? 'bg-red-900/50 border-red-500' :
        'bg-gray-800 hover:bg-gray-700 border-transparent';

    const labelStyle = status ? 'line-through text-gray-400' : 'text-gray-200';

    return (
        <div className={`p-3 my-2 rounded-lg transition-all duration-200 ease-in-out border ${itemBgColor}`}>
            <div className="flex items-center justify-between gap-4">
                <span className={`flex-grow ${labelStyle}`}>{label}</span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                        onClick={() => onSetStatus('ok')}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition ${status === 'ok' ? 'bg-green-500 ring-2 ring-green-300' : 'bg-gray-700 hover:bg-green-600'}`}
                        aria-label={`Marcar ${label} como OK`}
                    >
                        <CheckIcon />
                    </button>
                    <button
                        onClick={() => onSetStatus('defect')}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition ${status === 'defect' ? 'bg-red-500 ring-2 ring-red-300' : 'bg-gray-700 hover:bg-red-600'}`}
                        aria-label={`Marcar ${label} com defeito`}
                    >
                        <DefectIcon />
                    </button>
                </div>
            </div>
            {status === 'defect' && (
                <div className="mt-3 space-y-3">
                    <textarea
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Descreva o defeito encontrado..."
                        className="w-full p-2 bg-gray-900 rounded-md border border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-white"
                        rows={2}
                        aria-label={`Descrição do defeito para ${label}`}
                    />
                    <div className="flex items-center justify-between gap-4">
                        {state?.image ? (
                            <div className="flex items-center gap-2">
                                <img src={state.image} alt={`Defeito em ${label}`} className="h-12 w-12 rounded-md object-cover" />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById(`image-upload-${id}`) as HTMLInputElement;
                                        if (input) input.value = '';
                                        onImageChange(null);
                                    }}
                                    className="p-2 bg-red-800 hover:bg-red-700 rounded-full transition-colors"
                                    aria-label="Remover imagem"
                                >
                                    <RemoveIcon />
                                </button>
                            </div>
                        ) : (
                             <span />
                        )}

                        <div>
                            <label htmlFor={`image-upload-${id}`} className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-md transition inline-flex items-center gap-2">
                                <ImageIcon />
                                {state?.image ? "Trocar" : "Anexar Imagem"}
                            </label>
                            <input
                                id={`image-upload-${id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => onImageChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};