import { Heading, Hr, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'
import type { TemplateEntry } from './registry'

export interface OrderStatusProps {
  orderNumber?: string
  customerName?: string
  statusLabel?: string
  statusNote?: string
  paymentLabel?: string
  carrier?: string
  trackingNumber?: string
  eta?: string
  total?: number
  /** Store-inbox copy of the same update. */
  storeCopy?: boolean
  email?: string
}

const money = (value?: number) => `${(value ?? 0).toLocaleString('ar-EG')} جنيه`

const row = (label: string, value?: string, ltr = false) => value ? (
  <Text key={label} style={{ color: '#3A3A3A', fontSize: '14px', lineHeight: '1.8', margin: '5px 0' }}>
    <strong style={{ color: '#111111' }}>{label}:</strong> {ltr ? <span dir="ltr">{value}</span> : value}
  </Text>
) : null

function OrderStatusEmail(props: OrderStatusProps) {
  return (
    <EmailLayout preview={`تحديث على طلبك #${props.orderNumber ?? ''} — ${props.statusLabel ?? ''}`}>
      <Heading style={emailStyles.heading}>تحديث على طلبك</Heading>
      <Text style={emailStyles.text}>أهلًا {props.customerName ?? 'بيك'}، حالة طلبك اتغيرت.</Text>

      <Section style={statusBox}>
        <Text style={{ color: '#737373', fontSize: '12px', margin: 0 }}>رقم الطلب</Text>
        <Text style={{ color: '#111111', direction: 'ltr', fontSize: '20px', fontWeight: 'bold', margin: '4px 0 10px', textAlign: 'right' }}>#{props.orderNumber ?? '—'}</Text>
        <Text style={{ color: '#FF4D00', fontSize: '17px', fontWeight: 'bold', margin: 0 }}>{props.statusLabel ?? '—'}</Text>
      </Section>

      {props.statusNote ? <Text style={emailStyles.text}>{props.statusNote}</Text> : null}

      <Hr style={emailStyles.rule} />
      {row('حالة الدفع', props.paymentLabel)}
      {row('شركة الشحن', props.carrier)}
      {row('رقم التتبع', props.trackingNumber, true)}
      {row('التوصيل المتوقع', props.eta)}
      {props.total ? row('الإجمالي', money(props.total)) : null}
      <Text style={emailStyles.muted}>لو محتاج أي مساعدة، ردّ على الرسالة دي وإحنا معاك.</Text>
    </EmailLayout>
  )
}

const statusBox = { backgroundColor: '#F5F3EE', borderRight: '4px solid #FF4D00', margin: '22px 0', padding: '14px 18px' }

export const template = {
  component: OrderStatusEmail,
  subject: (data: Record<string, any>) => `طلبك #${data['orderNumber'] ?? ''} — ${data['statusLabel'] ?? 'تحديث'}`,
  displayName: 'تحديث حالة الطلب',
  previewData: { orderNumber: 'TRB-12345', customerName: 'أحمد', statusLabel: 'تم الشحن', paymentLabel: 'الدفع عند الاستلام', carrier: 'بوسطة', trackingNumber: 'EG123456', eta: '١٦ سبتمبر ٢٠٢٦', total: 500 } satisfies OrderStatusProps,
} satisfies TemplateEntry
