<script lang="ts">
  import { tick } from 'svelte';
  import { Button, Checkbox, Label, Select } from 'bits-ui';
  import * as v from 'valibot';
  import { contactPageCopy } from '../copy';

  const copy = contactPageCopy.form;
  const capabilityValues = ['direction', 'design', 'engineering', 'not-sure'] as const;
  const budgetValues = [
    'under-5k',
    '5k-10k',
    '10k-25k',
    '25k-50k',
    '50k-plus',
    'not-sure',
  ] as const;
  const startWindowValues = [
    'asap',
    '1-3-months',
    '3-6-months',
    '6-plus-months',
    'flexible',
  ] as const;
  const validationFields = ['name', 'email', 'capabilities', 'idea'] as const;

  type Capability = (typeof capabilityValues)[number];
  type ValidationField = (typeof validationFields)[number];
  type FieldErrors = Partial<Record<ValidationField, string>>;

  const contactSchema = v.object({
    name: v.pipe(v.string(), v.trim(), v.nonEmpty(copy.validation.name)),
    email: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty(copy.validation.emailRequired),
      v.email(copy.validation.emailInvalid),
    ),
    organization: v.optional(v.pipe(v.string(), v.trim())),
    capabilities: v.pipe(
      v.array(v.picklist(capabilityValues)),
      v.minLength(1, copy.validation.capabilities),
    ),
    idea: v.pipe(v.string(), v.trim(), v.nonEmpty(copy.validation.idea)),
    budget: v.optional(v.picklist(budgetValues)),
    startWindow: v.optional(v.picklist(startWindowValues)),
  });

  const budgetItems = copy.fields.budget.options.map(({ value, label }) => ({ value, label }));
  const startWindowItems = copy.fields.startWindow.options.map(({ value, label }) => ({
    value,
    label,
  }));

  let name = $state('');
  let email = $state('');
  let organization = $state('');
  let capabilities = $state<Capability[]>([]);
  let idea = $state('');
  let budget = $state('');
  let startWindow = $state('');
  let errors = $state<FieldErrors>({});
  let showValidationSummary = $state(false);
  let showPrototypeNotice = $state(false);
  let prototypeNotice: HTMLElement | undefined = $state();

  function isCapability(value: string): value is Capability {
    return (capabilityValues as readonly string[]).includes(value);
  }

  function isValidationField(value: unknown): value is ValidationField {
    return (
      typeof value === 'string' &&
      (validationFields as readonly string[]).includes(value)
    );
  }

  function clearError(field: ValidationField) {
    if (!errors[field]) return;
    const nextErrors = { ...errors };
    delete nextErrors[field];
    errors = nextErrors;
    showValidationSummary = Object.keys(nextErrors).length > 0;
  }

  function handleCapabilityChange(nextValues: string[]) {
    const selectedNotSure = nextValues.at(-1) === 'not-sure';
    if (selectedNotSure) {
      capabilities = ['not-sure'];
    } else {
      capabilities = nextValues
        .filter((value) => isCapability(value))
        .filter((value) => value !== 'not-sure');
    }
    clearError('capabilities');
    showPrototypeNotice = false;
  }

  function collectErrors(issues: v.BaseIssue<unknown>[]) {
    const nextErrors: FieldErrors = {};

    for (const issue of issues) {
      const field = issue.path?.[0]?.key;
      if (isValidationField(field) && !nextErrors[field]) nextErrors[field] = issue.message;
    }

    return nextErrors;
  }

  async function focusFirstError(nextErrors: FieldErrors) {
    await tick();
    const firstField = validationFields.find((field) => nextErrors[field]);
    const targetId = firstField === 'capabilities' ? 'capability-direction' : `contact-${firstField}`;
    document.querySelector<HTMLElement>(`#${targetId}`)?.focus();
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    showPrototypeNotice = false;

    const result = v.safeParse(contactSchema, {
      name,
      email,
      organization: organization || undefined,
      capabilities,
      idea,
      budget: budget || undefined,
      startWindow: startWindow || undefined,
    });

    if (!result.success) {
      errors = collectErrors(result.issues);
      showValidationSummary = true;
      await focusFirstError(errors);
      return;
    }

    errors = {};
    showValidationSummary = false;
    showPrototypeNotice = true;
    await tick();
    prototypeNotice?.focus();
  }
