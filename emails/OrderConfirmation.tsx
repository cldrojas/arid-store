import {
  Html, Head, Preview, Body, Container,
  Heading, Text, Section, Row, Column, Hr
} from '@react-email/components'
import { formatCLP, shortId } from '@/lib/utils'
import type { Order } from '@/types'

type Props = { order: Order }

export function OrderConfirmation({ order }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu pedido #{shortId(order.id)} fue confirmado</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>

          <Heading style={{ fontSize: 24, marginBottom: 8 }}>
            ¡Pedido confirmado!
          </Heading>

          <Text style={{ color: '#666' }}>
            Hola {order.customer_name}, recibimos tu pedido y está siendo preparado.
          </Text>

          <Text style={{ fontWeight: 'bold' }}>
            N° de pedido: #{shortId(order.id)}
          </Text>

          <Hr />

          <Heading as="h2" style={{ fontSize: 18 }}>Resumen</Heading>
          {order.items?.map(item => (
            <Row key={item.id}>
              <Column>{item.product_name}</Column>
              <Column>{item.variant_desc}</Column>
              <Column>x{item.quantity}</Column>
              <Column>{formatCLP(item.unit_price * item.quantity)}</Column>
            </Row>
          ))}

          <Hr />

          <Text style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 18 }}>
            Total: {formatCLP(order.total_amount)}
          </Text>

          <Hr />

          <Heading as="h2" style={{ fontSize: 18 }}>Dirección de envío</Heading>
          <Text>
            {order.shipping_address.street}<br />
            {order.shipping_address.city}, {order.shipping_address.region}
            {order.shipping_address.notes && (
              <><br />Notas: {order.shipping_address.notes}</>
            )}
          </Text>

          <Hr />

          <Text style={{ color: '#999', fontSize: 12 }}>
            Te avisaremos cuando tu pedido sea despachado.
            Ante cualquier consulta responde este correo.
          </Text>

        </Container>
      </Body>
    </Html>
  )
}
