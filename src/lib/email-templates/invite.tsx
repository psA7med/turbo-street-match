import * as React from 'react'
import { Button, Heading, Link, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <EmailLayout preview={`تمت دعوتك للانضمام لـ ${siteName}`}>
    <Heading style={emailStyles.heading}>دعوة للانضمام</Heading>
    <Text style={emailStyles.text}>
      تمت دعوتك للانضمام لـ{' '}
      <Link href={siteUrl} style={{ color: '#FF4D00', textDecoration: 'underline' }}>
        <strong>{siteName}</strong>
      </Link>
      . اضغط على الزرار تحت عشان تقبل الدعوة وتنشئ حسابك.
    </Text>
    <Button className="dm-btn" style={emailStyles.button} href={confirmationUrl}>
      قبول الدعوة
    </Button>
    <Text style={emailStyles.muted}>
      لو مكنتش مستني الدعوة دي، تقدر تتجاهل الرسالة بأمان.
    </Text>
  </EmailLayout>
)

export default InviteEmail
