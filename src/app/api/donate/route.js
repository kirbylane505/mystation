/**
 * MYSTATION - Donation API Route
 * Returns Cash App donation link
 */

export async function POST(request) {
  // Redirect to Cash App for donations
  return Response.json({
    success: true,
    cashAppUrl: 'https://cash.app/$RIDE4PAGEMUSIC847',
    message: 'Donate via Cash App to support the Mike Page Foundation'
  });
}

export async function GET() {
  return Response.json({
    foundation: 'Mike Page Foundation',
    type: '501(c)(3)',
    cashApp: '$RIDE4PAGEMUSIC847',
    cashAppUrl: 'https://cash.app/$RIDE4PAGEMUSIC847'
  });
}
