import { useState } from 'react';
import { AlertTriangle, Check, ChevronDown, CirclePlus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useDeleteQuestionOption,
  useDeleteServiceSource,
  useSaveQuestionOption,
  useSaveService,
  useSaveServiceProvider,
  useSaveServiceQuestion,
  useSaveServiceSource,
  useServiceDirectoryAdmin,
  type ServiceAdmin,
  type ServiceProviderAdmin,
} from '@/features/admin/api/use-service-directory';

const fieldClass =
  'border-border focus:ring-primary min-h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2';

type Tab = 'services' | 'providers' | 'questions';

const emptyProvider = {
  name: '',
  abbreviation: '',
  provider_type: 'government_agency',
  description: '',
  website_url: '',
  active: true,
  verified: false,
};
const emptyService = {
  name: '',
  slug: '',
  provider_id: '',
  service_category: '',
  short_description: '',
  detailed_description: '',
  official_url: '',
  requirements: '',
  fees: '',
  processing_time: '',
  online_available: null as boolean | null,
  active: true,
  verified: false,
  keywords: '',
};

export function ServiceDirectory() {
  const { data, isLoading, error } = useServiceDirectoryAdmin();
  const saveProvider = useSaveServiceProvider();
  const saveService = useSaveService();
  const saveSource = useSaveServiceSource();
  const deleteSource = useDeleteServiceSource();
  const saveQuestion = useSaveServiceQuestion();
  const saveOption = useSaveQuestionOption();
  const deleteOption = useDeleteQuestionOption();
  const [tab, setTab] = useState<Tab>('services');
  const [providerForm, setProviderForm] = useState(emptyProvider);
  const [providerId, setProviderId] = useState<string>();
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [serviceId, setServiceId] = useState<string>();
  const [expandedService, setExpandedService] = useState<string>();
  const [sourceForm, setSourceForm] = useState({
    source_name: '',
    source_url: '',
    verified: false,
  });
  const [questionForm, setQuestionForm] = useState({
    service_family: '',
    question_key: '',
    question_text: '',
    question_type: 'single_choice' as 'single_choice' | 'free_text',
    required: true,
    active: true,
  });
  const [optionForm, setOptionForm] = useState({
    question_id: '',
    label: '',
    value: '',
    target_service_id: '',
  });

  const editProvider = (provider: ServiceProviderAdmin) => {
    setProviderId(provider.id);
    setProviderForm({
      name: provider.name,
      abbreviation: provider.abbreviation ?? '',
      provider_type: provider.provider_type,
      description: provider.description ?? '',
      website_url: provider.website_url ?? '',
      active: provider.active,
      verified: provider.verified,
    });
  };

  const editService = (service: ServiceAdmin) => {
    setServiceId(service.id);
    setServiceForm({
      name: service.name,
      slug: service.slug,
      provider_id: service.provider_id,
      service_category: service.service_category,
      short_description: service.short_description ?? '',
      detailed_description: service.detailed_description ?? '',
      official_url: service.official_url ?? '',
      requirements: service.requirements ?? '',
      fees: service.fees ?? '',
      processing_time: service.processing_time ?? '',
      online_available: service.online_available,
      active: service.active,
      verified: service.verified,
      keywords: service.service_keywords.map((item) => item.keyword).join(', '),
    });
  };

  if (isLoading)
    return <p className="py-10 text-center text-sm text-slate-500">Loading service directory…</p>;
  if (error)
    return (
      <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Could not load the service directory.
      </p>
    );

  const pending =
    saveProvider.isPending ||
    saveService.isPending ||
    saveSource.isPending ||
    saveQuestion.isPending ||
    saveOption.isPending;
  const mutationError =
    saveProvider.error ||
    saveService.error ||
    saveSource.error ||
    saveQuestion.error ||
    saveOption.error;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Service directory sections">
        {(['services', 'providers', 'questions'] as const).map((item) => (
          <Button
            key={item}
            size="xs"
            variant={tab === item ? 'default' : 'outline'}
            onClick={() => setTab(item)}
            role="tab"
            aria-selected={tab === item}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Verification means an authorized human checked the service against an official source. Do
        not verify AI-generated or assumed information.
      </div>
      {mutationError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mutationError.message}</p>
      )}

      {tab === 'providers' && (
        <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
          <form
            className="space-y-3 rounded-xl border bg-white p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProvider.mutateAsync({ id: providerId, ...providerForm }).then(() => {
                setProviderId(undefined);
                setProviderForm(emptyProvider);
              });
            }}
          >
            <h3 className="font-bold">{providerId ? 'Edit provider' : 'Add provider'}</h3>
            <input
              required
              className={fieldClass}
              placeholder="Provider name"
              value={providerForm.name}
              onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Abbreviation"
              value={providerForm.abbreviation}
              onChange={(e) => setProviderForm({ ...providerForm, abbreviation: e.target.value })}
            />
            <select
              className={fieldClass}
              value={providerForm.provider_type}
              onChange={(e) => setProviderForm({ ...providerForm, provider_type: e.target.value })}
            >
              <option value="government_agency">Government agency</option>
              <option value="local_authority">Local authority</option>
              <option value="utility">Utility</option>
              <option value="public_service_provider">Public service provider</option>
              <option value="other">Other</option>
            </select>
            <textarea
              className={fieldClass}
              placeholder="Description"
              value={providerForm.description}
              onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
            />
            <input
              className={fieldClass}
              type="url"
              placeholder="Official website URL"
              value={providerForm.website_url}
              onChange={(e) => setProviderForm({ ...providerForm, website_url: e.target.value })}
            />
            <div className="flex flex-wrap gap-4 text-sm">
              <label>
                <input
                  type="checkbox"
                  checked={providerForm.active}
                  onChange={(e) => setProviderForm({ ...providerForm, active: e.target.checked })}
                />{' '}
                Active
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={providerForm.verified}
                  onChange={(e) => setProviderForm({ ...providerForm, verified: e.target.checked })}
                />{' '}
                Verified
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="xs" disabled={pending}>
                <Check /> Save
              </Button>
              {providerId && (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setProviderId(undefined);
                    setProviderForm(emptyProvider);
                  }}
                >
                  <X /> Cancel
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-2">
            {data?.providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => editProvider(provider)}
                className="hover:border-primary flex w-full items-center justify-between rounded-xl border bg-white p-3 text-left"
              >
                <span>
                  <span className="block text-sm font-bold">{provider.name}</span>
                  <span className="text-xs text-slate-500">
                    {provider.provider_type.replaceAll('_', ' ')}
                  </span>
                </span>
                <span
                  className={`text-xs font-semibold ${provider.verified ? 'text-emerald-700' : 'text-amber-700'}`}
                >
                  {provider.verified
                    ? `Verified ${provider.last_verified_at ? new Date(provider.last_verified_at).toLocaleDateString() : ''}`
                    : 'Not verified'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
          <form
            className="space-y-3 rounded-xl border bg-white p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const keywords = serviceForm.keywords
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
              void saveService.mutateAsync({ id: serviceId, ...serviceForm, keywords }).then(() => {
                setServiceId(undefined);
                setServiceForm(emptyService);
              });
            }}
          >
            <h3 className="font-bold">{serviceId ? 'Edit service' : 'Add service'}</h3>
            <input
              required
              className={fieldClass}
              placeholder="Service name"
              value={serviceForm.name}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  name: e.target.value,
                  slug: serviceId
                    ? serviceForm.slug
                    : e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, ''),
                })
              }
            />
            <input
              required
              className={fieldClass}
              placeholder="service-slug"
              value={serviceForm.slug}
              onChange={(e) => setServiceForm({ ...serviceForm, slug: e.target.value })}
            />
            <select
              required
              className={fieldClass}
              value={serviceForm.provider_id}
              onChange={(e) => setServiceForm({ ...serviceForm, provider_id: e.target.value })}
            >
              <option value="">Select provider</option>
              {data?.providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <input
              required
              className={fieldClass}
              placeholder="Category"
              value={serviceForm.service_category}
              onChange={(e) => setServiceForm({ ...serviceForm, service_category: e.target.value })}
            />
            <textarea
              className={fieldClass}
              placeholder="Short description"
              value={serviceForm.short_description}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, short_description: e.target.value })
              }
            />
            <input
              className={fieldClass}
              type="url"
              placeholder="Official service URL"
              value={serviceForm.official_url}
              onChange={(e) => setServiceForm({ ...serviceForm, official_url: e.target.value })}
            />
            <textarea
              className={fieldClass}
              placeholder="Requirements (verified facts only)"
              value={serviceForm.requirements}
              onChange={(e) => setServiceForm({ ...serviceForm, requirements: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Fees (verified facts only)"
              value={serviceForm.fees}
              onChange={(e) => setServiceForm({ ...serviceForm, fees: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Processing time (verified facts only)"
              value={serviceForm.processing_time}
              onChange={(e) => setServiceForm({ ...serviceForm, processing_time: e.target.value })}
            />
            <textarea
              className={fieldClass}
              placeholder="Keywords, comma-separated"
              value={serviceForm.keywords}
              onChange={(e) => setServiceForm({ ...serviceForm, keywords: e.target.value })}
            />
            <div className="flex flex-wrap gap-4 text-sm">
              <label>
                <input
                  type="checkbox"
                  checked={serviceForm.active}
                  onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                />{' '}
                Active
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={serviceForm.verified}
                  onChange={(e) => setServiceForm({ ...serviceForm, verified: e.target.checked })}
                />{' '}
                Verified
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="xs" disabled={pending}>
                <Check /> Save
              </Button>
              {serviceId && (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setServiceId(undefined);
                    setServiceForm(emptyService);
                  }}
                >
                  <X /> Cancel
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-2">
            {data?.services.map((service) => (
              <div key={service.id} className="rounded-xl border bg-white">
                <div className="flex items-start gap-2 p-3">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() =>
                      setExpandedService(expandedService === service.id ? undefined : service.id)
                    }
                  >
                    <span className="block text-sm font-bold">{service.name}</span>
                    <span className="text-xs text-slate-500">
                      {service.service_providers?.name} · {service.service_category}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-semibold ${service.verified ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                      {service.verified
                        ? `Verified${service.last_verified_at ? ` · ${new Date(service.last_verified_at).toLocaleDateString()}` : ''}`
                        : 'Information not verified'}
                    </span>
                  </button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => editService(service)}
                    aria-label={`Edit ${service.name}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() =>
                      setExpandedService(expandedService === service.id ? undefined : service.id)
                    }
                    aria-label={`Manage sources for ${service.name}`}
                  >
                    <ChevronDown />
                  </Button>
                </div>
                {expandedService === service.id && (
                  <div className="space-y-3 border-t p-3">
                    <div className="flex flex-wrap gap-1">
                      {service.service_keywords.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-slate-100 px-2 py-1 text-[11px]"
                        >
                          {item.keyword}
                        </span>
                      ))}
                    </div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Official sources</h4>
                    {service.service_sources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs"
                      >
                        <a
                          className="text-primary min-w-0 flex-1 truncate underline"
                          href={source.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.source_name}
                        </a>
                        <span>{source.verified ? 'Verified' : 'Unverified'}</span>
                        <button
                          type="button"
                          className="text-primary font-semibold"
                          onClick={() =>
                            saveSource.mutate({
                              id: source.id,
                              service_id: service.id,
                              source_name: source.source_name,
                              source_url: source.source_url,
                              verified: !source.verified,
                            })
                          }
                        >
                          {source.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          aria-label={`Delete ${source.source_name}`}
                          onClick={() => deleteSource.mutate(source.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    ))}
                    <form
                      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void saveSource
                          .mutateAsync({ service_id: service.id, ...sourceForm })
                          .then(() =>
                            setSourceForm({ source_name: '', source_url: '', verified: false }),
                          );
                      }}
                    >
                      <input
                        required
                        className={fieldClass}
                        placeholder="Source name"
                        value={sourceForm.source_name}
                        onChange={(e) =>
                          setSourceForm({ ...sourceForm, source_name: e.target.value })
                        }
                      />
                      <input
                        required
                        type="url"
                        className={fieldClass}
                        placeholder="https://official…"
                        value={sourceForm.source_url}
                        onChange={(e) =>
                          setSourceForm({ ...sourceForm, source_url: e.target.value })
                        }
                      />
                      <Button size="xs">
                        <CirclePlus /> Add
                      </Button>
                      <label className="text-xs">
                        <input
                          type="checkbox"
                          checked={sourceForm.verified}
                          onChange={(e) =>
                            setSourceForm({ ...sourceForm, verified: e.target.checked })
                          }
                        />{' '}
                        Source verified
                      </label>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div className="space-y-4">
          <form
            className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveQuestion.mutateAsync(questionForm).then(() =>
                setQuestionForm({
                  service_family: '',
                  question_key: '',
                  question_text: '',
                  question_type: 'single_choice',
                  required: true,
                  active: true,
                }),
              );
            }}
          >
            <input
              required
              className={fieldClass}
              placeholder="Service family"
              value={questionForm.service_family}
              onChange={(e) => setQuestionForm({ ...questionForm, service_family: e.target.value })}
            />
            <input
              required
              className={fieldClass}
              placeholder="question_key"
              value={questionForm.question_key}
              onChange={(e) => setQuestionForm({ ...questionForm, question_key: e.target.value })}
            />
            <input
              required
              className={fieldClass}
              placeholder="Question text"
              value={questionForm.question_text}
              onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
            />
            <select
              className={fieldClass}
              value={questionForm.question_type}
              onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                  question_type: e.target.value as 'single_choice' | 'free_text',
                })
              }
            >
              <option value="single_choice">Single choice</option>
              <option value="free_text">Free text</option>
            </select>
            <label className="text-sm">
              <input
                type="checkbox"
                checked={questionForm.required}
                onChange={(e) => setQuestionForm({ ...questionForm, required: e.target.checked })}
              />{' '}
              Required
            </label>
            <Button size="xs" disabled={pending}>
              <CirclePlus /> Add question
            </Button>
          </form>
          {data?.questions.map((question) => (
            <div key={question.id} className="rounded-xl border bg-white p-4">
              <h3 className="text-sm font-bold">{question.question_text}</h3>
              <p className="text-xs text-slate-500">
                {question.service_family} · {question.question_key} · {question.question_type}
              </p>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="mt-2"
                onClick={() =>
                  saveQuestion.mutate({
                    ...question,
                    active: !question.active,
                  })
                }
              >
                {question.active ? 'Disable question' : 'Enable question'}
              </Button>
              <div className="mt-2 flex flex-wrap gap-2">
                {question.service_question_options.map((option) => (
                  <span
                    key={option.id}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs"
                  >
                    {option.label}
                    <button
                      aria-label={`Delete ${option.label}`}
                      onClick={() => deleteOption.mutate(option.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {question.question_type === 'single_choice' && (
                <form
                  className="mt-3 grid gap-2 sm:grid-cols-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveOption
                      .mutateAsync({ ...optionForm, question_id: question.id })
                      .then(() =>
                        setOptionForm({
                          question_id: '',
                          label: '',
                          value: '',
                          target_service_id: '',
                        }),
                      );
                  }}
                >
                  <input
                    required
                    className={fieldClass}
                    placeholder="Option label"
                    value={
                      optionForm.question_id === question.id || !optionForm.question_id
                        ? optionForm.label
                        : ''
                    }
                    onFocus={() => setOptionForm({ ...optionForm, question_id: question.id })}
                    onChange={(e) =>
                      setOptionForm({
                        ...optionForm,
                        question_id: question.id,
                        label: e.target.value,
                      })
                    }
                  />
                  <input
                    required
                    className={fieldClass}
                    placeholder="option_value"
                    value={optionForm.question_id === question.id ? optionForm.value : ''}
                    onChange={(e) =>
                      setOptionForm({
                        ...optionForm,
                        question_id: question.id,
                        value: e.target.value,
                      })
                    }
                  />
                  <select
                    className={fieldClass}
                    value={
                      optionForm.question_id === question.id ? optionForm.target_service_id : ''
                    }
                    onChange={(e) =>
                      setOptionForm({
                        ...optionForm,
                        question_id: question.id,
                        target_service_id: e.target.value,
                      })
                    }
                  >
                    <option value="">No target service</option>
                    {data.services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <Button size="xs">
                    <CirclePlus /> Add option
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
