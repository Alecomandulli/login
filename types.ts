
export interface ChecklistItemType {
  id: number;
  category: string;
  label: string;
}

export interface AnalysisResult {
  diagnostico: string;
  risco: 'Baixo' | 'Médio' | 'Alto' | string;
  acoes: string[];
}

export interface User {
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'user';
}
