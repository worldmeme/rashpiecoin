import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Normalisasi username: hapus spasi, @, dan pastikan lowercase
  const cleanUsername = username.replace(/[@\s]/g, '').trim().toLowerCase();

  if (!cleanUsername) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
  }

  const worldcoinApiKey = process.env.WORLDCOIN_API_KEY;
  console.log('API Route: Attempting to resolve username:', cleanUsername);
  console.log('API Route: WORLDCOIN_API_KEY is present:', !!worldcoinApiKey);

  if (!worldcoinApiKey) {
    console.error('WORLDCOIN_API_KEY is not set in environment variables');
    return NextResponse.json({ error: 'Server configuration error: API Key missing' }, { status: 500 });
  }

  try {
    const worldcoinApiResponse = await fetch(`https://usernames.worldcoin.org/api/v1/search/${cleanUsername}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${worldcoinApiKey}`,
      },
    });

    console.log('API Route: Worldcoin API raw response status:', worldcoinApiResponse.status);

    if (!worldcoinApiResponse.ok) {
      const errorText = await worldcoinApiResponse.text();
      console.error(`Worldcoin API error: ${worldcoinApiResponse.status} - ${errorText}`);
      return NextResponse.json({ error: `Worldcoin API returned an error: ${worldcoinApiResponse.statusText} - ${errorText}` }, { status: worldcoinApiResponse.status });
    }

    const data: Array<{ username: string; address: string | null; profile_picture_url?: string; minimized_profile_picture_url?: string }> = await worldcoinApiResponse.json();
    console.log('API Route: Parsed Worldcoin API data:', data);

    // Cari username yang persis sama
    const foundUser = data.find(item => item.username.toLowerCase() === cleanUsername);

    if (foundUser && foundUser.address && ethers.isAddress(foundUser.address)) {
      return NextResponse.json({ username: foundUser.username, address: foundUser.address }, { status: 200 });
    } else {
      return NextResponse.json({ username: cleanUsername, address: null, error: 'Username tidak ditemukan atau tidak memiliki alamat terdaftar.' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error proxying Worldcoin username search:', error);
    return NextResponse.json({ error: 'Failed to resolve username: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}