import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

const MARK_URL = 'https://id-preview--2bd82060-338d-4c72-a307-cc46f95bfa5c.lovable.app/__l5e/assets-v1/71333e05-c559-4e9b-a7df-39c2ad88b0fb/turbo-mark.svg'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>كود تأكيد هويتك</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}><Img src={MARK_URL} width="70" height="40" alt="TURBO" style={mark}/> <Text style={brandName}>TURBO</Text></Section>
        <Heading style={h1}>تأكيد هويتك</Heading>
        <Text style={text}>استخدم الكود ده لتأكيد هويتك:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          الكود ده هيخلص قريب. لو مكنتش أنت اللي طلبت ده، تقدر تتجاهل الرسالة بأمان.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif' }
const container = { border: '1px solid #E9E8E5', margin: '24px auto', maxWidth: '520px', padding: '32px' }
const brand = { backgroundColor: '#111111', color: '#FF4D00', margin: '0 0 28px', padding: '18px 20px' }
const mark = { display: 'inline-block', objectFit: 'contain' as const, verticalAlign: 'middle' }
const brandName = { color: '#FFFFFF', display: 'inline-block', fontSize: '24px', fontWeight: 'bold' as const, marginRight: '12px', verticalAlign: 'middle' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#3A3A3A', lineHeight: '1.5', margin: '0 0 25px' }
const codeStyle = { backgroundColor: '#F5F3EE', color: '#111111', fontSize: '30px', fontWeight: 'bold' as const, letterSpacing: '8px', padding: '14px', textAlign: 'center' as const }
const footer = { fontSize: '12px', color: '#737373', margin: '30px 0 0' }
