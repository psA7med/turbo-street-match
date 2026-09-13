import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  newEmail: string
  confirmationUrl: string
}

const MARK_URL = 'https://id-preview--2bd82060-338d-4c72-a307-cc46f95bfa5c.lovable.app/__l5e/assets-v1/71333e05-c559-4e9b-a7df-39c2ad88b0fb/turbo-mark.svg'

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>تأكيد تغيير البريد الإلكتروني لـ {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}><Img src={MARK_URL} width="70" height="40" alt="TURBO" style={mark}/> <Text style={brandName}>TURBO</Text></Section>
        <Heading style={h1}>تأكيد تغيير البريد الإلكتروني</Heading>
        <Text style={text}>
          طلبت تغيير بريدك الإلكتروني لـ <strong>{siteName}</strong> من{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          إلى{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>.
        </Text>
        <Text style={text}>اضغط على الزرار تحت لتأكيد التغيير:</Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          تأكيد تغيير البريد
        </Button>
        <Text style={footer}>
          لو مكنتش طلبت التغيير ده، يرجى تأمين حسابك فوراً.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif' }
const container = { border: '1px solid #E9E8E5', margin: '24px auto', maxWidth: '520px', padding: '32px' }
const brand = { backgroundColor: '#111111', color: '#FF4D00', margin: '0 0 28px', padding: '18px 20px' }
const mark = { display: 'inline-block', objectFit: 'contain' as const, verticalAlign: 'middle' }
const brandName = { color: '#FFFFFF', display: 'inline-block', fontSize: '24px', fontWeight: 'bold' as const, marginRight: '12px', verticalAlign: 'middle' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#3A3A3A', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const button = { backgroundColor: '#FF4D00', color: '#ffffff', fontSize: '14px', border: '1px solid #FF4D00', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#737373', margin: '30px 0 0' }
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  [data-ogsb] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
`
