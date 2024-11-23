document.addEventListener('DOMContentLoaded', function () {
    // Exécuter le script dans l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Étape 1 : Mise en évidence et récupération des indices des mots fautifs
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: highlightElements, // Fonction exécutée dans la page
        },
        function (results) {
          if (results && results[0] && results[0].result) {
            var data = results[0].result;
  
            // Afficher le nombre total d'éléments mis en évidence
            document.getElementById('result').textContent =
              "Nombre total d'éléments mis en évidence : " + data.totalOccurrences;
  
            // Afficher les indices dans le popup
            if (data.potentialErrorIndices && data.potentialErrorIndices.length > 0) {
              var indicesText = data.potentialErrorIndices.join(', ');
              document.getElementById('errors').textContent =
                'Indices concernés : ' + indicesText;
            } else {
              document.getElementById('errors').textContent = 'Aucun indice concerné.';
            }
  
            // Afficher les mots dans le popup
            if (data.potentialErrorWords && data.potentialErrorWords.length > 0) {
              var wordsText = data.potentialErrorWords.join(', ');
              document.getElementById('words').textContent =
                'Mot(s) à corriger : ' + wordsText;
            } else {
              document.getElementById('words').textContent = 'Aucun mot concerné.';
            }
  
            // Étape 2 : Récupérer les mots corrigés aux mêmes indices
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                func: fetchCorrectedWords, // Nouvelle fonction pour récupérer les mots corrigés
                args: [data.potentialErrorIndices], // Passer les indices des mots fautifs
              },
              function (correctionResults) {
                const correctedData =
                  correctionResults && correctionResults[0] && correctionResults[0].result;
  
                if (correctedData && correctedData.correctedWords) {
                  // Afficher les corrections dans le popup
                  const correctionsDiv = document.getElementById('corrections');
                  correctionsDiv.innerHTML = ''; // Vider le contenu précédent
  
                  correctedData.correctedWords.forEach((correction, index) => {
                    const correctionText = document.createElement('div');
                    correctionText.textContent = `Indice ${correction.index} : "${correction.original}" corrigé en "${correction.corrected}"`;
                    correctionsDiv.appendChild(correctionText);
                  });
                }
              }
            );
          } else {
            document.getElementById('result').textContent = 'Aucun résultat trouvé.';
          }
        }
      );
    });
  });
  

  
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
  
function highlightElements() {
    const parentDivs = document.querySelectorAll(
      'div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu'
    );
  
    let totalOccurrences = 0;
    const elementsInOrder = [];
    const highlightedIndices = [];
  
    parentDivs.forEach((parent) => {
      const childElements = parent.querySelectorAll('.css-146c3p1');
  
      childElements.forEach((el) => {
        const textContent = el.textContent.trim();
        const isWordElement = el.classList.contains('r-184en5c');
        const isHighlightCandidate =
          el.classList.contains('r-lrvibr') && !el.classList.contains('r-184en5c');
  
        let isHighlight = false;
        if (isHighlightCandidate) {
          const style = window.getComputedStyle(el);
          if (
            style.color === 'rgb(22, 27, 39)' &&
            style.fontSize === '24px' &&
            style.cursor === 'pointer' &&
            style.fontFamily.includes('Montserrat')
          ) {
            el.style.backgroundColor = 'yellow';
            totalOccurrences++;
            isHighlight = true;
          }
        }
  
        elementsInOrder.push({
          text: textContent,
          element: el,
          isWord: isWordElement,
          isHighlight,
        });
  
        if (isHighlight) {
          highlightedIndices.push(elementsInOrder.length - 1);
        }
      });
    });
  
    const potentialErrorIndices = [];
    if (highlightedIndices.length === 1) {
      const index = highlightedIndices[0];
      if (index > 0) potentialErrorIndices.push(index - 1);
      if (index < elementsInOrder.length - 1) potentialErrorIndices.push(index + 1);
    } else if (highlightedIndices.length === 2) {
      const index1 = highlightedIndices[0];
      const index2 = highlightedIndices[1];
      for (let i = index1 + 1; i < index2; i++) {
        potentialErrorIndices.push(i);
      }
    }
  
    const potentialErrorWords = [];
    potentialErrorIndices.forEach((index) => {
      const item = elementsInOrder[index];
      if (item && item.isWord) {
        item.element.style.backgroundColor = 'red';
        potentialErrorWords.push(item.text);
      }
    });
  
    return {
      totalOccurrences,
      potentialErrorIndices,
      potentialErrorWords,
    };
  }  
  

// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------

function isCorrectionPopupActive() {
    const correctionPopup = document.querySelector(
      'div.css-175oi2r.r-1kihuf0.r-14lw9ot.r-q36t59.r-13awgt0.r-5hg35f.r-u8s1d.r-13qz1uu'
    );
    return correctionPopup !== null;
  }
  
  
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------

function checkCorrectionPopupStatus() {
    const popupStatus = isCorrectionPopupActive()
    ? "Le pop-up de correction est actif."
    : "Le pop-up de correction n'est pas actif.";
    
    // Afficher l'information dans le popup
    const resultDiv = document.getElementById('correctionPopup');
    resultDiv.textContent = popupStatus;
}


// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------


function checkCorrectionPopupAndFetchPhrases() {
    const correctionPopup = document.querySelector(
        'div.css-175oi2r.r-1kihuf0.r-14lw9ot.r-q36t59.r-13awgt0.r-5hg35f.r-u8s1d.r-13qz1uu'
    );
    
    if (!correctionPopup) {
        return { isActive: false };
    }
    
    // Récupérer la phrase corrigée
    const correctedPhraseDiv = correctionPopup.querySelector(
        'div.css-175oi2r.r-obd0qt.r-18u37iz.r-1w6e6rj.r-bztko3'
    );
    
    const correctedPhrase = correctedPhraseDiv
    ? Array.from(
        correctedPhraseDiv.querySelectorAll(
            'div[style*="font-size: 16px"][style*="font-family: Montserrat-Regular"][style*="color: rgb(22, 27, 39);"]'
        )
    ).map((el) => el.textContent.trim())
    : [];
    
    // Récupérer la phrase originale
    const parentDivs = document.querySelectorAll(
        'div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu'
    );
    
    const originalPhrase = [];
    parentDivs.forEach((parent) => {
        const childElements = parent.querySelectorAll('.css-146c3p1.r-184en5c');
        childElements.forEach((el) => {
            originalPhrase.push(el.textContent.trim());
        });
    });
    
    return {
        isActive: true,
        originalPhrase: originalPhrase,
        correctedPhrase: correctedPhrase,
    };
}

// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------

function fetchCorrectedWords(indices) {
    const correctionPopup = document.querySelector(
      'div.css-175oi2r.r-1kihuf0.r-14lw9ot.r-q36t59.r-13awgt0.r-5hg35f.r-u8s1d.r-13qz1uu'
    );
  
    if (!correctionPopup) {
      return { correctedWords: [] };
    }
  
    // Récupérer la phrase corrigée
    const correctedPhraseDiv = correctionPopup.querySelector(
      'div.css-175oi2r.r-obd0qt.r-18u37iz.r-1w6e6rj.r-bztko3'
    );
  
    const correctedWords = correctedPhraseDiv
      ? Array.from(
          correctedPhraseDiv.querySelectorAll(
            'div[style*="font-size: 16px"][style*="font-family: Montserrat-Regular"][style*="color: rgb(22, 27, 39);"]'
          )
        ).map((el) => el.textContent.trim())
      : [];
  
    // Récupérer la phrase originale
    const parentDivs = document.querySelectorAll(
      'div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu'
    );
  
    const originalWords = [];
    parentDivs.forEach((parent) => {
      const childElements = parent.querySelectorAll('.css-146c3p1.r-184en5c');
      childElements.forEach((el) => {
        originalWords.push(el.textContent.trim());
      });
    });
  
    // Ajuster les indices (indice - 1) pour corriger le décalage
    const corrections = indices.map((index) => {
      const adjustedIndex = index; // Ajustement ici
      return {
        index: index,
        original: originalWords[adjustedIndex -1 ] || '',
        corrected: correctedWords[adjustedIndex] || '',
      };
    });
  
    return { correctedWords: corrections };
  }
  