</script>

<section class="contact-form" id="project-inquiry" aria-labelledby="project-inquiry-title">
  <div class="contact-form__inner">
    <header class="contact-form__header">
      <p class="contact-form__eyebrow">
        <span aria-hidden="true"></span>
        {copy.eyebrow}
      </p>
      <div class="contact-form__introduction">
        <h2 id="project-inquiry-title">{copy.title}</h2>
        <p>{copy.introduction}</p>
      </div>
    </header>

    <form onsubmit={handleSubmit} novalidate>
      {#if showValidationSummary}
        <p class="contact-form__validation-summary" role="alert">{copy.validation.summary}</p>
      {/if}

      <div class="contact-form__identity">
        <div class:error={errors.name} class="field">
          <div class="field__label-row">
            <Label.Root for="contact-name">{copy.fields.name.label}</Label.Root>
            <span>{copy.requiredLabel}</span>
          </div>
          <input
            id="contact-name"
            name="name"
            type="text"
            autocomplete={copy.fields.name.autocomplete}
            bind:value={name}
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            oninput={() => {
              clearError('name');
              showPrototypeNotice = false;
            }}
          />
          {#if errors.name}
            <p class="field__error" id="contact-name-error">{errors.name}</p>
          {/if}
        </div>

        <div class:error={errors.email} class="field">
          <div class="field__label-row">
            <Label.Root for="contact-email">{copy.fields.email.label}</Label.Root>
            <span>{copy.requiredLabel}</span>
          </div>
          <input
            id="contact-email"
            name="email"
            type="email"
            autocomplete={copy.fields.email.autocomplete}
            bind:value={email}
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            oninput={() => {
              clearError('email');
              showPrototypeNotice = false;
            }}
          />
          {#if errors.email}
            <p class="field__error" id="contact-email-error">{errors.email}</p>
          {/if}
        </div>

        <div class="field">
          <div class="field__label-row">
            <Label.Root for="contact-organization">{copy.fields.organization.label}</Label.Root>
            <span>{copy.optionalLabel}</span>
          </div>
          <input
            id="contact-organization"
            name="organization"
            type="text"
            autocomplete={copy.fields.organization.autocomplete}
            bind:value={organization}
            oninput={() => (showPrototypeNotice = false)}
          />
        </div>
      </div>

      <Checkbox.Group
        class="contact-form__capabilities"
        value={capabilities}
        onValueChange={handleCapabilityChange}
        aria-required="true"
        aria-describedby={errors.capabilities ? 'capabilities-help capabilities-error' : 'capabilities-help'}
        aria-invalid={errors.capabilities ? 'true' : undefined}
      >
        <div class="field__label-row">
          <Checkbox.GroupLabel>{copy.fields.capabilities.label}</Checkbox.GroupLabel>
          <span>{copy.requiredLabel}</span>
        </div>
        <p class="field__help" id="capabilities-help">{copy.fields.capabilities.help}</p>

        <div class="capability-grid">
          {#each copy.fields.capabilities.options as option, index}
            <div class="capability-option">
              <Checkbox.Root
                class="contact-checkbox"
                id={`capability-${option.value}`}
                value={option.value}
                aria-label={option.label}
              >
                {#snippet children({ checked })}
                  <span class="contact-checkbox__mark" aria-hidden="true">{checked ? '×' : ''}</span>
                {/snippet}
              </Checkbox.Root>
              <Label.Root class="capability-option__label" for={`capability-${option.value}`}>
                <span class="capability-option__index">0{index + 1}</span>
                <strong>{option.label}</strong>
                <span class="capability-option__description">{option.description}</span>
              </Label.Root>
            </div>
          {/each}
        </div>

        {#if errors.capabilities}
          <p class="field__error" id="capabilities-error">{errors.capabilities}</p>
        {/if}
      </Checkbox.Group>

      <div class:error={errors.idea} class="field field--idea">
        <div class="field__label-row">
          <Label.Root for="contact-idea">{copy.fields.idea.label}</Label.Root>
          <span>{copy.requiredLabel}</span>
        </div>
        <p class="field__help" id="contact-idea-help">{copy.fields.idea.help}</p>
        <textarea
          id="contact-idea"
          name="idea"
          rows="7"
          bind:value={idea}
          aria-invalid={errors.idea ? 'true' : undefined}
          aria-describedby={errors.idea ? 'contact-idea-help contact-idea-error' : 'contact-idea-help'}
          oninput={() => {
            clearError('idea');
            showPrototypeNotice = false;
          }}
        ></textarea>
        {#if errors.idea}
          <p class="field__error" id="contact-idea-error">{errors.idea}</p>
        {/if}
      </div>

      <div class="contact-form__planning">
        <div class="field">
          <div class="field__label-row">
            <Label.Root for="contact-budget">{copy.fields.budget.label}</Label.Root>
            <span>{copy.optionalLabel}</span>
          </div>
          <Select.Root
            type="single"
            items={budgetItems}
            bind:value={budget}
            onValueChange={() => (showPrototypeNotice = false)}
          >
            <Select.Trigger class="contact-select-trigger" id="contact-budget">
              <Select.Value placeholder={copy.fields.budget.placeholder} />
              <span aria-hidden="true">↓</span>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="contact-select-content" sideOffset={8}>
                <Select.Viewport>
                  {#each copy.fields.budget.options as option}
                    <Select.Item class="contact-select-item" value={option.value} label={option.label}>
                      {#snippet children({ selected })}
                        <span>{option.label}</span>
                        <span aria-hidden="true">{selected ? '×' : ''}</span>
                      {/snippet}
                    </Select.Item>
                  {/each}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div class="field">
          <div class="field__label-row">
            <Label.Root for="contact-start-window">{copy.fields.startWindow.label}</Label.Root>
            <span>{copy.optionalLabel}</span>
          </div>
          <Select.Root
            type="single"
            items={startWindowItems}
            bind:value={startWindow}
            onValueChange={() => (showPrototypeNotice = false)}
          >
            <Select.Trigger class="contact-select-trigger" id="contact-start-window">
              <Select.Value placeholder={copy.fields.startWindow.placeholder} />
              <span aria-hidden="true">↓</span>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="contact-select-content" sideOffset={8}>
                <Select.Viewport>
                  {#each copy.fields.startWindow.options as option}
                    <Select.Item class="contact-select-item" value={option.value} label={option.label}>
                      {#snippet children({ selected })}
                        <span>{option.label}</span>
                        <span aria-hidden="true">{selected ? '×' : ''}</span>
                      {/snippet}
                    </Select.Item>
                  {/each}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>

      <div class="contact-form__footer">
        <p>Project inquiries only. We will begin by email.</p>
        <Button.Root class="contact-submit" type="submit">
          <span>{copy.submitLabel}</span>
          <span aria-hidden="true">↗</span>
        </Button.Root>
      </div>

      {#if showPrototypeNotice}
        <div
          class="contact-form__prototype"
          role="status"
          aria-live="polite"
          tabindex="-1"
          bind:this={prototypeNotice}
        >
          <strong>{copy.prototypeNotice.title}</strong>
          <span>{copy.prototypeNotice.body}</span>
        </div>
      {/if}
    </form>
  </div>
</section>

<style>
  .contact-form {
    --form-line: color-mix(in srgb, var(--color-on-primary) 24%, transparent);
    --form-muted: color-mix(in srgb, var(--color-on-primary) 64%, transparent);
    background: var(--color-primary);
    color: var(--color-on-primary);
    scroll-margin-top: 32px;
  }

  .contact-form__inner {
    display: grid;
    gap: clamp(64px, 9vw, 128px);
    margin-inline: auto;
    max-width: 1440px;
    padding: clamp(72px, 9vw, 128px) clamp(20px, 3.34vw, 48px);
  }

  .contact-form__header {
    display: grid;
    gap: 40px;
  }

  .contact-form__eyebrow {
    align-items: center;
    display: flex;
    font-family: var(--font-mono);
    font-size: var(--type-label-sm-size);
    font-weight: var(--type-label-sm-weight);
    gap: 12px;
    letter-spacing: var(--type-label-sm-letter-spacing);
    line-height: 1.3;
    text-transform: uppercase;
  }

  .contact-form__eyebrow span {
    background: var(--color-tertiary);
    height: 1px;
    width: 34px;
  }

  .contact-form__introduction {
    display: grid;
    gap: 28px;
  }

  h2 {
    font-size: clamp(3.75rem, 8vw, 7rem);
    font-weight: 600;
    letter-spacing: -0.068em;
    line-height: 0.86;
    max-width: 880px;
  }

  .contact-form__introduction p {
    color: var(--form-muted);
    font-size: clamp(1rem, 1.5vw, 1.25rem);
    line-height: 1.5;
    max-width: 600px;
  }

  form {
    display: grid;
    gap: clamp(64px, 8vw, 112px);
  }

  .contact-form__validation-summary {
    border-left: 3px solid var(--color-error);
    color: var(--color-on-primary);
    padding: 12px 16px;
  }

  .contact-form__identity,
  .contact-form__planning {
    display: grid;
    gap: 32px;
  }

  .field {
    align-content: start;
    display: grid;
    gap: 12px;
    min-width: 0;
  }

  .field__label-row {
    align-items: baseline;
    display: flex;
    gap: 16px;
    justify-content: space-between;
  }

  .field__label-row :global(label),
  .field__label-row :global([data-checkbox-group-label]),
  .field__label-row > span {
    font-family: var(--font-mono);
    font-size: var(--type-label-sm-size);
    font-weight: var(--type-label-sm-weight);
    letter-spacing: var(--type-label-sm-letter-spacing);
    line-height: 1.3;
    text-transform: uppercase;
  }

  .field__label-row > span {
    color: var(--form-muted);
  }

  input,
  textarea,
  :global(.contact-select-trigger) {
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--form-line);
    border-radius: 0;
    color: inherit;
    width: 100%;
  }

  input,
  :global(.contact-select-trigger) {
    min-height: 64px;
  }

  input,
  textarea {
    padding: 12px 0;
  }

  textarea {
    line-height: 1.5;
    min-height: 220px;
    resize: vertical;
  }

  input:hover,
  textarea:hover,
  :global(.contact-select-trigger:hover) {
    border-color: var(--color-on-primary);
  }

  input:focus,
  textarea:focus {
    border-color: var(--color-tertiary);
  }

  .field.error input,
  .field.error textarea {
    border-color: var(--color-error);
  }

  .field__help,
  .field__error {
    font-size: var(--type-body-sm-size);
    line-height: var(--type-body-sm-line-height);
  }

  .field__help {
    color: var(--form-muted);
  }

  .field__error {
    color: color-mix(in srgb, var(--color-error) 55%, white);
  }

  :global(.contact-form__capabilities) {
    border: 0;
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
  }

  .capability-grid {
    border-bottom: 1px solid var(--form-line);
    display: grid;
    margin-top: 12px;
  }

  .capability-option {
    align-items: start;
    border-top: 1px solid var(--form-line);
    display: grid;
    gap: 16px;
    grid-template-columns: 28px minmax(0, 1fr);
    min-width: 0;
    padding: 22px 0;
  }

  :global(.contact-checkbox) {
    align-items: center;
    background: transparent;
    border: 1px solid var(--form-muted);
    color: var(--color-on-primary);
    cursor: pointer;
    display: inline-flex;
    height: 24px;
    justify-content: center;
    padding: 0;
    width: 24px;
  }

  :global(.contact-checkbox[data-state='checked']) {
    background: var(--color-tertiary);
    border-color: var(--color-tertiary);
    color: var(--color-on-tertiary);
  }

  .contact-checkbox__mark {
    font-family: var(--font-mono);
    font-size: 1rem;
    line-height: 1;
  }

  :global(.capability-option__label) {
    cursor: pointer;
    display: grid;
    gap: 8px;
    grid-template-columns: 36px minmax(0, 1fr);
    min-width: 0;
  }

  :global(.capability-option__label) strong {
    font-size: clamp(1.125rem, 1.6vw, 1.375rem);
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .capability-option__description {
    color: var(--form-muted);
    grid-column: 2;
    line-height: 1.45;
  }

  .capability-option__index {
    color: var(--color-tertiary);
    font-family: var(--font-mono);
    font-size: var(--type-label-sm-size);
    padding-top: 5px;
  }

  .field--idea {
    max-width: none;
  }

  :global(.contact-select-trigger) {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    text-align: left;
  }

  :global(.contact-select-trigger[data-placeholder]) {
    color: var(--form-muted);
  }

  :global(.contact-select-content) {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-line);
    box-shadow: 0 18px 48px color-mix(in srgb, var(--color-primary) 24%, transparent);
    color: var(--color-primary);
    max-height: min(360px, var(--bits-select-content-available-height));
    min-width: var(--bits-select-anchor-width);
    padding: 6px;
    z-index: 100;
  }

  :global(.contact-select-item) {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: 24px;
    justify-content: space-between;
    min-height: 48px;
    outline: none;
    padding: 10px 12px;
  }

  :global(.contact-select-item[data-highlighted]) {
    background: var(--color-surface);
  }

  :global(.contact-select-item[data-selected]) {
    color: var(--color-tertiary);
  }

  .contact-form__footer {
    align-items: end;
    border-top: 1px solid var(--form-line);
    display: grid;
    gap: 32px;
    padding-top: 24px;
  }

  .contact-form__footer > p {
    color: var(--form-muted);
    font-size: var(--type-body-sm-size);
  }

  :global(.contact-submit) {
    align-items: center;
    background: var(--color-tertiary);
    border: 0;
    color: var(--color-on-tertiary);
    cursor: pointer;
    display: inline-flex;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    gap: 48px;
    justify-content: space-between;
    justify-self: stretch;
    letter-spacing: 0.025em;
    min-height: 64px;
    padding: 16px 20px;
    text-transform: uppercase;
    transition: padding-inline var(--transition-fast);
  }

  :global(.contact-submit:hover) {
    padding-inline: 28px;
  }

  .contact-form__prototype {
    border: 1px solid var(--color-tertiary);
    display: grid;
    gap: 8px;
    padding: 20px;
  }

  .contact-form__prototype strong {
    color: var(--color-tertiary);
    font-family: var(--font-mono);
    font-size: var(--type-label-md-size);
    letter-spacing: var(--type-label-md-letter-spacing);
    text-transform: uppercase;
  }

  .contact-form__prototype span {
    color: var(--form-muted);
  }

  @media (min-width: 701px) {
    .contact-form__identity {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .capability-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .capability-option:nth-child(even) {
      padding-left: clamp(24px, 4vw, 64px);
    }

    .capability-option:nth-child(odd) {
      padding-right: clamp(24px, 4vw, 64px);
    }

    .contact-form__planning,
    .contact-form__footer {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :global(.contact-submit) {
      justify-self: end;
      width: min(100%, 420px);
    }
  }

  @media (min-width: 901px) {
    .contact-form__header {
      grid-template-columns: minmax(220px, 0.35fr) minmax(0, 1fr);
    }

    .contact-form__introduction p {
      justify-self: end;
      width: min(100%, 600px);
    }
  }

  @media (max-width: 700px) {
    .contact-form__inner {
      gap: 72px;
      padding-block: 72px;
    }

    h2 {
      font-size: clamp(3.5rem, 18vw, 5rem);
    }

    form {
      gap: 64px;
    }

    .contact-form__identity,
    .contact-form__planning {
      gap: 48px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.contact-submit) {
      transition: none;
    }
  }
</style>
