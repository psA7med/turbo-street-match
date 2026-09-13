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
          <Heading style={{ color: '#111111', fontSize: '22px', margin: '0 0 4px' }}>
            TURBO — طلب تاجر جملة
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
