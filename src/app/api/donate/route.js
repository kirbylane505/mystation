/**
 * MYSTATION - Donation API Route
 * Redirects to the official Mike Page Foundation donate page
 * (tax-deductible 501(c)(3) with IRS receipt via Stripe)
 */

const MPF_DONATE_URL = 'https://www.mikepagefoundation.org/donate';

export async function POST() {
  return Response.json({
    success: true,
    donateUrl: MPF_DONATE_URL,
    message: 'Donate to Mike Page Foundation (tax-deductible 501(c)(3))'
  });
}

export async function GET() {
  return Response.json({
    foundation: 'Mike Page Foundation',
    type: '501(c)(3)',
    ein: '41-3820708',
    donateUrl: MPF_DONATE_URL
  });
}
