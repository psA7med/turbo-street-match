import { Heading, Hr, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'
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
    <Text key={label} style={{ margin: '4px 0', color: '#111111', fontSize: '14px' }}>
      <strong>{label}:</strong> {ltr ? <span dir="ltr">{value}</span> : value}
    </Text>
  ) : null

function WholesaleApplicationEmail(props: WholesaleApplicationProps) {
  return (
    <EmailLayout preview={`طلب تاجر جملة جديد — ${props.businessName ?? ''}`}>
      <Heading style={emailStyles.heading}>طلب تاجر جملة جديد</Heading>
      <Text style={{ color: '#FF4D00', fontSize: '18px', fontWeight: 'bold', margin: '-8px 0 16px' }}>
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

      <Hr style={emailStyles.rule} />

      <Text style={{ margin: '0 0 8px', color: '#111111', fontWeight: 'bold' }}>بيانات الحساب</Text>
      <Section>
        {row('البريد', props.accountEmail, true)}
        {row('الاسم في الحساب', props.accountName)}
        {row('موبايل الحساب', props.accountPhone, true)}
        {row('تاريخ إنشاء الحساب', props.accountCreatedAt)}
        {row('تاريخ إرسال الطلب', props.submittedAt)}
      </Section>
    </EmailLayout>
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
