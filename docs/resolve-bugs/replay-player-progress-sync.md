# Fix: Synchronisation de la barre de progression du ReplayPlayer

## Problème

La barre de progression violette et le rond blanc (scrubber) n'étaient pas synchronisés avec le temps réel de lecture. Le problème se manifestait par :

1. **Barre violette en avance** : La barre de progression s'étendait plus loin que la position réelle du player
2. **Rond invisible** : Le scrubber était caché (`opacity-0`) sauf au hover
3. **Désynchronisation après restart/seek** : La barre ne revenait pas à zéro correctement
4. **Race conditions** : Les mises à jour de state React entraient en conflit avec les opérations de seek

## Solution

### 1. Suppression des transitions CSS

**Avant :**
```tsx
<div
  className="absolute inset-y-0 left-0 bg-violet-500 transition-[width] duration-75"
  style={{ width: `${progress}%` }}
/>
```

**Après :**
```tsx
<div
  className="absolute inset-y-0 left-0 bg-violet-500"
  style={{ width: `${progress}%` }}
/>
```

**Pourquoi :** Les transitions CSS créent un délai entre la mise à jour du state et l'affichage visuel, causant la désynchronisation.

### 2. Scrubber toujours visible

**Avant :**
```tsx
<div
  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
  style={{ left: `calc(${progress}% - 6px)` }}
/>
```

**Après :**
```tsx
<div
  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-black/50"
  style={{ left: `calc(${progress}% - 6px)` }}
/>
```

**Pourquoi :** Le rond doit être visible en permanence pour indiquer clairement la position de lecture.

### 3. Anti-race condition avec `lastSeekRef`

**Ajout :**
```tsx
const lastSeekRef = useRef(0); // Timestamp du dernier seek

// Dans updateTime loop :
const timeSinceSeek = Date.now() - lastSeekRef.current;
if (timeSinceSeek < 150) {
  animationFrame = requestAnimationFrame(updateTime);
  return; // Skip updates pendant 150ms après un seek
}
```

**Dans toutes les actions (togglePlay, restart, skip, seek) :**
```tsx
lastSeekRef.current = Date.now(); // Marquer le timestamp du seek
```

**Pourquoi :** Empêche la boucle `updateTime` de réécraser immédiatement les valeurs après un seek/restart.

### 4. Throttle des mises à jour

**Ajout :**
```tsx
let lastReportedTime = 0;

// Dans updateTime :
const newTime = Math.min(time, dur);
if (Math.abs(newTime - lastReportedTime) > 16) {
  currentTimeRef.current = newTime;
  setCurrentTime(newTime);
  lastReportedTime = newTime;
}
```

**Pourquoi :** Ne met à jour le state que si le temps a changé de plus de 16ms (1 frame à 60fps), réduisant les renders inutiles.

### 5. Utilisation de refs pour éviter les stale closures

**Ajout :**
```tsx
const currentTimeRef = useRef(0);

useEffect(() => {
  currentTimeRef.current = currentTime;
}, [currentTime]);
```

**Dans les callbacks :**
```tsx
// Utiliser playingRef.current au lieu de playing
// Utiliser durationRef.current au lieu de duration
// Utiliser replayer.getCurrentTime() directement
```

**Pourquoi :** Les refs sont toujours à jour, contrairement aux valeurs de closure dans les callbacks.

### 6. Fix du togglePlay après fin de vidéo

**Avant :**
```tsx
const startTime = dur > 0 && currentTime >= dur - 100 ? 0 : currentTime;
```

**Après :**
```tsx
const time = replayer.getCurrentTime(); // Lire directement depuis replayer
const isAtEnd = dur > 0 && time >= dur - 500;
const startTime = isAtEnd ? 0 : time;
setCurrentTime(startTime); // Mettre à jour immédiatement
```

**Pourquoi :** Utilise la valeur réelle du replayer au lieu du state React qui peut être stale.

## Fichier modifié

- `apps/dashboard/src/components/ReplayPlayer.tsx`

## Résultat

✅ Barre violette et rond blanc parfaitement synchronisés  
✅ Restart remet la barre à zéro instantanément  
✅ Play après fin repart de 0:00  
✅ Seek/Skip se positionnent correctement  
✅ Pas de race conditions

