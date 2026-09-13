import { Heading, Hr, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'
import type { TemplateEntry } from './registry'

export interface WholesaleApplicationConfirmationProps {
  customerName?: string
  businessName?: string
  contactName?: string
  phone?: string
  governorate?: string
  address?: string
  businessType?: string
  taxRegistration?: string
  accountEmail?: string
  submittedAt?: string
}

const row = (label: string, value?: string, ltr = false) => value ? (
  <Text key={label} style={{ margin: '5px 0', color: '#3A3A3A', fontSize: '14px', lineHeight: '1.8' }}>
    <strong style={{ color: '#111111' }}>{label}:</strong> {ltr ? <span dir="ltr">{value}</span> : value}
  </Text>
) : null

function WholesaleApplicationConfirmationEmail(props: WholesaleApplicationConfirmationProps) {
  return (
    <EmailLayout preview={`استلمنا طلب انضمام ${props.businessName ?? 'نشاطك'} لتجار TURBO`}>
      <Heading style={emailStyles.heading}>طلب الجملة وصلنا</Heading>
      <Text style={emailStyles.text}>أهلًا {props.customerName ?? props.contactName ?? 'بيك'}، استلمنا بيانات نشاطك وهنراجعها. هتقدر تتابع الحالة من حسابك، وهنبلغك أول ما تتحدث.</Text>
      <Section style={{ backgroundColor: '#F5F3EE', border: '1px solid #E9E8E5', borderRadius: '8px', padding: '14px 18px' }}>
        {row('اسم النشاط', props.businessName)}
        {row('اسم المسؤول', props.contactName)}
        {row('الموبايل', props.phone, true)}
        {row('المحافظة', props.governorate)}
        {row('العنوان', props.address)}
        {row('نوع النشاط', props.businessType)}
        {row('التسجيل الضريبي', props.taxRegistration, true)}
      </Section>
      <Hr style={emailStyles.rule} />
      {row('بريد الحساب', props.accountEmail, true)}
      {row('تاريخ التقديم', props.submittedAt)}
      <Text style={emailStyles.muted}>أسعار الجملة والكتالوج التجاري يفضلوا محميين لحد موافقة الإدارة.</Text>
    </EmailLayout>
  )
}

export const template = {
  component: WholesaleApplicationConfirmationEmail,
  subject: (data: Record<string, any>) => `استلمنا طلب الجملة — ${data['businessName'] ?? 'TURBO'}`,
  displayName: 'تأكيد طلب الجملة للعميل',
  previewData: {
    customerName: 'أحمد علي', businessName: 'محل النجم الرياضي', contactName: 'أحمد علي',
    phone: '01012345678', governorate: 'الجيزة', address: '١٢ شارع الهرم', businessType: 'محل',
    accountEmail: 'dealer@example.com', submittedAt: '١٣ سبتمبر ٢٠٢٦',
  } satisfies WholesaleApplicationConfirmationProps,
} satisfies TemplateEntry