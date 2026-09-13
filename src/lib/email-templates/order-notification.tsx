import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
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

const money = (value?: number) =>
  `${(value ?? 0).toLocaleString('en-EG', { maximumFractionDigits: 2 })} EGP`

function OrderNotificationEmail(props: OrderNotificationProps) {
  const items = props.items ?? []
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>{`طلب جديد #${props.orderNumber ?? ''} — TURBO`}</Preview>
      <Body style={{ backgroundColor: '#F5F3EE', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#FFFFFF',
            margin: '24px auto',
            padding: '32px',
            maxWidth: '560px',
            border: '1px solid #E9E8E5',
          }}
        >
          <Heading style={{ color: '#111111', fontSize: '22px', margin: '0 0 4px' }}>
            TURBO — طلب جديد
          </Heading>
          <Text style={{ color: '#FF4D00', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px' }}>
            #{props.orderNumber ?? '—'}
          </Text>

          <Section>
            <Text style={{ margin: '4px 0', color: '#111111' }}>
              <strong>العميل:</strong> {props.customerName ?? '—'}
            </Text>
            <Text style={{ margin: '4px 0', color: '#111111' }}>
              <strong>الموبايل:</strong> <span dir="ltr">{props.phone ?? '—'}</span>
            </Text>
            {props.email ? (
              <Text style={{ margin: '4px 0', color: '#111111' }}>
                <strong>البريد:</strong> <span dir="ltr">{props.email}</span>
              </Text>
            ) : null}
            <Text style={{ margin: '4px 0', color: '#111111' }}>
              <strong>العنوان:</strong> {props.governorate ?? '—'} — {props.city ?? '—'} —{' '}
              {props.streetAddress ?? '—'}
              {props.landmark ? ` (${props.landmark})` : ''}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#E9E8E5', margin: '16px 0' }} />

          <Section>
            {items.map((item, index) => (
              <Text key={index} style={{ margin: '4px 0', color: '#111111' }}>
                • {item.name ?? 'قطعة'} — {item.color ?? ''} / {item.size ?? ''} ×
                {item.quantity ?? 1} — {money(item.total)}
              </Text>
            ))}
          </Section>

          <Hr style={{ borderColor: '#E9E8E5', margin: '16px 0' }} />

          <Text style={{ margin: '4px 0', color: '#3A3A3A' }}>
            الإجمالي الفرعي: {money(props.subtotal)}
          </Text>
          <Text style={{ margin: '4px 0', color: '#3A3A3A' }}>الشحن: {money(props.shipping)}</Text>
          <Text style={{ margin: '8px 0 0', color: '#111111', fontSize: '18px', fontWeight: 'bold' }}>
            الإجمالي: {money(props.total)} — الدفع عند الاستلام
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderNotificationEmail,
  subject: (data: Record<string, any>) => `طلب جديد #${data.orderNumber ?? ''} — TURBO`,
  displayName: 'إشعار طلب جديد (للإدارة)',
  to: 'turpoclothes@gmail.com',
  previewData: {
    orderNumber: 'TRB-12345',
    customerName: 'أحمد علي',
    phone: '01012345678',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    streetAddress: '١٥ شارع عباس العقاد',
    items: [
      { name: 'تيشيرت تدريب', color: 'أسود', size: 'L', quantity: 2, total: 700 },
      { name: 'بنطلون رياضي', color: 'رمادي', size: 'XL', quantity: 1, total: 550 },
    ],
    subtotal: 1250,
    shipping: 50,
    total: 1300,
  } satisfies OrderNotificationProps,
} satisfies TemplateEntry
