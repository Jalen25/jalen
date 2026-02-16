'use client';

import { useState, useEffect } from 'react';

type Extraction = {
  type: 'idea' | 'decision' | 'insight' | 'question';
  content: string;
  tags: string[];
};

type Memory = {
  id: string;
  type: 'idea' | 'decision' | 'insight' | 'question';
  content: string;
  tags: string[];
  created_at: string;
  relevance_score?: number;
};

export default function Home() {
  const [conversation, setConversation] = useState('');
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [savedMemories, setSavedMemories] = useState<Memory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [activeTab, setActiveTab] = useState<'extract' | 'saved' | 'search'>('extract');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Memory[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState<string>('all');

  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    loadSavedMemories();
  }, []);

  const loadSavedMemories = async () => {
    setLoadingMemories(true);
    try {
      const response = await fetch('/api/memories');
      const data = await response.json();
      if (data.success) {
        setSavedMemories(data.memories);
      }
    } catch (err) {
      console.error('Erro ao carregar memórias:', err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const handleExtract = async () => {
    setError('');
    
    if (!conversation.trim()) {
      setError('Cole uma conversa primeiro!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation }),
      });

      const data = await response.json();

      if (data.success) {
        setExtractions(data.data.extractions || []);
        loadSavedMemories();
        setConversation('');
      } else {
        setError(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      setError('Falha ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Digite algo para buscar!');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const body: any = { query: searchQuery, limit: 20 };
      if (searchFilter !== 'all') {
        body.type = searchFilter;
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
      } else {
        setError(data.error || 'Erro na busca');
      }
    } catch (err) {
      console.error('Erro na busca:', err);
      setError('Falha ao buscar');
    } finally {
      setSearching(false);
    }
  };

  const handleStartEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setEditContent(memory.content);
    setEditTags(memory.tags.join(', '));
  };

  const handleSaveEdit = async () => {
    if (!editingMemory) return;

    try {
      const response = await fetch(`/api/memories/${editingMemory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadSavedMemories();
        setEditingMemory(null);
        alert('✅ Memória atualizada!');
      }
    } catch (err) {
      alert('❌ Erro ao salvar');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingMemory(null);
    setEditContent('');
    setEditTags('');
  };

  const handleDelete = async (memoryId: string) => {
    if (!confirm('Tem certeza que quer deletar esta memória?')) return;

    try {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadSavedMemories();
        alert('✅ Memória deletada!');
      }
    } catch (err) {
      alert('❌ Erro ao deletar');
      console.error(err);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    window.open(`/api/export?format=${format}`, '_blank');
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerar embeddings de todas as memórias antigas com OpenAI?')) return;
    
    alert('Iniciando regeneração com OpenAI... Aguarde!');
    
    try {
      const response = await fetch('/api/regenerate', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Sucesso! ${data.updated} memórias atualizadas com OpenAI embeddings!`);
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (err) {
      alert('❌ Erro ao regenerar');
      console.error(err);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      idea: 'bg-blue-100 text-blue-800',
      decision: 'bg-green-100 text-green-800',
      insight: 'bg-purple-100 text-purple-800',
      question: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      idea: '💡',
      decision: '✅',
      insight: '🧠',
      question: '❓',
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMemoryCard = (memory: Memory, index: number) => {
    const isEditing = editingMemory?.id === memory.id;

    return (
      <div
        key={memory.id || index}
        className="border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getTypeIcon(memory.type)}</span>
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getTypeColor(memory.type)}`}>
              {memory.type.toUpperCase()}
            </span>
            {memory.relevance_score !== undefined && memory.relevance_score > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Relevância: {memory.relevance_score}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {formatDate(memory.created_at)}
            </span>
            {activeTab === 'saved' && !isEditing && (
              <>
                <button
                  onClick={() => handleStartEdit(memory)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(memory.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  🗑️ Deletar
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border rounded-lg"
              rows={4}
            />
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="Tags separadas por vírgula"
              className="w-full p-3 border rounded-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ✅ Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">
              {memory.content}
            </p>
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🧠 Jalen
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de Memória Cognitiva
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by Groq ⚡ + Supabase 🗄️
          </p>
        </div>

        {/* Botão de regeneração */}
        <div className="text-center mb-8">
          <button
            onClick={handleRegenerate}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            🔄 Regenerar Embeddings (OpenAI)
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Execute uma vez para adicionar embeddings OpenAI às memórias antigas
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('extract')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors ${
              activeTab === 'extract'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            ➕ Nova Extração
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔍 Buscar
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors ${
              activeTab === 'saved'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📚 Todas ({savedMemories.length})
          </button>
        </div>

        {activeTab === 'extract' && (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Cole sua conversa do ChatGPT, Claude ou Gemini:
              </label>
              <textarea
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
                placeholder="Cole aqui a conversa que você quer analisar..."
                className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700"
              />
              
              <button
                onClick={handleExtract}
                disabled={loading}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
              >
                {loading ? 'Processando... ⏳' : 'Extrair Conhecimento 🚀'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {extractions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  📊 Conhecimento Extraído (Salvo!)
                </h2>
                
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {extractions.filter(e => e.type === 'idea').length}
                    </div>
                    <div className="text-sm text-gray-600">Ideias</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {extractions.filter(e => e.type === 'decision').length}
                    </div>
                    <div className="text-sm text-gray-600">Decisões</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {extractions.filter(e => e.type === 'insight').length}
                    </div>
                    <div className="text-sm text-gray-600">Insights</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {extractions.filter(e => e.type === 'question').length}
                    </div>
                    <div className="text-sm text-gray-600">Perguntas</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {extractions.map((item, index) => (
                    <div
                      key={index}
                      className="border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{getTypeIcon(item.type)}</span>
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getTypeColor(item.type)}`}>
                          {item.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        {item.content}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'search' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              🔍 Buscar Memórias
            </h2>

            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: monetização, cuidados com pele, estratégias..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setSearchFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  searchFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSearchFilter('idea')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  searchFilter === 'idea'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💡 Ideias
              </button>
              <button
                onClick={() => setSearchFilter('decision')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  searchFilter === 'decision'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✅ Decisões
              </button>
              <button
                onClick={() => setSearchFilter('insight')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  searchFilter === 'insight'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🧠 Insights
              </button>
              <button
                onClick={() => setSearchFilter('question')}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  searchFilter === 'question'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ❓ Perguntas
              </button>
            </div>

            <button
              onClick={handleSearch}
              disabled={searching}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg mb-8"
            >
              {searching ? 'Buscando... 🔍' : 'Buscar 🚀'}
            </button>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {searchResults.length > 0 ? (
              <>
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-semibold">
                    ✅ {searchResults.length} resultado(s) encontrado(s) para "{searchQuery}"
                  </p>
                </div>

                <div className="space-y-4">
                  {searchResults.map((memory, index) => renderMemoryCard(memory, index))}
                </div>
              </>
            ) : searchQuery && !searching ? (
              <div className="text-center py-12 text-gray-500">
                Nenhum resultado encontrado para "{searchQuery}". Tente outras palavras!
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                📚 Todas as Memórias
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  📥 JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  📥 CSV
                </button>
                <button
                  onClick={loadSavedMemories}
                  disabled={loadingMemories}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loadingMemories ? 'Carregando...' : '🔄 Atualizar'}
                </button>
              </div>
            </div>

            {loadingMemories ? (
              <div className="text-center py-12 text-gray-500">
                Carregando memórias...
              </div>
            ) : savedMemories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhuma memória salva ainda. Extraia sua primeira conversa!
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {savedMemories.filter(m => m.type === 'idea').length}
                    </div>
                    <div className="text-sm text-gray-600">Ideias</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {savedMemories.filter(m => m.type === 'decision').length}
                    </div>
                    <div className="text-sm text-gray-600">Decisões</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {savedMemories.filter(m => m.type === 'insight').length}
                    </div>
                    <div className="text-sm text-gray-600">Insights</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {savedMemories.filter(m => m.type === 'question').length}
                    </div>
                    <div className="text-sm text-gray-600">Perguntas</div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white border-2 border-gray-200 p-6 rounded-xl">
                    <div className="text-sm text-gray-600 mb-2">Total de Memórias</div>
                    <div className="text-4xl font-bold text-gray-800">{savedMemories.length}</div>
                  </div>
                  <div className="bg-white border-2 border-gray-200 p-6 rounded-xl">
                    <div className="text-sm text-gray-600 mb-2">Esta Semana</div>
                    <div className="text-4xl font-bold text-green-600">
                      {savedMemories.filter(m => {
                        const created = new Date(m.created_at);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return created >= weekAgo;
                      }).length}
                    </div>
                  </div>
                  <div className="bg-white border-2 border-gray-200 p-6 rounded-xl">
                    <div className="text-sm text-gray-600 mb-2">Hoje</div>
                    <div className="text-4xl font-bold text-blue-600">
                      {savedMemories.filter(m => {
                        const created = new Date(m.created_at);
                        const today = new Date();
                        return created.toDateString() === today.toDateString();
                      }).length}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">🏷️ Tags Mais Usadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const tagCount: Record<string, number> = {};
                      savedMemories.forEach(m => {
                        m.tags.forEach(tag => {
                          tagCount[tag] = (tagCount[tag] || 0) + 1;
                        });
                      });
                      
                      return Object.entries(tagCount)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([tag, count]) => (
                          <span
                            key={tag}
                            className="px-4 py-2 bg-white rounded-full text-sm font-semibold shadow-sm"
                          >
                            #{tag} <span className="text-gray-500">({count})</span>
                          </span>
                        ));
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  {savedMemories.map((memory, index) => renderMemoryCard(memory, index))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
