# Env Switcher

Extension Chrome pour passer d'un environnement à un autre (prod, preprod, recette…) en gardant la même page (chemin, query string, ancre).

## Installation

1. Ouvrir `chrome://extensions`
2. Activer le **Mode développeur** (en haut à droite)
3. **Charger l'extension non empaquetée** → sélectionner ce dossier `env-switcher/`

## Utilisation

- Sur une page d'un environnement connu, l'icône passe en bleu avec un badge (ex. `PROD`, `PP`).
- Clic sur l'icône (ou `Alt+Shift+E`) → liste des environnements :
  - clic : onglet courant ou nouvel onglet selon la préférence (page Options)
  - `⌘`/`Ctrl` + clic ou bouton secondaire : l'inverse (clic molette : toujours nouvel onglet)
  - touches `1`–`9` : bascule directe
- **Gérer les environnements** (ou clic droit sur l'icône → Options) : ajouter, modifier, supprimer, réordonner (glisser-déposer ou ↑ ↓), import/export JSON.

La configuration est stockée dans `chrome.storage.sync` (suit ton compte Chrome).

## Configuration

La config par défaut contient des exemples (`www.exemple.fr`, `preprod.exemple.fr`) à remplacer par tes vrais environnements depuis la page Options, ou en important un fichier JSON :

```json
{
  "environments": [
    { "name": "Production", "url": "https://www.exemple.fr", "short": "PROD", "color": "#d92d20" },
    { "name": "Preprod", "url": "https://preprod.mon-domaine.fr", "short": "PP", "color": "#ffd600" }
  ]
}
```
