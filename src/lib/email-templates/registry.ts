import type { ComponentType } from 'react'
import { template as orderNotificationTemplate } from './order-notification'
import { template as orderConfirmationTemplate } from './order-confirmation'
import { template as orderStatusTemplate } from './order-status'
import { template as wholesaleApplicationTemplate } from './wholesale-application'
import { template as wholesaleApplicationConfirmationTemplate } from './wholesale-application-confirmation'
import { template as wholesaleDecisionTemplate } from './wholesale-decision'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-notification': orderNotificationTemplate,
  'order-confirmation': orderConfirmationTemplate,
  'order-status': orderStatusTemplate,
  'wholesale-application': wholesaleApplicationTemplate,
  'wholesale-application-confirmation': wholesaleApplicationConfirmationTemplate,
  'wholesale-decision': wholesaleDecisionTemplate,
}
