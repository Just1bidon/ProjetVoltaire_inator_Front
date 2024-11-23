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
  
            // Étape 3 : Afficher la phrase dans le popup
            document.getElementById('sentence').textContent = 'Phrase : ' + data.sentence;
  
            // Étape 4 : Afficher les indices des divs concernées
            if (data.potentialErrorIndices && data.potentialErrorIndices.length > 0) {
              var indicesText = data.potentialErrorIndices.join(', ');
              document.getElementById('errors').textContent =
                'Indices des divs concernées : ' + indicesText;
            } else {
              document.getElementById('errors').textContent = 'Aucune div concernée.';
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
  
    // Étape 4 : Assembler la phrase
    var words = elementsInOrder.filter(e => e.isWord).map(e => e.text);
    var sentence = words.join(' ');
  
    // Étape 5 : Déterminer les indices des mots potentiellement fautifs
    var potentialErrorIndices = [];
  
    if (highlightedIndices.length === 1) {
      var index = highlightedIndices[0];
  
      // Indices des éléments juste avant et après
      var indicesToReturn = [];
      if (index > 0) {
        indicesToReturn.push(index - 1);
      }
      indicesToReturn.push(index);
      if (index < elementsInOrder.length - 1) {
        indicesToReturn.push(index + 1);
      }
  
      potentialErrorIndices = indicesToReturn;
    } else if (highlightedIndices.length === 2) {
      // Retourner les indices des deux divs mises en évidence
      potentialErrorIndices = highlightedIndices;
    }
  
    // Retourner les informations nécessaires
    return {
      totalOccurrences: totalOccurrences,
      sentence: sentence,
      potentialErrorIndices: potentialErrorIndices,
      elementsInOrder: elementsInOrder // Nous renvoyons cette liste pour utilisation ultérieure
    };
  }
  