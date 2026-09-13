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
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

const MARK_URL = 'https://id-preview--2bd82060-338d-4c72-a307-cc46f95bfa5c.lovable.app/__l5e/assets-v1/71333e05-c559-4e9b-a7df-39c2ad88b0fb/turbo-mark.svg'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>كود تأكيد حسابك في TURBO</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}><Img src={MARK_URL} width="70" height="40" alt="TURBO" style={mark}/> <span style={brandName}>TURBO</span></Text>
        <Heading style={h1}>أكد بريدك الإلكتروني</Heading>
        <Text style={text}>أهلاً بيك في{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . استخدم الكود التالي لإكمال حسابك:
        </Text>
        {token ? <Text style={code}>{token}</Text> : null}
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          تأكيد البريد
        </Button>
        <Text style={email}><Link href={`mailto:${recipient}`} style={link}>{recipient}</Link></Text>
        <Text style={footer}>
          لو أنت ما أنشأتش الحساب، تجاهل الرسالة بأمان.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif' }
const container = { border: '1px solid #E9E8E5', margin: '24px auto', maxWidth: '520px', padding: '32px' }
const brand = { backgroundColor: '#111111', color: '#FF4D00', fontSize: '28px', fontWeight: 'bold' as const, margin: '0 0 28px', padding: '18px 20px' }
const mark = { display: 'inline-block', objectFit: 'contain' as const, verticalAlign: 'middle' }
const brandName = { color: '#FFFFFF', marginRight: '12px', verticalAlign: 'middle' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#3A3A3A',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const code = { backgroundColor: '#F5F3EE', color: '#111111', fontSize: '30px', fontWeight: 'bold' as const, letterSpacing: '8px', padding: '14px', textAlign: 'center' as const }
const email = { color: '#737373', direction: 'ltr' as const, fontSize: '12px', textAlign: 'right' as const }
const button = {
  backgroundColor: '#FF4D00',
  color: '#ffffff',
  fontSize: '14px',
  border: '1px solid #FF4D00',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#737373', margin: '30px 0 0' }
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  [data-ogsb] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
`
