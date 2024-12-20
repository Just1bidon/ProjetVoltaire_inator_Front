# ProjetVoltaire_inator

**L'extention fonctionne avec une base de donnée, plus de gens vont l'installer, plus il y aura de réponses dans la base de donnée**

Cette **extension Chrome** permet d'identifier les mots **potentiellement fautifs** dans une phrase du Projet Voltaire.

Cependant, si une faute existe, elle se trouve quasiment tout le temps dans les mots surlignés, mais il n'est pas garanti qu'une faute soit présente parmis ces mots.

Elle est compatible avce tous les **navigateurs chromium**

## Installation

1. Clonez ce dépôt Git en local en utilisant la commande suivante :
    
    ```bash
    git clone https://github.com/Just1bidon/ProjetVoltaire_inator_Front.git
    ```
    
2. Ouvrez **Google Chrome** et accédez à la page des extensions :
    
    [chrome://extensions/](chrome://extensions/)
    
3. Activez le mode développeur (coin supérieur droit de la page).
4. Cliquez sur **"Charger l’extension non empaquetée"**.
5. Sélectionnez le dossier du projet que vous avez cloné.
6. Ajoutez l'extention en favoris pour qu'elle apparaisse dans la barre des tâches google
7. L'extension est maintenant installée et prête à être utilisée.

## Mode examen

L'extention possède un mode examen qui permet d'être plus discret pendant son utilisation. Pour l'activer :
1. Ouvrir les détails de l'extention en cliquant sur le bouton "Détails"
![Alt text](/img_readme/1.png?raw=true)
2. Descendre jusqu'à trouver "option d'extention" et cliquer dessus
![Alt text](/img_readme/2.png?raw=true)
3. Une nouvelle page s'ouvre, vous pouvez alors cocher ou non le mode Examen
![Alt text](/img_readme/3.png?raw=true)

### Detail du mode examen
**Surlignage**

Mode examen ACTIF : opacité des couleurs de surlignages = 1

![Alt text](/img_readme/4.png?raw=true)

Mode examen INACTIF : opacité des couleurs de surlignages = 0.25

![Alt text](/img_readme/5.png?raw=true)

**Popup de l'extention**

Mode examen ACTIF : popup réduit au maximum avec aucune informations dedans

Mode examen INACTIF : popup affiché

**Icon de l'extention**
Mode examen ACTIF : icon invisible (beta, fonctionne sur brave en mode sombre)

![Alt text](/img_readme/6.png?raw=true)
![Alt text](/img_readme/7.png?raw=true)




## Utilisation

1. Accédez à une page (https://apprentissage.appli3.projet-voltaire.fr/entrainement") contenant une phrase à analyser.
2. Cliquez sur l'icône de l'extension dans la barre d'outils de Chrome ou **cmd + E** / **ctrl + X**.
3. Le popup s'affichera une **1ère fois** avec:
    - Les mots surlignés en rouge sont **potentiellement fautifs**.
    - Si la phrase est déjà dans **la base de donnée** ou non
        - Si oui : si elle a une faute ou non
    - Des **logs pour le debugages** qui sont à ignoré
4. Une fois la faute cliquée et le popup de correction affiché
5. Re cliquez sur l'icône de l'extension dans la barre d'outils de Chrome ou **cmd + E** / **ctrl + X**.
6. Le popup s'affichera une **2ème fois**:
    - Si la phrase n'est pas encore dans la base de donnée, elle sera **ajouter automatiquement**


## Limitations

- Tous les mots surlignés ne sont pas forcément incorrects.
- Si une faute existe, elle se trouve obligatoirement dans les mots surlignés.
