import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Essayer d'abord avec les cookies
    const cookieStore = await cookies();
    let supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    let { data: { user }, error: authError } = await supabase.auth.getUser();

    // Si l'authentification par cookie échoue, essayer avec le token dans les headers
    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );
        
        const result = await supabaseWithToken.auth.getUser();
        user = result.data.user;
        authError = result.error;
        
        // Utiliser ce client pour les requêtes suivantes
        if (user) {
          supabase = supabaseWithToken as any;
        }
      }
    }

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Non authentifié', details: authError?.message },
        { status: 401 }
      );
    }

    // Récupérer ou créer un token de partage
    const { data: existingShare, error: fetchError } = await supabase
      .from('wishlist_shares')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching share:', fetchError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du partage' },
        { status: 500 }
      );
    }

    // Si un partage actif existe, le retourner
    if (existingShare) {
      return NextResponse.json({
        token: existingShare.token,
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/${existingShare.token}`,
      });
    }

    // Sinon, créer un nouveau token
    const token = crypto.randomBytes(32).toString('hex');
    console.log('Creating share token for user:', user.id, 'token:', token);
    
    // Essayer d'abord avec le client normal
    let { data: newShare, error: createError } = await supabase
      .from('wishlist_shares')
      .insert({
        user_id: user.id,
        token,
        is_active: true,
      })
      .select()
      .single();

    // Si l'insertion échoue à cause des RLS, utiliser le client admin
    if (createError) {
      console.error('Error creating share with normal client:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      
      // Essayer avec le client admin
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
      const adminResult = await supabaseAdmin
        .from('wishlist_shares')
        .insert({
          user_id: user.id,
          token,
          is_active: true,
        })
        .select()
        .single();
      
      if (adminResult.error) {
        console.error('Error creating share with admin client:', adminResult.error);
        return NextResponse.json(
          { error: 'Erreur lors de la création du partage', details: adminResult.error.message },
          { status: 500 }
        );
      }
      
      newShare = adminResult.data;
      console.log('Share created successfully with admin client:', newShare);
    } else {
      console.log('Share created successfully:', newShare);
    }

    return NextResponse.json({
      token: newShare.token,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/${newShare.token}`,
    });
  } catch (error: any) {
    console.error('Error in GET /api/wishlist/share:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Essayer d'abord avec les cookies
    const cookieStore = await cookies();
    let supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    let { data: { user }, error: authError } = await supabase.auth.getUser();

    // Si l'authentification par cookie échoue, essayer avec le token dans les headers
    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );
        
        const result = await supabaseWithToken.auth.getUser();
        user = result.data.user;
        authError = result.error;
        
        // Utiliser ce client pour les requêtes suivantes
        if (user) {
          supabase = supabaseWithToken as any;
        }
      }
    }

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Non authentifié', details: authError?.message },
        { status: 401 }
      );
    }

    // Désactiver les anciens partages
    await supabase
      .from('wishlist_shares')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Créer un nouveau token
    const token = crypto.randomBytes(32).toString('hex');
    const { data: newShare, error: createError } = await supabase
      .from('wishlist_shares')
      .insert({
        user_id: user.id,
        token,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating share:', createError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du partage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: newShare.token,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/${newShare.token}`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/wishlist/share:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

