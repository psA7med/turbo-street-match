import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface OrderConfirmationProps {
  orderNumber?: string
  customerName?: string
  items?: Array<{ name?: string; color?: string; size?: string; quantity?: number; total?: number }>
  shipping?: number
  total?: number
}

const MARK_URL = 'https://id-preview--2bd82060-338d-4c72-a307-cc46f95bfa5c.lovable.app/__l5e/assets-v1/71333e05-c559-4e9b-a7df-39c2ad88b0fb/turbo-mark.svg'
const money = (value?: number) => `${(value ?? 0).toLocaleString('ar-EG')} جنيه`

function OrderConfirmationEmail({ orderNumber, customerName, items = [], shipping, total }: OrderConfirmationProps) {
  return <Html lang="ar" dir="rtl"><Head/><Preview>طلبك #{orderNumber ?? ''} وصلنا — TURBO</Preview><Body style={main}>
    <Container style={container}>
      <Section style={brand}><Img src={MARK_URL} width="74" height="42" alt="TURBO" style={mark}/><Text style={brandText}>TURBO</Text></Section>
      <Heading style={heading}>طلبك دخل الملعب.</Heading>
      <Text style={copy}>أهلاً {customerName ?? 'بيك'}، استلمنا طلبك وهنراجعه ونتواصل معاك لتأكيد التوصيل.</Text>
      <Section style={numberBox}><Text style={label}>رقم الطلب</Text><Text style={number}>#{orderNumber ?? '—'}</Text></Section>
      <Section>{items.map((item, index) => <Text key={index} style={itemStyle}>{item.name ?? 'قطعة'} · {item.color ?? ''} · {item.size ?? ''} × {item.quantity ?? 1}<strong style={price}>{money(item.total)}</strong></Text>)}</Section>
      <Hr style={rule}/><Text style={summary}>الشحن: {money(shipping)}</Text><Text style={totalStyle}>الإجمالي: {money(total)} — الدفع عند الاستلام</Text>
      <Text style={footer}>هنبعت لك أي تحديث مهم على طلبك. شكرًا إنك اخترت TURBO.</Text>
    </Container>
  </Body></Html>
}

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) => `طلبك #${data['orderNumber'] ?? ''} وصلنا — TURBO`,
  displayName: 'تأكيد الطلب للعميل',
  previewData: { orderNumber: 'TRB-12345', customerName: 'أحمد', items: [{ name: 'تيشيرت تدريب', color: 'أسود', size: 'L', quantity: 1, total: 450 }], shipping: 50, total: 500 } satisfies OrderConfirmationProps,
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif', padding: '24px 12px' }
const container = { border: '1px solid #E9E8E5', maxWidth: '560px', margin: '0 auto', padding: '32px' }
const brand = { backgroundColor: '#111111', padding: '16px 20px' }
const mark = { display: 'inline-block', objectFit: 'contain' as const, verticalAlign: 'middle' }
const brandText = { color: '#FFFFFF', display: 'inline-block', fontSize: '22px', fontWeight: 'bold', margin: '0 12px', verticalAlign: 'middle' }
const heading = { color: '#111111', fontSize: '28px', margin: '28px 0 12px' }
const copy = { color: '#3A3A3A', fontSize: '15px', lineHeight: '1.9' }
const numberBox = { backgroundColor: '#F5F3EE', borderRight: '4px solid #FF4D00', margin: '22px 0', padding: '14px 18px' }
const label = { color: '#737373', fontSize: '12px', margin: 0 }
const number = { color: '#111111', direction: 'ltr' as const, fontSize: '22px', fontWeight: 'bold', margin: '4px 0 0', textAlign: 'right' as const }
const itemStyle = { borderBottom: '1px solid #E9E8E5', color: '#111111', fontSize: '14px', margin: 0, padding: '12px 0' }
const price = { color: '#111111', float: 'left' as const }
const rule = { borderColor: '#E9E8E5', margin: '20px 0' }
const summary = { color: '#737373', fontSize: '14px' }
const totalStyle = { color: '#111111', fontSize: '17px', fontWeight: 'bold' }
const footer = { color: '#737373', fontSize: '12px', lineHeight: '1.8', marginTop: '28px' }