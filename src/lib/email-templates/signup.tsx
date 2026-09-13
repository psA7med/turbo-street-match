import * as React from 'react'
import { Button, Heading, Link, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <EmailLayout preview="كود تأكيد حسابك في TURBO">
    <Heading style={emailStyles.heading}>أكد بريدك الإلكتروني</Heading>
    <Text style={emailStyles.text}>
      أهلاً بيك في{' '}
      <Link href={siteUrl} style={{ color: '#FF4D00', textDecoration: 'underline' }}>
        <strong>{siteName}</strong>
      </Link>
      . استخدم الكود التالي لإكمال حسابك:
    </Text>
    {token ? <Text style={emailStyles.code}>{token}</Text> : null}
    <Button className="dm-btn" style={emailStyles.button} href={confirmationUrl}>
      تأكيد البريد
    </Button>
    <Text style={{ ...emailStyles.muted, direction: 'ltr', textAlign: 'right' }}>
      <Link href={`mailto:${recipient}`} style={{ color: 'inherit' }}>{recipient}</Link>
    </Text>
    <Text style={emailStyles.muted}>
      لو أنت ما أنشأتش الحساب، تجاهل الرسالة بأمان.
    </Text>
  </EmailLayout>
)

export default SignupEmail
