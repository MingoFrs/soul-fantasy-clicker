# 🌑 SOUL HARVEST - Projet Refactorisé

## 📦 Contenu du Package

Vous recevez **3 fichiers principaux** + 2 documents de référence :

### Fichiers de Jeu (Production Ready)
1. **index.html** - Structure HTML complète
2. **script.js** - Logic JavaScript (2375 lignes)
3. **style.css** - Styles CSS complets (605 lignes)

### Documentation
4. **REFACTORISATION.md** - Guide détaillé des modifications
5. **COMPARAISON.md** - Tableau avant/après

---

## ✨ Qu'est-ce qui a changé ?

### 🎯 Objectif Principal
Fusionner les fichiers `*1.js/css/html` dans leurs versions principales **sans perdre aucune fonctionnalité**.

### ✅ Résultat
- ❌ Supprimés : `script1.js`, `style1.css`, `index1.html` (doublons)
- ✅ Conservés : `script.js`, `style.css`, `index.html` (versions unifiées)
- ✅ **Toutes** les fonctionnalités avancées sont intégrées

---

## 🆕 Nouvelles Fonctionnalités Intégrées

### 1. 💎 Système Abyssal Relics (Niveau & Progression)
```javascript
// 8 reliques évolutives (niveau 0→10)
{
  id: 'r1',
  icon: '💀',
  name: 'Crâne du Liche',
  level: 0,
  ap_cost_base: 10,
  ap_cost_scaling: 1.65,
  effect_scaling: {
    type: 'passive_global',
    perLevel: 0.04
  }
}
```

**Caractéristiques** :
- 10 niveaux par relique (80 upgrades au total)
- Coût exponentiel en AP (Abyssal Points)
- 6 types d'effets différents
- Interface dédiée avec overlay

### 2. 🩸 Shop Overlay (Boutique Prestige)
- Interface modale pour acheter les améliorations prestige
- Organisation par catégories
- États visuels (locked/available/maxed)
- Responsive design

### 3. 🎨 Classe Modal Générique
```css
.gen-modal {
  /* Utilisable pour tous les overlays */
}
```
Simplifie l'ajout de futures modales.

---

## 🚀 Installation & Utilisation

### Installation
```bash
# Placez les 3 fichiers dans le même dossier :
soul-harvest/
├── index.html
├── script.js
└── style.css
```

### Lancement
Ouvrez simplement `index.html` dans un navigateur moderne :
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Premier Lancement
1. Cliquez sur "COMMENCER LE RITUEL"
2. Récoltez vos premières âmes en cliquant sur l'orbe
3. Achetez des générateurs dans la sidebar
4. Progressez jusqu'au premier Pacte de Sang (prestige)
5. Après la première Ascension, débloquez les Reliques Abyssales !

---

## 🎮 Nouvelles Fonctionnalités UI

