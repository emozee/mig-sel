import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Brain,
  Search,
  ChevronDown,
  CircleHelp,
  X,
} from 'lucide-react';
import {
  useKnowledge,
  useCreateKnowledge,
  useUpdateKnowledge,
  useDeleteKnowledge,
  useUnansweredQuestions,
  useDeleteUnanswered,
} from '@/features/chatbot/api/use-knowledge';
import type { KnowledgeItem } from '@/features/chatbot/types';
import { cn } from '@/lib/utils';

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
  const { data: unanswered = [], isLoading: unansweredLoading } = useUnansweredQuestions();
  const deleteUnanswered = useDeleteUnanswered();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [pendingUnansweredId, setPendingUnansweredId] = useState<number | null>(null);
  const [showUnanswered, setShowUnanswered] = useState(true);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsAdding(false);
    setPendingUnansweredId(null);
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
    if (pendingUnansweredId !== null) {
      await deleteUnanswered.mutateAsync(pendingUnansweredId);
    }
    resetForm();
  };

  const handleAnswerUnanswered = (question: string, id: number) => {
    setForm({ question, answer: '', keywords: '' });
    setEditingId(null);
    setIsAdding(true);
    setPendingUnansweredId(id);
  };

  const toggleExpanded = (id: number) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
            className="focus:border-primary focus:ring-primary h-10 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm outline-none focus:ring-1"
          />
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Q&A
          </button>
        )}
      </div>

      {unanswered.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60">
          <button
            type="button"
            onClick={() => setShowUnanswered((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-900">Needs answers</span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                {unanswered.length}
              </span>
              <span className="hidden text-xs text-amber-700/70 sm:inline">
                questions the bot couldn't answer
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-amber-700 transition-transform duration-200',
                showUnanswered && 'rotate-180',
              )}
            />
          </button>
          {showUnanswered && (
            <div className="divide-y divide-amber-100 border-t border-amber-100">
              {unanswered.map((uq) => (
                <div key={uq.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold break-words text-gray-900">{uq.question}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {uq.matched_question
                        ? `Closest: "${uq.matched_question}" · ${Math.round((uq.score ?? 0) * 100)}% match`
                        : 'No match found'}
                      {' · '}
                      {new Date(uq.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAnswerUnanswered(uq.question, uq.id)}
                      className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                    >
                      Answer
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUnanswered.mutate(uq.id)}
                      aria-label="Dismiss"
                      title="Dismiss without answering"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-700/70 transition-colors hover:bg-amber-100 hover:text-amber-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {unansweredLoading && (
                <p className="px-4 py-2 text-xs text-amber-700/70">Loading...</p>
              )}
            </div>
          )}
        </div>
      )}

      {isAdding && (
        <div className="border-primary/20 bg-primary/5 rounded-xl border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="text-primary h-4 w-4" />
            <span className="text-primary text-sm font-bold">New Knowledge Entry</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Question</label>
              <input
                type="text"
                placeholder="e.g. How do I report an issue?"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                className="focus:border-primary focus:ring-primary h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-1"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Answer</label>
              <textarea
                placeholder="The answer the chatbot will give..."
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                rows={4}
                className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1"
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
                className="focus:border-primary focus:ring-primary h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!form.question.trim() || !form.answer.trim() || isPending}
                className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
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
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
            >
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
                      className="focus:border-primary focus:ring-primary h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Answer</label>
                    <textarea
                      value={form.answer}
                      onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                      rows={4}
                      className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1"
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
                      className="focus:border-primary focus:ring-primary h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={!form.question.trim() || !form.answer.trim() || isPending}
                      className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <Brain className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <h3 className="line-clamp-2 text-sm font-bold text-gray-900">
                        {item.question}
                      </h3>
                    </div>
                    <p
                      className={cn(
                        'mt-1.5 text-sm leading-relaxed break-words text-gray-600',
                        !expandedIds.has(item.id) && 'line-clamp-3',
                      )}
                    >
                      {item.answer}
                    </p>
                    {item.answer.length > 140 && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        className="text-primary hover:text-primary/80 mt-1 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                      >
                        {expandedIds.has(item.id) ? 'Show less' : 'Show more'}
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 transition-transform duration-200',
                            expandedIds.has(item.id) && 'rotate-180',
                          )}
                        />
                      </button>
                    )}
                    {item.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="max-w-full truncate rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      aria-label={`Edit ${item.question}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Delete ${item.question}`}
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
