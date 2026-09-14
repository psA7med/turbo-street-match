import { Heading, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'
import type { TemplateEntry } from './registry'

export interface WholesaleDecisionProps {
  customerName?: string
  businessName?: string
  approved?: boolean
  /** Store-inbox copy of the same decision. */
  storeCopy?: boolean
  accountEmail?: string
}

function WholesaleDecisionEmail({ customerName, businessName, approved, storeCopy, accountEmail }: WholesaleDecisionProps) {
  return (
    <EmailLayout preview={approved ? 'تم قبول طلب الجملة — TURBO' : 'تحديث على طلب الجملة — TURBO'}>
      <Heading style={emailStyles.heading}>
        {storeCopy ? 'نسخة إدارية — قرار طلب جملة' : approved ? 'مبروك، انت تاجر TURBO' : 'تحديث على طلب الجملة'}
      </Heading>
      {storeCopy ? (
        <Text style={emailStyles.text}>
          {`تم ${approved ? 'قبول' : 'رفض'} طلب ${businessName ?? 'نشاط'} لصاحبه ${customerName ?? '—'}${accountEmail ? ` (${accountEmail})` : ''}.`}
        </Text>
      ) : null}
      <Text style={emailStyles.text}>
        أهلًا {customerName ?? 'بيك'}، {approved
          ? `تم قبول طلب انضمام ${businessName ?? 'نشاطك'} لتجار TURBO. ابدأ من بوابة الجملة في حسابك وهتلاقي أسعار الجملة والحد الأدنى للكميات.`
          : `راجعنا طلب انضمام ${businessName ?? 'نشاطك'} ومقدرناش نكمله في الوقت الحالي. حسابك شغال عادي كعميل تجزئة، وتقدر تقدّم تاني في أي وقت.`}
      </Text>
      <Section style={{ backgroundColor: '#F5F3EE', border: '1px solid #E9E8E5', borderRadius: '8px', padding: '14px 18px' }}>
        <Text style={{ color: '#111111', fontSize: '14px', fontWeight: 700, margin: 0 }}>{approved ? 'الحالة: مقبول' : 'الحالة: مرفوض'}</Text>
      </Section>
      <Text style={emailStyles.muted}>لأي استفسار عن شروط الجملة، ردّ على الرسالة دي.</Text>
    </EmailLayout>
  )
}

export const template = {
  component: WholesaleDecisionEmail,
  subject: (data: Record<string, any>) => data['approved'] ? 'تم قبول طلب الجملة — TURBO' : 'تحديث على طلب الجملة — TURBO',
  displayName: 'قرار طلب الجملة',
  previewData: { customerName: 'أحمد', businessName: 'محل النجم الرياضي', approved: true } satisfies WholesaleDecisionProps,
} satisfies TemplateEntry
