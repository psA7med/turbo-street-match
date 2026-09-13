import type { ReactNode } from 'react'
import { Body, Container, Head, Html, Img, Preview, Section, Text } from '@react-email/components'

const MARK_URL = 'https://id-preview--2bd82060-338d-4c72-a307-cc46f95bfa5c.lovable.app/__l5e/assets-v1/71333e05-c559-4e9b-a7df-39c2ad88b0fb/turbo-mark.svg'

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <style>{darkModeCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body dir="rtl" style={emailStyles.body}>
        <Container dir="rtl" style={emailStyles.container}>
          <Section dir="rtl" style={emailStyles.header}>
            <Img src={MARK_URL} width="54" height="32" alt="TURBO" style={emailStyles.mark} />
            <Text style={emailStyles.brand}>TURBO</Text>
          </Section>
          <Section dir="rtl" style={emailStyles.content}>{children}</Section>
          <Text dir="rtl" style={emailStyles.footer}>TURBO EGYPT · للملعب والشارع وكل يوم</Text>
        </Container>
      </Body>
    </Html>
  )
}

const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  [data-ogsb] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
`

export const emailStyles = {
  body: { backgroundColor: '#F5F3EE', color: '#111111', fontFamily: 'Tahoma, Arial, sans-serif', margin: 0, padding: '24px 12px', textAlign: 'right' as const },
  container: { backgroundColor: '#FFFFFF', border: '1px solid #E9E8E5', borderRadius: '10px', direction: 'rtl' as const, margin: '0 auto', maxWidth: '560px', overflow: 'hidden' as const, textAlign: 'right' as const },
  header: { backgroundColor: '#111111', direction: 'rtl' as const, padding: '16px 24px', textAlign: 'right' as const },
  mark: { display: 'inline-block', objectFit: 'contain' as const, verticalAlign: 'middle' },
  brand: { color: '#FFFFFF', display: 'inline-block', fontSize: '18px', fontWeight: 700, margin: '0 12px 0 0', verticalAlign: 'middle' },
  content: { direction: 'rtl' as const, padding: '30px 28px 20px', textAlign: 'right' as const },
  heading: { color: '#111111', fontSize: '24px', fontWeight: 700, lineHeight: '1.45', margin: '0 0 12px', textAlign: 'right' as const },
  text: { color: '#3A3A3A', fontSize: '15px', lineHeight: '1.9', margin: '0 0 18px', textAlign: 'right' as const },
  muted: { color: '#737373', fontSize: '13px', lineHeight: '1.8', margin: '20px 0 0', textAlign: 'right' as const },
  button: { backgroundColor: '#FF4D00', borderRadius: '8px', color: '#FFFFFF', display: 'inline-block', fontSize: '14px', fontWeight: 700, padding: '12px 22px', textDecoration: 'none' },
  code: { backgroundColor: '#F5F3EE', border: '1px solid #E9E8E5', borderRadius: '8px', color: '#111111', direction: 'ltr' as const, fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '6px', margin: '20px 0', padding: '15px', textAlign: 'center' as const },
  rule: { borderColor: '#E9E8E5', margin: '20px 0' },
  footer: { borderTop: '1px solid #E9E8E5', color: '#737373', direction: 'rtl' as const, fontSize: '11px', margin: 0, padding: '16px 28px', textAlign: 'right' as const },
} as const
