const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'

const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

export async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })

  if (!response.ok) {
    throw new Error('Failed to get M-Pesa token')
  }

  const data = await response.json()
  return data.access_token
}

export async function initiateSTKPush(params: {
  phone: string
  amount: number
  accountReference: string
  transactionDesc: string
}) {
  const token = await getMpesaToken()
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const shortcode = process.env.MPESA_SHORTCODE || '174379'
  const passkey = process.env.MPESA_PASSKEY || ''
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: params.amount,
      PartyA: params.phone,
      PartyB: shortcode,
      PhoneNumber: params.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    }),
  })

  const data = await response.json()
  return data
}

export async function querySTKStatus(checkoutRequestId: string) {
  const token = await getMpesaToken()
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const shortcode = process.env.MPESA_SHORTCODE || '174379'
  const passkey = process.env.MPESA_PASSKEY || ''
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  const response = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  })

  return response.json()
}