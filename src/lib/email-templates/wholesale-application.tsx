import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface WholesaleApplicationProps {
  businessName?: string
  contactName?: string
  phone?: string
  governorate?: string
  address?: string
  businessType?: string
  taxRegistration?: string
  notes?: string
  accountEmail?: string
  accountName?: string
  accountPhone?: string
  accountCreatedAt?: string
  submittedAt?: string
}

const MARK_URL = 'https://id-preview--2bd82060-338d-4c72-a307-cc46f95bfa5c.lovable.app/__l5e/assets-v1/71333e05-c559-4e9b-a7df-39c2ad88b0fb/turbo-mark.svg'

const row = (label: string, value?: string, ltr = false) =>
  value ? (
    <Text key={label} style={{ margin: '4px 0', color: '#111111' }}>
      <strong>{label}:</strong> {ltr ? <span dir="ltr">{value}</span> : value}
    </Text>
  ) : null

function WholesaleApplicationEmail(props: WholesaleApplicationProps) {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>{`طلب تاجر جملة جديد — ${props.businessName ?? ''}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#FFFFFF',
            margin: '24px auto',
            padding: '32px',
            maxWidth: '560px',
            border: '1px solid #E9E8E5',
          }}
        >
          <Section style={brand}><Img src={MARK_URL} width="70" height="40" alt="TURBO" style={mark}/> <Text style={brandName}>TURBO</Text></Section>
          <Heading style={{ color: '#111111', fontSize: '22px', margin: '0 0 4px' }}>
            طلب تاجر جملة جديد
          </Heading>
          <Text style={{ color: '#FF4D00', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px' }}>
            {props.businessName ?? '—'}
          </Text>

          <Section>
            {row('اسم النشاط', props.businessName)}
            {row('اسم المسؤول', props.contactName)}
            {row('الموبايل', props.phone, true)}
            {row('المحافظة', props.governorate)}
            {row('عنوان النشاط', props.address)}
            {row('نوع النشاط', props.businessType)}
            {row('التسجيل الضريبي', props.taxRegistration, true)}
            {row('ملاحظات', props.notes)}
          </Section>

          <Hr style={{ borderColor: '#E9E8E5', margin: '16px 0' }} />

          <Text style={{ margin: '0 0 8px', color: '#111111', fontWeight: 'bold' }}>
            بيانات الحساب
          </Text>
          <Section>
            {row('البريد', props.accountEmail, true)}
            {row('الاسم في الحساب', props.accountName)}
            {row('موبايل الحساب', props.accountPhone, true)}
            {row('تاريخ إنشاء الحساب', props.accountCreatedAt)}
            {row('تاريخ إرسال الطلب', props.submittedAt)}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WholesaleApplicationEmail,
  subject: (data: Record<string, any>) => `طلب تاجر جملة — ${data['businessName'] ?? 'TURBO'}`,
  displayName: 'طلب تاجر جملة (للإدارة)',
  to: 'turpoclothes@gmail.com',
  previewData: {
    businessName: 'محل النجم الرياضي',
    contactName: 'أحمد علي',
    phone: '01012345678',
    governorate: 'الجيزة',
    address: '١٢ شارع الهرم',
    businessType: 'محل',
    accountEmail: 'dealer@example.com',
    accountName: 'أحمد علي',
    accountPhone: '01012345678',
    accountCreatedAt: '2026-09-01',
    submittedAt: '2026-09-13',
  } satisfies WholesaleApplicationProps,
} satisfies TemplateEntry

const brand = { backgroundColor: '#111111', color: '#FF4D00', margin: '0 0 28px', padding: '18px 20px' }
const mark = { display: 'inline-block', objectFit: 'contain' as const, verticalAlign: 'middle' }
const brandName = { color: '#FFFFFF', display: 'inline-block', fontSize: '24px', fontWeight: 'bold' as const, marginRight: '12px', verticalAlign: 'middle' }
