import React, { useState } from 'react';
import { X, Key, ShieldCheck, Target, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink, Trash2 } from 'lucide-react';
import { AiNutritionSettings, NutritionGoals } from '../types';
import { GeminiNutritionService } from '../services/gemini';
import { feedback } from '../services/feedback';

interface NutritionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiNutritionSettings;
  goals: NutritionGoals;
  onSave: (newSettings: AiNutritionSettings, newGoals: NutritionGoals) => void;
}

export const NutritionSettingsModal: React.FC<NutritionSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  goals,
  onSave
}) => {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState(settings.model || 'gemini-3.8-flash');
  const [showKey, setShowKey] = useState(false);

  // Metas nutricionais
  const [calorieGoal, setCalorieGoal] = useState<number>(goals.calories || 2200);
  const [proteinGoal, setProteinGoal] = useState<number>(goals.protein || 160);
  const [carbsGoal, setCarbsGoal] = useState<number>(goals.carbs || 220);
  const [fatGoal, setFatGoal] = useState<number>(goals.fat || 65);
  const [waterGoal, setWaterGoal] = useState<number>(goals.waterMl || 2500);

  // Status de teste da chave
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testErrorMessage, setTestErrorMessage] = useState('');

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      feedback.warning('Informe sua chave do Google Gemini antes de testar.');
      return;
    }

    setTestingStatus('testing');
    setTestErrorMessage('');

    try {
      await GeminiNutritionService.testConnection(apiKey.trim(), model.trim());
      setTestingStatus('success');
      feedback.success('Conexão com a IA estabelecida com sucesso!');
    } catch (err: any) {
      setTestingStatus('error');
      setTestErrorMessage(err.message || 'Erro ao comunicar com a API do Gemini.');
      feedback.error('Falha ao autenticar chave da IA.');
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    setTestingStatus('idle');
    onSave(
      {
        ...settings,
        apiKey: '',
        model: model.trim() || 'gemini-3.8-flash',
        provider: 'gemini'
      },
      goals
    );
    feedback.success('Chave da API apagada com sucesso!');
  };

  const handleSave = () => {
    onSave(
      {
        ...settings,
        apiKey: apiKey.trim(),
        model: model.trim() || 'gemini-3.8-flash',
        provider: 'gemini'
      },
      {
        calories: Number(calorieGoal) || 2000,
        protein: Number(proteinGoal) || 150,
        carbs: Number(carbsGoal) || 200,
        fat: Number(fatGoal) || 60,
        waterMl: Number(waterGoal) || 2500
      }
    );
    feedback.success('Configurações e metas salvas!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-dark-border bg-dark-bg/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                IA & Metas de Calorias
              </h2>
              <p className="text-xs text-slate-400">Configure a chave da IA e seus objetivos diários</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Seção API Gemini */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-mint-400 flex items-center gap-1.5">
                <Key className="w-4 h-4" /> API Key do Google Gemini
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-mint-400 flex items-center gap-1 transition-colors"
              >
                Gerar chave no Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestingStatus('idle');
                }}
                placeholder="AIzaSy..."
                className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3.5 py-3 pr-24 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-mint-500/60 focus:ring-1 focus:ring-mint-500/60"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showKey ? 'Ocultar' : 'Exibir'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingStatus === 'testing' || !apiKey.trim()}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-mint-500/10 hover:bg-mint-500/20 text-mint-400 border border-mint-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  {testingStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {testingStatus === 'idle' && 'Testar'}
                  {testingStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {testingStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                </button>
              </div>
            </div>

            {/* Ações da Chave: Apagar / Limpar Chave */}
            {apiKey.trim() && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Apagar Chave da API</span>
                </button>
              </div>
            )}

            {testingStatus === 'error' && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {testErrorMessage}
              </p>
            )}

            {testingStatus === 'success' && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Chave válida! IA pronta para analisar imagens e textos.
              </p>
            )}

            {/* Modelo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Modelo selecionado (Google Gemini)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModel('gemini-3.8-flash')}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                      model === 'gemini-3.8-flash'
                        ? 'border-mint-500 text-mint-400 bg-mint-500/10 font-bold'
                        : 'border-dark-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3.8 Flash (Padrão)
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gemini-3.8-flash"
                className="w-full bg-dark-bg/60 border border-dark-border rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-mint-500/50"
              />
            </div>

            {/* Aviso de Privacidade */}
            <div className="p-3.5 rounded-2xl bg-dark-bg/40 border border-dark-border/80 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-mint-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-200">Privacidade Absoluta: </span>
                Suas fotos não são salvas no aplicativo nem em servidores. A imagem é enviada para a IA em memória temporária, o app calcula as calorias e descarta a imagem imediatamente.
              </div>
            </div>
          </div>

          <div className="h-px bg-dark-border" />

          {/* Seção Metas Nutricionais */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-mint-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Suas Metas Diárias
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Meta de Calorias (kcal/dia)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(Number(e.target.value))}
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3 py-2.5 text-base font-bold text-mint-400 focus:outline-none focus:border-mint-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">kcal</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Proteínas (g)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={proteinGoal}
                    onChange={(e) => setProteinGoal(Number(e.target.value))}
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3 py-2 text-sm font-bold text-slate-200 focus:outline-none focus:border-mint-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">g</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Carboidratos (g)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={carbsGoal}
                    onChange={(e) => setCarbsGoal(Number(e.target.value))}
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3 py-2 text-sm font-bold text-slate-200 focus:outline-none focus:border-mint-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">g</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Gorduras (g)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fatGoal}
                    onChange={(e) => setFatGoal(Number(e.target.value))}
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3 py-2 text-sm font-bold text-slate-200 focus:outline-none focus:border-mint-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">g</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Meta de Água (ml)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    value={waterGoal}
                    onChange={(e) => setWaterGoal(Number(e.target.value))}
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3 py-2 text-sm font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">ml</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-dark-border bg-dark-bg/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-mint-500 hover:bg-mint-400 text-dark-bg shadow-mint-glow-sm transition-all transform active:scale-95"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
