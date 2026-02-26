/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu contraseña de ACROXIA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://vmloiamemddwxyyunphz.supabase.co/storage/v1/object/public/email-assets/acroxia-logo.png" width="140" height="40" alt="ACROXIA" style={logo} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>Restablece tu contraseña</Heading>
          <Text style={text}>
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en ACROXIA. Haz clic en el botón para elegir una nueva contraseña.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Restablecer contraseña
          </Button>
        </Section>
        <Section style={footerSection}>
          <Text style={footer}>
            Si no has solicitado este cambio, puedes ignorar este email. Tu contraseña no se modificará.
          </Text>
          <Text style={footerBrand}>© 2026 ACROXIA. Todos los derechos reservados.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const button = {
  backgroundColor: '#1F1D1B',
  color: '#FAF8F5',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '50px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'block' as const,
  textAlign: 'center' as const,
  margin: '8px auto 0',
}
const footerSection = { padding: '24px 40px 32px', borderTop: '1px solid #E8E6E3' }
const footer = { fontSize: '13px', color: '#7A7775', margin: '0 0 8px', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#A5A3A1', margin: '0', textAlign: 'center' as const }
