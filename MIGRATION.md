# 🔄 GUIDE DE MIGRATION - SOUL HARVEST

## 📋 Compatibilité des Sauvegardes

### ✅ Bonne Nouvelle !
Les sauvegardes de **toutes les versions précédentes** sont **100% compatibles** avec cette version refactorisée.

---

## 🔧 Migration Automatique

### Étapes
1. **Lancez** le nouveau `index.html`
2. **Cliquez** sur "📂 Charger une sauvegarde"
3. **Sélectionnez** votre ancien fichier de sauvegarde
4. **C'est tout !** ✅

Le système détecte automatiquement et met à jour les nouvelles propriétés.

---

## 🆕 Nouvelles Propriétés Ajoutées

Lors du premier chargement, le jeu ajoutera automatiquement :

```javascript
// Ajouté automatiquement si absent
gs.relics = gs.relics || [];

// Chaque relique a maintenant un niveau
RELICS.forEach(r => {
  r.level = r.level || 0; // Défaut niveau 0
});

// Points abyssaux conservés
gs.abyssal_points = gs.abyssal_points || 0;
```

---

## 📊 Que Se Passe-t-il Lors de la Migration ?

### Données Préservées (100%)
- ✅ `gs.souls` - Âmes actuelles
- ✅ `gs.totalSouls` - Âmes totales
- ✅ `gs.owned` - Bâtiments possédés
- ✅ `gs.upgradeRanks` - Niveaux des améliorations
- ✅ `gs.prestigeCount` - Nombre de prestiges
- ✅ `gs.prestigePoints` - Points de sang
- ✅ `gs.prestigeUpgrades` - Améliorations prestige achetées
- ✅ `gs.ascensionCount` - Ascensions
- ✅ `gs.achievements` - Achievements débloqués
- ✅ `gs.skillNodes` - Compétences achetées
- ✅ `gs.stats` - Toutes les statistiques

### Données Ajoutées (Nouvelles)
- 🆕 `RELICS[].level` - Niveaux des reliques (défaut: 0)
- 🆕 Aucune autre donnée obligatoire

### Données Ignorées (Anciennes versions)
Si votre sauvegarde contenait des propriétés obsolètes, elles seront simplement ignorées sans causer d'erreur.

---

## 🔍 Vérification Post-Migration

### Checklist Rapide
Après avoir chargé votre sauvegarde, vérifiez :

1. **Âmes** : `gs.souls` correspond à votre ancien total ✅
2. **Bâtiments** : Tous vos générateurs sont présents ✅
3. **Prestiges** : `gs.prestigeCount` correspond ✅
4. **Achievements** : Vos trophées sont débloqués ✅
5. **Reliques** : Panel accessible via bouton 💎 ✅

### Console de Vérification
```javascript
// Ouvrez la console (F12) et tapez :
console.log('Âmes:', gs.souls);
console.log('Prestiges:', gs.prestigeCount);
console.log('Reliques:', RELICS.map(r => ({name:r.name, level:r.level})));
console.log('AP disponibles:', gs.abyssal_points);
```

---

## 🚨 Problèmes Potentiels & Solutions

### Problème 1 : "Reliques non visibles"
**Cause** : L'ascension n'a pas encore été effectuée  
**Solution** : 
- Les reliques se débloquent après la **première ascension**
- Continuez votre progression normalement
- Après ascension : bouton 💎 apparaît et fonctionne

### Problème 2 : "Bouton Boutique ne s'ouvre pas"
**Cause** : Aucun prestige effectué  
**Solution** :
- La boutique nécessite au moins **1 prestige**
- Effectuez un Pacte de Sang (prestige)
- Le bouton 🩸 deviendra actif

### Problème 3 : "Sauvegarde corrompue"
**Symptômes** : Erreurs dans la console  
**Solution** :
```javascript
// Réinitialiser partiellement
gs.relics = [];
RELICS.forEach(r => r.level = 0);
gs.abyssal_points = 0;
saveGame();
```

### Problème 4 : "Les upgrades coûtent plus cher"
**Cause** : Normal - système de scaling préservé  
**Vérification** :
- Ce n'est pas lié à la migration
- Les coûts augmentent exponentiellement avec le niveau
- C'est le comportement attendu

---

## 💾 Format de Sauvegarde

### Ancien Format (Compatible)
```json
{
  "souls": 1000000,
  "totalSouls": 5000000,
  "owned": {"cultist": 10, "tomb": 5},
  "prestigeCount": 3,
  "ascensionCount": 1,
  "relics": ["r1", "r3"]
}
```

### Nouveau Format (Amélioré)
```json
{
  "souls": 1000000,
  "totalSouls": 5000000,
  "owned": {"cultist": 10, "tomb": 5},
  "prestigeCount": 3,
  "ascensionCount": 1,
  "abyssal_points": 45,
  "relic_levels": {
    "r1": 3,
    "r3": 2
  }
}
```

---

## 🔄 Processus de Migration Détaillé

### Étape 1 : Lecture de la Sauvegarde
```javascript
function loadGame() {
  const data = localStorage.getItem('soulHarvestSave');
  if (!data) return;
  
  const save = JSON.parse(data);
  // Charge les données existantes
  Object.assign(gs, save);
}
```

