import { Heading, Hr, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'
import type { TemplateEntry } from './registry'

export interface OrderNotificationProps {
  orderNumber?: string
  customerName?: string
  phone?: string
  email?: string
  governorate?: string
  city?: string
  streetAddress?: string
  landmark?: string
  items?: Array<{ name?: string; color?: string; size?: string; quantity?: number; total?: number }>
  subtotal?: number
  shipping?: number
  total?: number
}

const money = (value?: number) => `${(value ?? 0).toLocaleString('en-EG', { maximumFractionDigits: 2 })} EGP`

function OrderNotificationEmail(props: OrderNotificationProps) {
  const items = props.items ?? []
  return (
    <EmailLayout preview={`طلب جديد #${props.orderNumber ?? ''} — TURBO`}>
      <Heading style={emailStyles.heading}>طلب جديد</Heading>
      <Text style={{ color: '#FF4D00', fontSize: '18px', fontWeight: 'bold', margin: '-8px 0 16px' }}>
        #{props.orderNumber ?? '—'}
      </Text>

      <Section>
        <Text style={rowStyle}><strong>العميل:</strong> {props.customerName ?? '—'}</Text>
        <Text style={rowStyle}><strong>الموبايل:</strong> <span dir="ltr">{props.phone ?? '—'}</span></Text>
        {props.email && <Text style={rowStyle}><strong>البريد:</strong> <span dir="ltr">{props.email}</span></Text>}
        <Text style={rowStyle}>
          <strong>العنوان:</strong> {props.governorate ?? '—'} — {props.city ?? '—'} — {props.streetAddress ?? '—'}
          {props.landmark ? ` (${props.landmark})` : ''}
        </Text>
      </Section>

      <Hr style={emailStyles.rule} />

      <Section>
        {items.map((item, index) => (
          <Text key={index} style={rowStyle}>
            • {item.name ?? 'قطعة'} — {item.color ?? ''} / {item.size ?? ''} × {item.quantity ?? 1} — {money(item.total)}
          </Text>
        ))}
      </Section>

      <Hr style={emailStyles.rule} />

      <Text style={rowStyle}>الإجمالي الفرعي: {money(props.subtotal)}</Text>
      <Text style={rowStyle}>الشحن: {money(props.shipping)}</Text>
      <Text style={{ color: '#111111', fontSize: '18px', fontWeight: 'bold', margin: '8px 0 0' }}>
        الإجمالي: {money(props.total)} — الدفع عند الاستلام
      </Text>
    </EmailLayout>
  )
}

const rowStyle = { margin: '4px 0', color: '#111111', fontSize: '14px' }

export const template = {
  component: OrderNotificationEmail,
  subject: (data: Record<string, any>) => `طلب جديد #${data['orderNumber'] ?? ''} — TURBO`,
  displayName: 'إشعار طلب جديد (للإدارة)',
  to: 'turpoclothes@gmail.com',
  previewData: {
    orderNumber: 'TRB-12345',
    customerName: 'أحمد علي',
    phone: '01012345678',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    streetAddress: '١٥ شارع عباس العقاد',
    items: [{ name: 'تيشيرت تدريب', color: 'أسود', size: 'L', quantity: 2, total: 700 }],
    subtotal: 700,
    shipping: 50,
    total: 750,
  } satisfies OrderNotificationProps,
} satisfies TemplateEntry
