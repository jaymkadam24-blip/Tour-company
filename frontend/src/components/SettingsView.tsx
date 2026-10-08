import React, { useState, useEffect } from 'react';
import { Settings, Cpu, ShieldAlert, Save, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { SystemSettings } from '../types';
import { fetchSettings, saveSettings } from '../api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    ai_provider: 'heuristic',
    gemini_api_key: '',
    openai_api_key: '',
    ai_model_name: 'gemini-1.5-flash',
    auto_sync_enabled: true,
    sync_interval_minutes: 5,
    confidence_threshold: 0.75,
    gmail_connected: false,
    gmail_email: ''
  });

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await saveSettings(settings);
      setSaveMessage('Settings updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveMessage(`Failed to save: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in pb-12 text-slate-900">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">System & AI Configuration</h2>
          <p className="text-xs text-slate-500">Configure AI models, API keys, email polling intervals, and validation rules</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* AI Engine Provider Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Cpu className="w-5 h-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">AI Extraction Provider</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Heuristic Provider */}
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, ai_provider: 'heuristic' }))}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                settings.ai_provider === 'heuristic'
                  ? 'bg-[#5E56E7] border-[#5E56E7] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className={`font-bold text-xs block ${settings.ai_provider === 'heuristic' ? 'text-white' : 'text-slate-900'}`}>Smart Local NLP Engine</span>
              <span className={`text-[11px] block mt-1 ${settings.ai_provider === 'heuristic' ? 'text-purple-100' : 'text-slate-500'}`}>
                Zero-config, fast heuristic regex & pattern matcher. No API keys required.
              </span>
            </button>

            {/* Google Gemini */}
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, ai_provider: 'gemini' }))}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                settings.ai_provider === 'gemini'
                  ? 'bg-[#5E56E7] border-[#5E56E7] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className={`font-bold text-xs block ${settings.ai_provider === 'gemini' ? 'text-white' : 'text-slate-900'}`}>Google Gemini API</span>
              <span className={`text-[11px] block mt-1 ${settings.ai_provider === 'gemini' ? 'text-purple-100' : 'text-slate-500'}`}>
                Uses Gemini 1.5 Flash model for natural language email comprehension.
              </span>
            </button>

            {/* OpenAI */}
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, ai_provider: 'openai' }))}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                settings.ai_provider === 'openai'
                  ? 'bg-[#5E56E7] border-[#5E56E7] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className={`font-bold text-xs block ${settings.ai_provider === 'openai' ? 'text-white' : 'text-slate-900'}`}>OpenAI GPT-4o API</span>
              <span className={`text-[11px] block mt-1 ${settings.ai_provider === 'openai' ? 'text-purple-100' : 'text-slate-500'}`}>
                Uses OpenAI JSON Mode to extract travel fields from complex emails.
              </span>
            </button>
          </div>

          {/* API Keys inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Gemini Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Google Gemini API Key</span>
                {settings.gemini_api_key_masked && <span className="text-[10px] text-slate-400">Saved: {settings.gemini_api_key_masked}</span>}
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={settings.gemini_api_key || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, gemini_api_key: e.target.value }))}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* OpenAI Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>OpenAI API Key</span>
                {settings.openai_api_key_masked && <span className="text-[10px] text-slate-400">Saved: {settings.openai_api_key_masked}</span>}
              </label>
              <div className="relative">
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={settings.openai_api_key || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, openai_api_key: e.target.value }))}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
                >
                  {showOpenAIKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Validation & Auto-Flagging Rules Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Validation & Needs Review Rules</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Confidence Threshold for Auto Flagging:
                </label>
                <span className="font-mono font-bold text-amber-700 text-xs">
                  {Math.round(settings.confidence_threshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={settings.confidence_threshold}
                onChange={(e) => setSettings(prev => ({ ...prev, confidence_threshold: parseFloat(e.target.value) }))}
                className="w-full accent-slate-900 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Applications with AI extraction confidence below {Math.round(settings.confidence_threshold * 100)}% or with missing travel dates/travelers will automatically receive status <strong className="text-amber-700">Needs Review</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          <div>
            {saveMessage && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                {saveMessage}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#5E56E7] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save All Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
