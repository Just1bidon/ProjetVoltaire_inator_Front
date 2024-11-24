document.addEventListener('DOMContentLoaded', function () {
    // Exécuter le script dans l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Vérifier si une correction existe
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: checkIfCorrectionExists, // Vérifie si une correction est affichée
        },
        function (results) {
          const result = results && results[0] && results[0].result;
          const correctionsDiv = document.getElementById('corrections');
  
          if (!result || !result.isActive) {
            // Pop-up inactif
            correctionsDiv.textContent = "Le pop-up de correction n'est pas actif.";
            processHighlighting(tabs, false);
          } else if (result.hasCorrection) {
            // Une correction est affichée
            processHighlighting(tabs, true);
          } else {
            // Pop-up actif mais aucune correction n’est affichée
            correctionsDiv.textContent = "Il n'y avait pas de faute.";
            processHighlighting(tabs, false);
          }
        }
      );
    });
  });
  
  // Fonction pour gérer la mise en évidence et l'extraction des mots
  function processHighlighting(tabs, isCorrectionActive = false) {
    // Mise en évidence des éléments
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: highlightElements, // Fonction exécutée dans la page
      },
      function (highlightResults) {
        const correctionsDiv = document.getElementById('corrections');
  
        if (highlightResults && highlightResults[0] && highlightResults[0].result) {
          const data = highlightResults[0].result;
  
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
  
          if (isCorrectionActive && data.potentialErrorIndices.length > 0) {
            // Récupérer les mots corrigés si le pop-up est actif
            fetchCorrectedWordsFromIndices(data.potentialErrorIndices, tabs);
          }
        } else {
          correctionsDiv.textContent = "Aucun résultat trouvé.";
        }
      }
    );
  }
  
  // Fonction pour récupérer les mots corrigés
  function fetchCorrectedWordsFromIndices(indices, tabs) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: fetchCorrectedWords, // Fonction pour récupérer les mots corrigés
        args: [indices], // Passer les indices des mots fautifs
      },
      function (correctionResults) {
        const correctedData =
          correctionResults && correctionResults[0] && correctionResults[0].result;
        const correctionsDiv = document.getElementById('corrections');
  
        if (correctedData && correctedData.correctedWords.length > 0) {
          correctionsDiv.innerHTML = ""; // Vider le contenu précédent
  
          correctedData.correctedWords.forEach((correction) => {
            const correctionText = document.createElement('div');
            correctionText.textContent = `Indice ${correction.index} : "${correction.original}" corrigé en "${correction.corrected}"`;
            correctionsDiv.appendChild(correctionText);
          });
        } else {
          correctionsDiv.textContent = "Il n'y avait pas de faute.";
        }
      }
    );
  }
  
  // Vérifie si une correction est affichée dans le pop-up
  function checkIfCorrectionExists() {
    const correctionPopup = document.querySelector(
      'div.css-175oi2r.r-1kihuf0.r-14lw9ot.r-q36t59.r-13awgt0.r-5hg35f.r-u8s1d.r-13qz1uu'
    );
  
    if (!correctionPopup) {
      return { isActive: false, hasCorrection: false };
    }
  
    const correctionDiv = correctionPopup.querySelector(
      'div.css-175oi2r.r-1qfr5kh.r-1867qdf.r-10ptun7.r-1janqcz'
    );
  
    return {
      isActive: true,
      hasCorrection: !!correctionDiv, // true si la div existe, false sinon
    };
  }
  
  // Fonction pour mettre en évidence les éléments et récupérer les indices des mots à corriger
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
  
  // Fonction pour récupérer les mots corrigés
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
  
    // Ajuster les indices pour corriger le décalage
    const corrections = indices.map((index) => {
      const adjustedIndex = index - 1; // Ajustement ici
      return {
        index: index,
        original: originalWords[adjustedIndex] || '',
        corrected: correctedWords[adjustedIndex] || '',
      };
    });
  
    return { correctedWords: corrections };
  }
  