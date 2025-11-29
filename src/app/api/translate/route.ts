import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, from = 'en', to = 'fr' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Le paramètre "text" est requis' },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json({ translated: text, success: true });
    }

    if (from === to) {
      return NextResponse.json({ translated: text, success: true });
    }

    // 1. Essayer d'abord DeepL (meilleure qualité, 500k caractères/mois gratuits)
    const deeplApiKey = process.env.DEEPL_API_KEY;
    if (deeplApiKey) {
      try {
        // Déterminer l'URL de l'API (Free vs Pro)
        const isFreeKey = deeplApiKey.endsWith(':fx');
        const baseUrl = isFreeKey 
          ? 'https://api-free.deepl.com/v2/translate'
          : 'https://api.deepl.com/v2/translate';

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            text: text,
            source_lang: from.toUpperCase(),
            target_lang: to.toUpperCase(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.translations && data.translations[0]?.text) {
            const translatedText = data.translations[0].text;
            const isDifferent = translatedText.trim().toLowerCase() !== text.trim().toLowerCase();
            return NextResponse.json({ 
              translated: translatedText, 
              success: isDifferent 
            });
          }
        } else if (response.status === 456) {
          console.warn('⚠️ DeepL: Quota dépassé (456), fallback vers MyMemory');
        } else if (response.status === 403) {
          console.warn('⚠️ DeepL: Accès refusé (403) - vérifier la clé API, fallback vers MyMemory');
        } else {
          const errorText = await response.text().catch(() => '');
          console.warn(`⚠️ DeepL error ${response.status}: ${errorText.substring(0, 100)}, fallback vers MyMemory`);
        }
      } catch (error) {
        console.warn('⚠️ DeepL failed (erreur réseau ou autre):', error instanceof Error ? error.message : error);
      }
    } else {
      console.warn('⚠️ DEEPL_API_KEY non trouvée dans les variables d\'environnement, utilisation directe de MyMemory');
    }

    // 2. Fallback vers MyMemory (gratuit, 1000 traductions/jour)
    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${from}|${to}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MemCard/1.0)',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('❌ MyMemory: Quota dépassé (429)');
        } else {
          console.warn(`❌ MyMemory error ${response.status}`);
        }
        return NextResponse.json({ translated: text, success: false });
      }

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText;

        // Vérifier si c'est un message d'erreur de limite de quota
        if (translatedText.includes('MYMEMORY WARNING') ||
            translatedText.includes('USED ALL AVAILABLE FREE TRANSLATIONS') ||
            translatedText.includes('NEXT AVAILABLE IN')) {
          console.warn('❌ MyMemory: Quota dépassé');
          return NextResponse.json({ translated: text, success: false });
        }

        // Vérifier si la traduction est réellement différente du texte original
        const isDifferent = translatedText.trim().toLowerCase() !== text.trim().toLowerCase();
        return NextResponse.json({ translated: translatedText, success: isDifferent });
      } else {
        console.warn('❌ MyMemory: Réponse invalide');
        return NextResponse.json({ translated: text, success: false });
      }
    } catch (error) {
      console.warn('❌ Toutes les APIs ont échoué:', error);
      return NextResponse.json({ translated: text, success: false });
    }
  } catch (error) {
    console.error('Erreur dans /api/translate:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la traduction' },
      { status: 500 }
    );
  }
}

