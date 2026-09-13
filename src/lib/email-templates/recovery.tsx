import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <EmailLayout preview={`استعادة كلمة المرور لـ ${siteName}`}>
    <Heading style={emailStyles.heading}>استعادة كلمة المرور</Heading>
    <Text style={emailStyles.text}>
      وصلنا طلب لتغيير كلمة مرور حسابك في <strong>{siteName}</strong>. اضغط على الزرار تحت عشان تختار كلمة مرور جديدة.
    </Text>
    <Button className="dm-btn" style={emailStyles.button} href={confirmationUrl}>
      تغيير كلمة المرور
    </Button>
    <Text style={emailStyles.muted}>
      لو معملتش الطلب ده، تقدر تتجاهل الرسالة بأمان. كلمة مرورك مش هتتغير.
    </Text>
  </EmailLayout>
)

export default RecoveryEmail
