import * as React from 'react'
import { Button, Heading, Link, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailLayout preview={`تأكيد تغيير البريد الإلكتروني لـ ${siteName}`}>
    <Heading style={emailStyles.heading}>تأكيد تغيير البريد الإلكتروني</Heading>
    <Text style={emailStyles.text}>
      طلبت تغيير بريدك الإلكتروني لـ <strong>{siteName}</strong> من{' '}
      <Link href={`mailto:${oldEmail}`} style={{ color: '#FF4D00' }}>{oldEmail}</Link>{' '}
      إلى{' '}
      <Link href={`mailto:${newEmail}`} style={{ color: '#FF4D00' }}>{newEmail}</Link>.
    </Text>
    <Text style={emailStyles.text}>اضغط على الزرار تحت لتأكيد التغيير:</Text>
    <Button className="dm-btn" style={emailStyles.button} href={confirmationUrl}>
      تأكيد تغيير البريد
    </Button>
    <Text style={emailStyles.muted}>
      لو مكنتش طلبت التغيير ده، يرجى تأمين حسابك فوراً.
    </Text>
  </EmailLayout>
)

export default EmailChangeEmail
