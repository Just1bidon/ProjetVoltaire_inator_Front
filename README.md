
# ProjetVoltaire_inator_Front

Cette extension Chrome permet d'identifier les mots potentiellement fautifs dans une phrase. Cependant, si une faute existe, elle se trouve forcément dans les mots surlignés, mais il n'est pas garanti qu'une faute soit présente.

## Installation

1. Clonez ce dépôt Git en local en utilisant la commande suivante :
    
    ```bash
    git clone -b dev https://github.com/Just1bidon/ProjetVoltaire_inator_Front.git
    
    ```
    
2. Ouvrez **Google Chrome** et accédez à la page des extensions :
    
    [chrome://extensions/](https://www.notion.so/1479190e60d98091b91fe75575a6b98c?pvs=21)
    
3. Activez le mode développeur (coin supérieur droit de la page).
4. Cliquez sur **"Charger l’extension non empaquetée"**.
5. Sélectionnez le dossier du projet que vous avez cloné.
6. L'extension est maintenant installée et prête à être utilisée.

## Utilisation

1. Accédez à une page contenant une phrase à analyser.
2. Cliquez sur l'icône de l'extension dans la barre d'outils de Chrome.
3. Le popup affichera :
    - Les mots surlignés en rouge, qui sont **potentiellement fautifs**.
    - Ces mots sont des indices, mais il n’est pas garanti qu’ils contiennent une faute.

## Limitations

- Tous les mots surlignés ne sont pas forcément incorrects.
- Si une faute existe, elle se trouve obligatoirement dans les mots surlignés.