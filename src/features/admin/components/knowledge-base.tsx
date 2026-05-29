import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Brain, Search } from 'lucide-react';
import {
  useKnowledge,
  useCreateKnowledge,
  useUpdateKnowledge,
  useDeleteKnowledge,
} from '@/features/chatbot/api/use-knowledge';
import type { KnowledgeItem } from '@/features/chatbot/types';

interface FormState {
  question: string;
  answer: string;
  keywords: string;
}

const emptyForm: FormState = { question: '', answer: '', keywords: '' };

export const KnowledgeBase = () => {
  const { data: items, isLoading } = useKnowledge();
  const createMutation = useCreateKnowledge();
  const updateMutation = useUpdateKnowledge();
  const deleteMutation = useDeleteKnowledge();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    const keywords = form.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        question: form.question.trim(),
        answer: form.answer.trim(),
        keywords,
      });
    } else {
      await createMutation.mutateAsync({
        question: form.question.trim(),
        answer: form.answer.trim(),
        keywords,
      });
    }
    resetForm();
  };

  const handleEdit = (item: KnowledgeItem) => {
    setForm({
      question: item.question,
      answer: item.answer,
      keywords: item.keywords.join(', '),
    });
    setEditingId(item.id);
    setIsAdding(false);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const filtered = search.trim()
    ? (items ?? []).filter(
        (i) =>
          i.question.toLowerCase().includes(search.toLowerCase()) ||
          i.answer.toLowerCase().includes(search.toLowerCase()) ||
          i.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())),
      )
    : (items ?? []);

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Q&A
          </button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-800">New Knowledge Entry</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Question</label>
              <input
                type="text"
                placeholder="e.g. How do I report an issue?"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Answer</label>
              <textarea
                placeholder="The answer the chatbot will give..."
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Keywords <span className="font-normal text-gray-400">(comma-separated)</span>
              </label>
              <input
                type="text"
                placeholder="report, issue, complaint, file"
                value={form.keywords}
                onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!form.question.trim() || !form.answer.trim() || isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={resetForm}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading knowledge base...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {search
            ? 'No matching entries found.'
            : 'No knowledge entries yet. Add your first Q&A pair.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
              {editingId === item.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Question
                    </label>
                    <input
                      type="text"
                      value={form.question}
                      onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Answer</label>
                    <textarea
                      value={form.answer}
                      onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Keywords
                    </label>
                    <input
                      type="text"
                      value={form.keywords}
                      onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={!form.question.trim() || !form.answer.trim() || isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 shrink-0 text-emerald-500" />
                      <h3 className="truncate text-sm font-bold text-gray-900">{item.question}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.answer}</p>
                    {item.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      Asked: {item.question.substring(0, 40)}...
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
