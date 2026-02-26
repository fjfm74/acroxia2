/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

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
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación de ACROXIA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://vmloiamemddwxyyunphz.supabase.co/storage/v1/object/public/email-assets/acroxia-logo.png" width="140" height="40" alt="ACROXIA" style={logo} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>Código de verificación</Heading>
          <Text style={text}>Usa el siguiente código para confirmar tu identidad:</Text>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Section style={footerSection}>
          <Text style={footer}>
            Este código expirará en breve. Si no lo has solicitado, puedes ignorar este email.
          </Text>
          <Text style={footerBrand}>© 2026 ACROXIA. Todos los derechos reservados.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { padding: '32px 40px 24px', borderBottom: '1px solid #E8E6E3', backgroundColor: '#FAF8F5', textAlign: 'center' as const }
const logo = { display: 'inline-block' as const, margin: '0 auto', maxWidth: '160px', height: 'auto' }
const content = { padding: '40px 40px 32px' }
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#1F1D1B',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#4A4745',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#1F1D1B',
  margin: '0 0 24px',
  textAlign: 'center' as const,
  letterSpacing: '4px',
}
const footerSection = { padding: '24px 40px 32px', borderTop: '1px solid #E8E6E3' }
const footer = { fontSize: '13px', color: '#7A7775', margin: '0 0 8px', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#A5A3A1', margin: '0', textAlign: 'center' as const }
