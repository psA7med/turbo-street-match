import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <EmailLayout preview={`رابط تسجيل الدخول لـ ${siteName}`}>
    <Heading style={emailStyles.heading}>رابط تسجيل الدخول</Heading>
    <Text style={emailStyles.text}>
      اضغط على الزرار تحت عشان تدخل لحسابك في <strong>{siteName}</strong>. الرابط ده هيخلص قريب.
    </Text>
    <Button className="dm-btn" style={emailStyles.button} href={confirmationUrl}>
      تسجيل الدخول
    </Button>
    <Text style={emailStyles.muted}>
      لو مكنتش طلبت الرابط ده، تقدر تتجاهل الرسالة بأمان.
    </Text>
  </EmailLayout>
)

export default MagicLinkEmail
