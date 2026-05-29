// @ts-expect-error - midtrans-client doesn't have official types, using any for now
import midtransClient from 'midtrans-client'

if (!process.env.MIDTRANS_SERVER_KEY) {
  throw new Error('MIDTRANS_SERVER_KEY is missing in environment variables')
}

/**
 * Midtrans Core API client for administrative operations
 * like checking transaction status and triggering refunds.
 */
export const coreApi = new midtransClient.CoreApi({
  isProduction: false, // Set to true for production environment
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
})
