// Étape 1 : Ajouter un écouteur d'événement au bouton
document.getElementById('countButton').addEventListener('click', function() {
    // Étape 2 : Exécuter le script dans l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: highlightElements // Fonction qui sera exécutée dans la page
      }, function(results) {
        // Vérifier si des résultats sont retournés
        if (results && results[0] && results[0].result) {
          var data = results[0].result;
  
          // Étape 3 : Afficher le nombre total d'éléments mis en évidence
          document.getElementById('result').textContent = 'Nombre total d\'éléments mis en évidence : ' + data.totalOccurrences;
  
          // Étape 4 : Afficher la phrase dans le popup
          document.getElementById('sentence').textContent = 'Phrase : ' + data.sentence;
  
          // Étape 5 : Afficher les mots potentiellement fautifs
          if (data.potentialErrorWords && data.potentialErrorWords.length > 0) {
            document.getElementById('errors').textContent = 'Mots potentiellement fautifs : ' + data.potentialErrorWords.join(', ');
          } else {
            document.getElementById('errors').textContent = 'Aucun mot potentiellement fautif détecté.';
          }
        } else {
          document.getElementById('result').textContent = 'Aucun résultat trouvé.';
        }
      });
    });
  });
  
  // Fonction principale exécutée dans la page
function highlightElements() {
  // Étape 1 : Sélectionner les divs parents
  var parentDivs = document.querySelectorAll('div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu');

  // Initialisation des variables
  var totalOccurrences = 0;
  var words = []; // Tableau pour stocker les mots avec leurs indices
  var highlightedIndices = []; // Indices des divs mises en évidence

  // Étape 2 : Parcourir chaque div parent
  parentDivs.forEach(function(parent) {
    // Étape 3 : Sélectionner les éléments enfants spécifiques pour la mise en évidence
    var elementsToHighlight = parent.querySelectorAll('.css-146c3p1.r-lrvibr:not(.r-184en5c)');

    // Filtrer les éléments pour la mise en évidence
    var filteredElements = Array.prototype.filter.call(elementsToHighlight, function(el) {
      return el.classList.length === 2 &&
             el.classList.contains('css-146c3p1') &&
             el.classList.contains('r-lrvibr');
    });

    var styledElements = Array.prototype.filter.call(filteredElements, function(el) {
      var style = window.getComputedStyle(el);
      return style.color === 'rgb(22, 27, 39)' &&
             style.fontSize === '24px' &&
             style.cursor === 'pointer' &&
             style.fontFamily.includes('Montserrat');
    });

    // Mettre en évidence les éléments correspondants et stocker leurs indices
    styledElements.forEach(function(el) {
      el.style.backgroundColor = 'yellow';
      totalOccurrences++;

      // Trouver l'index de cet élément dans la liste des mots
      var index = -1;
      for (var i = 0; i < words.length; i++) {
        if (words[i].element === el) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        highlightedIndices.push(index);
      }
    });

    // Étape 4 : Récupérer les mots pour la phrase
    var wordElements = parent.querySelectorAll('.css-146c3p1.r-184en5c.r-lrvibr');

    wordElements.forEach(function(el) {
      var textContent = el.textContent.trim();
      if (textContent) {
        words.push({
          text: textContent,
          element: el // Stocker l'élément pour référence future
        });
      }
    });
  });

  // Étape 5 : Assembler la phrase
  var sentence = words.map(word => word.text).join(' ');

  // Étape 6 : Déterminer le(s) mot(s) potentiellement fautif(s)
  var potentialErrorWords = [];

  if (highlightedIndices.length === 1) {
    // Une seule div mise en évidence
    var index = highlightedIndices[0];

    // Ajouter les mots à l'indice -1 et +1
    if (index > 0) {
      potentialErrorWords.push(words[index - 1]);
    }
    if (index < words.length - 1) {
      potentialErrorWords.push(words[index + 1]);
    }
  } else if (highlightedIndices.length === 2) {
    // Deux divs mises en évidence
    var index1 = highlightedIndices[0];
    var index2 = highlightedIndices[1];

    // Calculer le milieu entier des deux indices
    var middleIndex = Math.floor((index1 + index2) / 2);

    // Ajouter le mot au milieu si l'indice est valide
    if (middleIndex >= 0 && middleIndex < words.length) {
      potentialErrorWords.push(words[middleIndex]);
    }
  }

  // Mettre en évidence le(s) mot(s) potentiellement fautif(s) en rouge
  potentialErrorWords.forEach(function(wordInfo) {
    wordInfo.element.style.backgroundColor = 'red';
  });

  // Retourner les informations nécessaires
  return {
    totalOccurrences: totalOccurrences,
    sentence: sentence,
    potentialErrorWords: potentialErrorWords.map(word => word.text)
  };
}
