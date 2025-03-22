import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des tables' },
        { status: 500 }
      );
    }

    // Récupérer la structure de la table consoles
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'consoles')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des colonnes' },
        { status: 500 }
      );
    }

    // Récupérer les politiques RLS
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies');

    // Récupérer les données actuelles de la table consoles
    const { data: consoles, error: consolesError } = await supabase
      .from('consoles')
      .select('*')
      .limit(5);

    return NextResponse.json({
      tables: tables || [],
      consoles_structure: columns || [],
      policies: policies || [],
      sample_consoles: consoles || [],
      console_error: consolesError
    });
  } catch (error) {
    console.error('Debug API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during debug' },
      { status: 500 }
    );
  }
}

// Cette fonction pourrait ne pas exister, nous l'encapsulons donc dans un bloc try-catch
// Nous essaierons de créer cette fonction RPC si nécessaire
async function ensurePolicyFunction() {
  try {
    // Vérifier si la fonction existe
    const { data, error } = await supabase
      .rpc('get_policies');
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      // La fonction n'existe pas, nous allons la créer
      const { data: createResult, error: createError } = await supabase
        .rpc('create_policy_function');
      
      if (createError) {
        console.error('Erreur lors de la création de la fonction RPC:', createError);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification/création de la fonction RPC:', error);
  }
}
