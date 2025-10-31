# Système de Points et Ranks - Explication

## 📊 Comment fonctionne le système de points

### 1. **Définition des points** 
Les points sont définis dans les **questions du quiz**, dans la table `quiz_questions`.

Chaque option de réponse contient un objet `points` avec les scores pour chaque type de rank :

```json
{
  "id": 0,
  "text_fr": "L'affronter de front",
  "points": {
    "warrior": 3,  // +3 points pour Warrior
    "mage": 0,     // +0 point pour Mage
    "rogue": 1     // +1 point pour Rogue
  }
}
```

### 2. **Où sont stockés les points ?**
❌ **Les points ne sont PAS stockés en base de données**
✅ **Ils sont définis dans les questions du quiz** (colonne `options` de `quiz_questions`)
✅ **Ils sont calculés à la volée** par la fonction SQL `calculate_user_rank`

### 3. **Processus de calcul** 

Quand un utilisateur termine le quiz :

1. **Sauvegarde des réponses** → Table `user_quiz_answers`
   - Stocke seulement : `user_id`, `question_id`, `selected_option` (l'index de la réponse choisie)

2. **Calcul des points** → Fonction SQL `calculate_user_rank(p_user_id)`
   - Lit toutes les réponses de l'utilisateur
   - Pour chaque réponse :
     - Récupère la question correspondante
     - Extrait l'option choisie depuis `options[selected_option]`
     - Récupère l'objet `points` de cette option
     - Ajoute les points à chaque rank concerné
   - Exemple :
     ```
     Question 1 → Option 0 → {"warrior": 3, "mage": 0, "rogue": 1}
     Question 2 → Option 1 → {"warrior": 0, "mage": 3, "rogue": 1}
     Question 3 → Option 2 → {"warrior": 1, "mage": 1, "rogue": 3}
     
     Total : warrior = 4, mage = 4, rogue = 5
     → Rogue gagne ! (max_points = 5)
     ```

3. **Attribution du rank**
   - Trouve le rank avec le plus de points
   - Cherche dans la table `ranks` un rank où `name_en` (en minuscules) = nom du rank avec max points
   - Met à jour `profiles.rank_id`

### 4. **Problème potentiel : "Barde"**

Si vous voyez "Barde" comme rank, cela signifie que :
- Soit un rank "Bard" ou "Barde" existe dans la table `ranks` 
- Soit une question du quiz contient des points pour "bard" au lieu de "warrior"/"mage"/"rogue"

**Solution :**
```sql
-- Vérifier tous les ranks en base
SELECT id, name_en, name_fr, level FROM public.ranks;

-- Vérifier les points dans les questions
SELECT 
  id,
  question_fr,
  jsonb_pretty(options) as options
FROM public.quiz_questions;

-- Voir les réponses d'un utilisateur
SELECT 
  ua.user_id,
  qq.question_fr,
  ua.selected_option,
  qq.options->ua.selected_option::int as selected_option_data
FROM public.user_quiz_answers ua
JOIN public.quiz_questions qq ON ua.question_id = qq.id
WHERE ua.user_id = 'VOTRE_USER_ID';
```

### 5. **Ranks actuellement définis dans la migration**

- **Niveau 1** : Warrior, Mage, Rogue
- **Niveau 2** : Paladin, Wizard, Assassin

### 6. **Ranks référencés dans les questions**

Dans la migration actuelle, seuls ces ranks sont utilisés dans les points :
- `warrior` (en minuscules)
- `mage` (en minuscules)  
- `rogue` (en minuscules)

⚠️ **Important** : Le nom dans les points (`"warrior"`) doit correspondre exactement au `name_en` du rank dans la table `ranks` (comparaison case-insensitive).

### 7. **Pour modifier les points**

Éditez les questions dans Supabase :
```sql
UPDATE public.quiz_questions
SET options = '[...]'::jsonb  -- Nouveau JSON avec les points
WHERE id = 'question_id';
```

Ou modifiez directement la migration `20250401_add_gamification_system.sql` et réappliquez-la.


