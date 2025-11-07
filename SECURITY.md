# Sécurité - Profils publics et collections

## Utilisation du service_role key

### Pourquoi c'est sécurisé

L'utilisation du `service_role` key dans `/api/profiles/[userId]/games` est **sécurisée** car :

1. **Vérification préalable obligatoire** : On vérifie TOUJOURS que le profil est public avec le client `anon` AVANT d'utiliser le `service_role`
2. **Validation stricte** : 
   - Validation du format UUID pour éviter les injections
   - Vérification que `profile.is_public === true`
   - Double vérification que `profile.id === userId`
3. **Utilisation limitée** : Le `service_role` est utilisé UNIQUEMENT pour lire les jeux, et seulement après validation
4. **Pas d'exposition client** : Le `service_role` key reste côté serveur, jamais exposé au client

### Flux de sécurité

```
1. Requête arrive avec userId dans l'URL
2. Validation du format UUID
3. Vérification avec client ANON que le profil existe et est public
4. Si profil privé → 403 Forbidden (STOP)
5. Si profil public → Utilisation du service_role pour lire les jeux
6. Retour des jeux uniquement pour les profils publics validés
```

### Protection contre les attaques

- ✅ **Injection SQL** : Validation UUID + requêtes paramétrées Supabase
- ✅ **Accès non autorisé** : Vérification `is_public` avant toute lecture
- ✅ **Manipulation d'ID** : Double vérification `profile.id === userId`
- ✅ **Exposition de données privées** : Impossible car on vérifie toujours la visibilité

## ID utilisateur dans l'URL

### Pourquoi c'est acceptable

L'utilisation de l'UUID dans l'URL (`/collectors/[userId]`) est **sécurisée** car :

1. **Entropie élevée** : Les UUIDs ont 128 bits d'entropie (2^128 possibilités)
   - Probabilité de deviner un UUID valide : ~1 sur 340 undecillions
   - Pratiquement impossible à deviner par force brute

2. **Protection par visibilité** : 
   - Même si quelqu'un devine un ID, il ne peut voir que les profils publics
   - Les profils privés retournent 403 Forbidden
   - Aucune information sensible n'est exposée

3. **Pratique courante** : 
   - Utilisée par GitHub (`/users/[id]`), Twitter, etc.
   - Standard de l'industrie pour les identifiants publics

### Amélioration optionnelle

Si vous souhaitez améliorer l'UX (pas la sécurité), vous pouvez utiliser le `username` au lieu de l'ID :

- **Avantages** : URLs plus lisibles (`/collectors/jayhem` au lieu de `/collectors/673ec297-...`)
- **Inconvénients** : Nécessite de modifier les routes et la logique de recherche
- **Sécurité** : Aucun gain de sécurité (les usernames sont déjà publics)

## Recommandations

1. ✅ **Conserver la validation UUID** : Empêche les injections
2. ✅ **Toujours vérifier `is_public`** : Avant toute utilisation du service_role
3. ✅ **Utiliser l'ID du profil vérifié** : Pas celui des params directement
4. ✅ **Logs de sécurité** : Conserver les logs d'erreur pour le monitoring
5. ⚠️ **Ne jamais exposer le service_role key** : Toujours dans les variables d'environnement serveur

## Conclusion

L'implémentation actuelle est **sécurisée** et suit les meilleures pratiques :
- Validation stricte des entrées
- Vérification de la visibilité avant accès
- Utilisation appropriée du service_role
- Protection contre les accès non autorisés

