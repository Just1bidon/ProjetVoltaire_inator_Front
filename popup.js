document.getElementById('countButton').addEventListener('click', function () {
    // Étape 1 : Exécuter le script dans l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: highlightElements, // Fonction exécutée dans la page
        },
        function (results) {
          // Vérifier si des résultats sont retournés
          if (results && results[0] && results[0].result) {
            var data = results[0].result;
  
            // Étape 2 : Afficher le nombre total d'éléments mis en évidence
            document.getElementById('result').textContent =
              "Nombre total d'éléments mis en évidence : " + data.totalOccurrences;
  
            // Étape 3 : Afficher les indices dans le popup
            if (data.potentialErrorIndices && data.potentialErrorIndices.length > 0) {
              var indicesText = data.potentialErrorIndices.join(', ');
              document.getElementById('errors').textContent =
                'Indices concernés : ' + indicesText;
            } else {
              document.getElementById('errors').textContent = 'Aucun indice concerné.';
            }
  
            // Étape 4 : Afficher les mots dans le popup
            if (data.potentialErrorWords && data.potentialErrorWords.length > 0) {
              document.getElementById('words').textContent =
                'Mots concernés : ' + data.potentialErrorWords.join(', ');
            } else {
              document.getElementById('words').textContent = 'Aucun mot concerné.';
            }
          } else {
            document.getElementById('result').textContent = 'Aucun résultat trouvé.';
          }
        }
      );
    });
  });
  
  
  function highlightElements() {
    // Étape 1 : Sélectionner les divs parents
    var parentDivs = document.querySelectorAll('div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu');
  
    // Initialisation des variables
    var totalOccurrences = 0;
    var elementsInOrder = []; // Liste des éléments dans l'ordre
    var highlightedIndices = []; // Indices des divs mises en évidence
  
    // Étape 2 : Parcourir chaque div parent
    parentDivs.forEach(function(parent) {
      // Étape 3 : Sélectionner tous les éléments enfants dans l'ordre
      var childElements = parent.querySelectorAll('.css-146c3p1');
  
      childElements.forEach(function(el) {
        var textContent = el.textContent.trim();
        var isWordElement = el.classList.contains('r-184en5c');
        var isHighlightCandidate = el.classList.contains('r-lrvibr') && !el.classList.contains('r-184en5c');
  
        // Vérifier si c'est un élément à mettre en évidence
        var isHighlight = false;
        if (isHighlightCandidate) {
          // Vérifier les styles
          var style = window.getComputedStyle(el);
          if (style.color === 'rgb(22, 27, 39)' &&
              style.fontSize === '24px' &&
              style.cursor === 'pointer' &&
              style.fontFamily.includes('Montserrat')) {
            // Mettre en évidence
            el.style.backgroundColor = 'yellow';
            totalOccurrences++;
            isHighlight = true;
          }
        }
  
        // Ajouter l'élément à la liste dans l'ordre
        elementsInOrder.push({
          text: textContent,
          element: el,
          isWord: isWordElement,
          isHighlight: isHighlight
        });
  
        // Enregistrer l'indice si l'élément est mis en évidence
        if (isHighlight) {
          highlightedIndices.push(elementsInOrder.length - 1);
        }
      });
    });
  
    // Étape 4 : Déterminer les indices des mots potentiellement fautifs
    var potentialErrorIndices = [];
    if (highlightedIndices.length === 1) {
      var index = highlightedIndices[0];
  
      // Indices des éléments juste avant et après
      if (index > 0) {
        potentialErrorIndices.push(index - 1);
      }
      if (index < elementsInOrder.length - 1) {
        potentialErrorIndices.push(index + 1);
      }
    } else if (highlightedIndices.length === 2) {
      // Indices entre les deux `divs` mises en évidence
      var index1 = highlightedIndices[0];
      var index2 = highlightedIndices[1];
  
      // Ajouter tous les indices entre index1 et index2
      for (var i = index1 + 1; i < index2; i++) {
        potentialErrorIndices.push(i);
      }
    }
  
    // Étape 5 : Mettre en évidence les mots correspondants
    var potentialErrorWords = [];
    potentialErrorIndices.forEach(function(index) {
      var item = elementsInOrder[index];
      if (item && item.isWord) {
        item.element.style.backgroundColor = 'red';
        potentialErrorWords.push(item.text);
      }
    });
  
    // Retourner les informations nécessaires
    return {
      totalOccurrences: totalOccurrences,
      potentialErrorIndices: potentialErrorIndices,
      potentialErrorWords: potentialErrorWords
    };
  }
  