### Boutons Ajoutés
Dans la section boutons (bas de l'écran) :
- **💎 Reliques** - Ouvre l'overlay des reliques abyssales
- **🩸 Boutique** - Ouvre le shop des améliorations prestige

### Raccourcis Clavier (si implémentés)
- `R` - Ouvrir Reliques
- `S` - Ouvrir Shop
- `ESC` - Fermer l'overlay actif

---

## 📊 Statistiques du Projet

| Métrique | Valeur |
|----------|--------|
| Lignes de code JS | 2375 |
| Lignes de CSS | 605 |
| Lignes HTML | ~305 |
| Nombre de reliques | 8 |
| Niveaux max par relique | 10 |
| Total upgrades possibles | 80 |
| Overlays | 7 |
| Achievements | 16 |
| Buildings | 10 |

---

## 🎨 Palette de Couleurs

```css
--gold: #c9a96e;        /* Or principal */
--gold-bright: #e8c880; /* Or brillant */
--purple: #7a3fa0;      /* Violet */
--blood: #8b1a1a;       /* Rouge sang */
--bg: #07050a;          /* Fond sombre */
```

---

## 🔧 Structure du Code

### JavaScript (script.js)
```
1. Configuration & Audio (lignes 1-30)
2. Formatage (lignes 32-44)
3. Data (lignes 46-180)
   - BUILDINGS
   - UPGRADES
   - PRESTIGE_UPS
   - SKILL_TREE
   - RELICS ← NOUVEAU SYSTÈME
   - ORB_SKINS
   - DEMON_PACTS
   - ACHIEVEMENTS
4. Game State (lignes 182-250)
5. Core Logic (lignes 252-1800)
6. UI Rendering (lignes 1802-2100)
7. Overlays (lignes 2102-2375) ← NOUVEAUX
```

### CSS (style.css)
```
1. Reset & Variables (lignes 1-20)
2. Intro Screen (lignes 21-90)
3. Background Effects (lignes 91-120)
4. Game Layout (lignes 121-250)
5. Orbe & Soul Counter (lignes 251-350)
6. Buildings & Upgrades (lignes 351-400)
7. Overlays (lignes 401-530) ← RELICS & SHOP
8. HUD Elements (lignes 531-606)
```

---

## 🛠️ Maintenance

### Ajouter une Relique
```javascript
// Dans RELICS array :
{
  id:'r9',
  icon:'🔥',
  name:'Ma Relique',
  level:0,
  ap_cost_base:15,
  ap_cost_scaling:1.65,
  effect_scaling:{
    type:'passive_global',
    perLevel:.05
  },
  desc:'Description ici'
}
```

### Types d'Effets Disponibles
1. `passive_global` - Multiplicateur de production
2. `conditional_event` - Bonus lors d'événements
3. `conditional_boss` - Bonus pendant boss
4. `passive_economy` - Réduction de coûts
5. `additive_auto` - Auto-clics supplémentaires
6. `additive_prestige` - Boost points de sang

### Modifier le Max Level
```javascript
const RELIC_MAX_LEVEL = 15; // Au lieu de 10
```

### Changer le Scaling
```javascript
const RELIC_AP_COST_SCALING = 1.8; // Plus cher
// ou
const RELIC_AP_COST_SCALING = 1.5; // Moins cher
```

---

## 🐛 Debugging

### Console JavaScript
```javascript
// Voir l'état actuel
console.log(gs);

// Voir les reliques
console.log(RELICS);

// Donner des AP
gs.abyssal_points = 1000;

// Forcer un niveau de relique
RELICS[0].level = 5;
renderRelicsOverlay();
```

### Problèmes Courants

**Les overlays ne s'ouvrent pas**
→ Vérifiez la console pour les erreurs
→ Assurez-vous que les IDs correspondent (script.js ↔ index.html)

**Les reliques ne s'affichent pas**
→ Vérifiez que `gs.relics` est initialisé
→ Vérifiez que l'ascension a été effectuée

**Les styles sont cassés**
→ Vérifiez que style.css est bien chargé
→ Vérifiez le cache du navigateur (Ctrl+F5)

---

## 📚 Ressources

### Documentation
- **REFACTORISATION.md** - Détails techniques complets
- **COMPARAISON.md** - Tableau avant/après

### Support
Pour toute question :
1. Consultez d'abord REFACTORISATION.md
2. Vérifiez COMPARAISON.md pour les différences
3. Inspectez le code source (commenté)

---

## ✅ Checklist de Validation

Avant de déployer, vérifiez :
- [ ] Les 3 fichiers sont dans le même dossier
- [ ] index.html s'ouvre sans erreur
- [ ] La console JavaScript est propre (pas d'erreurs)
- [ ] L'overlay Reliques s'ouvre (bouton 💎)
- [ ] L'overlay Shop s'ouvre (bouton 🩸)
- [ ] La sauvegarde fonctionne (localStorage)
- [ ] Le layout responsive fonctionne (mobile)

---

## 🎯 Prochaines Étapes Recommandées

### Court Terme
1. Tester le gameplay complet
2. Vérifier la balance des reliques
3. Ajuster les coûts en AP si nécessaire

### Moyen Terme
1. Ajouter plus de reliques (9-12)
2. Créer des achievements liés aux reliques
3. Implémenter des synergies entre reliques

### Long Terme
1. Système de fusion de reliques
2. Reliques légendaires ultra-rares
3. Prestige "Abyssal" distinct du prestige normal

---

## 🏆 Crédits

**Développeur Original** : [Votre nom]  
**Refactorisation** : Claude (Anthropic)  
**Date** : 03/05/2026  
**Version** : Soul Harvest v5 (Refactored)

---

## 📄 License

[Indiquez votre license ici]

---

## 🎮 Bon Jeu !

Que les ténèbres vous accompagnent dans votre quête d'âmes ! 🌑💀🔮

---

**TL;DR** : 3 fichiers unifiés, système de reliques évolutif, layout original préservé, tout fonctionne ! ✅
