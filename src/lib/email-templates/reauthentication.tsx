import * as React from 'react'
import { Heading, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './email-layout'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailLayout preview="كود تأكيد هويتك">
    <Heading style={emailStyles.heading}>تأكيد هويتك</Heading>
    <Text style={emailStyles.text}>استخدم الكود ده لتأكيد هويتك:</Text>
    <Text style={emailStyles.code}>{token}</Text>
    <Text style={emailStyles.muted}>
      الكود ده هيخلص قريب. لو مكنتش أنت اللي طلبت ده، تقدر تتجاهل الرسالة بأمان.
    </Text>
  </EmailLayout>
)

export default ReauthenticationEmail