### Étape 2 : Normalisation des Reliques
```javascript
// Après chargement
RELICS.forEach(r => {
  // Si le niveau n'existe pas, initialiser à 0
  if (typeof r.level !== 'number') {
    r.level = 0;
  }
  
  // Si la sauvegarde contenait relic_levels
  if (gs.relic_levels && gs.relic_levels[r.id]) {
    r.level = gs.relic_levels[r.id];
  }
});
```

### Étape 3 : Validation
```javascript
// Vérifier les valeurs aberrantes
RELICS.forEach(r => {
  if (r.level < 0) r.level = 0;
  if (r.level > RELIC_MAX_LEVEL) r.level = RELIC_MAX_LEVEL;
});

if (gs.abyssal_points < 0) gs.abyssal_points = 0;
```

### Étape 4 : Sauvegarde Mise à Jour
```javascript
// Sauvegarder avec nouvelles propriétés
saveGame(); // Écrit le nouveau format
```

---

## 📈 Progression Post-Migration

### Pour les Nouveaux Joueurs
1. Commencez normalement
2. Progressez jusqu'au premier prestige
3. Continuez jusqu'à la première ascension
4. **Reliques débloquées !**

### Pour les Joueurs Existants (Pré-Ascension)
1. Chargez votre sauvegarde
2. Continuez votre progression
3. Effectuez votre première ascension
4. **Reliques débloquées !**

### Pour les Joueurs Existants (Post-Ascension)
1. Chargez votre sauvegarde
2. **Reliques immédiatement disponibles !** 💎
3. Vos AP existants sont conservés
4. Commencez à upgrader vos reliques

---

## 🧪 Test de Migration

### Scénario 1 : Nouvelle Partie
```javascript
// Aucune sauvegarde
localStorage.clear();
// Lancez index.html → Tout fonctionne ✅
```

### Scénario 2 : Sauvegarde Ancienne (Sans Reliques)
```javascript
// Sauvegarde de la version précédente
localStorage.setItem('soulHarvestSave', JSON.stringify({
  souls: 500,
  totalSouls: 1000,
  owned: {cultist: 5},
  prestigeCount: 0
}));
// Lancez index.html → Migration automatique ✅
```

### Scénario 3 : Sauvegarde Récente (Avec Reliques Basiques)
```javascript
// Sauvegarde avec reliques mais sans niveaux
localStorage.setItem('soulHarvestSave', JSON.stringify({
  souls: 1000000,
  ascensionCount: 2,
  relics: ['r1', 'r2', 'r3'],
  abyssal_points: 30
}));
// Lancez index.html → Niveaux initialisés à 0 ✅
```

---

## ⚠️ Avertissements Importants

### ⚠️ NE PAS
- ❌ Éditer manuellement le localStorage sans savoir ce que vous faites
- ❌ Charger une sauvegarde d'un autre jeu
- ❌ Utiliser des outils de triche non officiels

### ✅ FAIRE
- ✅ Toujours faire une sauvegarde manuelle avant de tester
- ✅ Utiliser la fonction "💾 Sauv." régulièrement
- ✅ Conserver plusieurs sauvegardes (export JSON)

---

## 💡 Conseils de Migration

### Astuce 1 : Backup Préventif
Avant de migrer, exportez votre sauvegarde :
```javascript
// Ouvrez la console (F12)
const save = localStorage.getItem('soulHarvestSave');
console.log(save);
// Copiez le résultat et sauvegardez-le dans un fichier .txt
```

### Astuce 2 : Test en Parallèle
- Gardez l'ancien `index.html` dans un autre dossier
- Testez la nouvelle version dans un navigateur différent
- Comparez les deux sauvegardes

### Astuce 3 : Import/Export Manuel
Si l'auto-migration échoue :
```javascript
// Export manuel (ancien jeu)
function exportSave() {
  const save = localStorage.getItem('soulHarvestSave');
  const blob = new Blob([save], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'soul_harvest_backup.json';
  a.click();
}

// Import manuel (nouveau jeu)
function importSave(file) {
  const reader = new FileReader();
  reader.onload = e => {
    localStorage.setItem('soulHarvestSave', e.target.result);
    location.reload();
  };
  reader.readAsText(file);
}
```

---

## 🎯 Checklist Finale Post-Migration

Après migration réussie, vous devriez avoir :

- [x] Toutes vos âmes préservées
- [x] Tous vos bâtiments intacts
- [x] Toutes vos améliorations conservées
- [x] Vos prestiges et ascensions comptés
- [x] Vos achievements débloqués
- [x] Vos points de sang disponibles
- [x] **NOUVEAU** : Système de reliques accessible
- [x] **NOUVEAU** : Boutique prestige accessible
- [x] Aucune perte de progression

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez la console** (F12) pour les erreurs
2. **Consultez REFACTORISATION.md** pour les détails techniques
3. **Testez avec une nouvelle partie** pour isoler le problème
4. **Gardez votre backup** pour pouvoir revenir en arrière

---

## ✅ Résumé

| Aspect | Status |
|--------|--------|
| Compatibilité totale | ✅ 100% |
| Migration automatique | ✅ Oui |
| Perte de données | ❌ Aucune |
| Nouvelles fonctionnalités | ✅ Ajoutées |
| Backup nécessaire | ⚠️ Recommandé |
| Difficulté migration | 🟢 Facile |

**Migration = Charger votre sauvegarde. C'est tout !** 🎉

---

**Date** : 03/05/2026  
**Version** : Soul Harvest v5 (Refactored)  
**Compatibilité** : Toutes versions précédentes
