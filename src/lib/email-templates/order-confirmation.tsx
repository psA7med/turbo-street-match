import { Heading, Hr, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'
import type { TemplateEntry } from './registry'

export interface OrderConfirmationProps {
  orderNumber?: string
  customerName?: string
  items?: Array<{ name?: string; color?: string; size?: string; quantity?: number; total?: number }>
  shipping?: number
  total?: number
}

const money = (value?: number) => `${(value ?? 0).toLocaleString('ar-EG')} جنيه`

function OrderConfirmationEmail({ orderNumber, customerName, items = [], shipping, total }: OrderConfirmationProps) {
  return (
    <EmailLayout preview={`طلبك #${orderNumber ?? ''} وصلنا — TURBO`}>
      <Heading style={emailStyles.heading}>طلبك دخل الملعب.</Heading>
      <Text style={emailStyles.text}>أهلاً {customerName ?? 'بيك'}، استلمنا طلبك وهنراجعه ونتواصل معاك لتأكيد التوصيل.</Text>
      
      <Section style={numberBox}>
        <Text style={{ color: '#737373', fontSize: '12px', margin: 0 }}>رقم الطلب</Text>
        <Text style={{ color: '#111111', direction: 'ltr', fontSize: '22px', fontWeight: 'bold', margin: '4px 0 0', textAlign: 'right' }}>#{orderNumber ?? '—'}</Text>
      </Section>

      <Section>
        {items.map((item, index) => (
          <Text key={index} style={{ borderBottom: '1px solid #E9E8E5', color: '#111111', fontSize: '14px', margin: 0, padding: '12px 0' }}>
            {item.name ?? 'قطعة'} · {item.color ?? ''} · {item.size ?? ''} × {item.quantity ?? 1}
            <strong style={{ color: '#111111', float: 'left' }}>{money(item.total)}</strong>
          </Text>
        ))}
      </Section>

      <Hr style={emailStyles.rule}/>
      <Text style={{ color: '#737373', fontSize: '14px' }}>الشحن: {money(shipping)}</Text>
      <Text style={{ color: '#111111', fontSize: '17px', fontWeight: 'bold' }}>الإجمالي: {money(total)} — الدفع عند الاستلام</Text>
      <Text style={emailStyles.muted}>هنبعت لك أي تحديث مهم على طلبك. شكرًا إنك اخترت TURBO.</Text>
    </EmailLayout>
  )
}

const numberBox = { backgroundColor: '#F5F3EE', borderRight: '4px solid #FF4D00', margin: '22px 0', padding: '14px 18px' }

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) => `طلبك #${data['orderNumber'] ?? ''} وصلنا — TURBO`,
  displayName: 'تأكيد الطلب للعميل',
  previewData: { orderNumber: 'TRB-12345', customerName: 'أحمد', items: [{ name: 'تيشيرت تدريب', color: 'أسود', size: 'L', quantity: 1, total: 450 }], shipping: 50, total: 500 } satisfies OrderConfirmationProps,
} satisfies TemplateEntry
