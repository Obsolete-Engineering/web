import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { getSecret } from 'astro:env/server';

import { contactPageCopy } from '../copy';
import { submitToWeb3Forms } from './web3forms';

const capabilityValues = ['direction', 'design', 'engineering', 'not-sure'] as const;
const budgetValues = ['under-5k', '5k-10k', '10k-25k', '25k-50k', '50k-plus', 'not-sure'] as const;
const startWindowValues = [
  'asap',
  '1-3-months',
  '3-6-months',
  '6-plus-months',
  'flexible',
] as const;

const validation = contactPageCopy.form.validation;

export const server = {
  submitInquiry: defineAction({
    input: z.object({
      name: z.string().trim().min(1, validation.name),
      email: z
        .string()
        .trim()
        .min(1, validation.emailRequired)
        .pipe(z.email({ error: validation.emailInvalid })),
      organization: z.string().trim().optional(),
      capabilities: z.array(z.enum(capabilityValues)).min(1, validation.capabilities),
      idea: z.string().trim().min(1, validation.idea),
      budget: z.enum(budgetValues).optional(),
      startWindow: z.enum(startWindowValues).optional(),
    }),
    handler: async (input, context) => {
      const accessKey = getSecret('WEB3FORMS_ACCESS_KEY');

      if (!accessKey) {
        context.logger.error('WEB3FORMS_ACCESS_KEY is not configured.');
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Contact form delivery is not configured.',
        });
      }

      const capabilityLabels = input.capabilities.map(
        (value) =>
          contactPageCopy.form.fields.capabilities.options.find((option) => option.value === value)
            ?.label ?? value,
      );
      const budgetLabel = contactPageCopy.form.fields.budget.options.find(
        (option) => option.value === input.budget,
      )?.label;
      const startWindowLabel = contactPageCopy.form.fields.startWindow.options.find(
        (option) => option.value === input.startWindow,
      )?.label;
      const payload: Record<string, string> = {
        access_key: accessKey,
        subject: 'New project inquiry from the Obsolete website',
        from_name: 'Obsolete website',
        name: input.name,
        email: input.email,
        message: input.idea,
        capabilities: capabilityLabels.join(', '),
      };

      if (input.organization) payload.organization = input.organization;
      if (budgetLabel) payload.budget = budgetLabel;
      if (startWindowLabel) payload.start_window = startWindowLabel;

      try {
        await submitToWeb3Forms(payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown delivery error';
        context.logger.error(`Web3Forms submission failed: ${message}`);
        throw new ActionError({
          code: 'BAD_GATEWAY',
          message: 'The inquiry could not be delivered.',
        });
      }

      return { delivered: true };
    },
  }),
};
