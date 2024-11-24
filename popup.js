document.addEventListener("DOMContentLoaded", function () {
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
        const correctionsDiv = document.getElementById("corrections");

        if (!result || !result.isActive) {
          // Pop-up inactif
          correctionsDiv.textContent = "Le pop-up de correction n'est pas actif.";
          processHighlighting(tabs, false); // Exécuter le surlignage même si le pop-up n'est pas actif
        } else if (result.hasCorrection) {
          // Une correction est affichée
          correctionsDiv.textContent = "Une correction a été détectée.";
          processHighlighting(tabs, true);
        } else {
          // Pop-up actif mais aucune correction n’est affichée
          correctionsDiv.textContent = "Il n'y avait pas de faute.";
          sendPhraseToAPI(result.originalPhrase, 0, null, null); // Aucune faute détectée
        }
      }
    );
  });
});

// --------------------------------------------------------------------------------------------------------------------------------------------

function processHighlighting(tabs, isCorrectionActive = false) {
  // Mise en évidence des éléments
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      func: highlightElements, // Fonction exécutée dans la page
    },
    function (highlightResults) {
      const correctionsDiv = document.getElementById("corrections");

      if (highlightResults && highlightResults[0] && highlightResults[0].result) {
        const data = highlightResults[0].result;

        // Afficher le nombre total d'éléments mis en évidence
        document.getElementById("result").textContent =
          "Nombre total d'éléments mis en évidence : " + data.totalOccurrences;

        // Afficher les indices dans le popup
        document.getElementById("errors").textContent =
          data.potentialErrorIndices && data.potentialErrorIndices.length > 0
            ? "Indices concernés : " + data.potentialErrorIndices.join(", ")
            : "Aucun indice concerné.";

        // Afficher les mots dans le popup
        document.getElementById("words").textContent =
          data.potentialErrorWords && data.potentialErrorWords.length > 0
            ? "Mot(s) à corriger : " + data.potentialErrorWords.join(", ")
            : "Aucun mot concerné.";

        // Récupérer les mots corrigés si le pop-up est actif
        if (isCorrectionActive && data.potentialErrorIndices.length > 0) {
          fetchCorrectedWordsFromIndices(
            data.potentialErrorIndices,
            tabs,
            data.potentialErrorWords
          );
        }
      }
    }
  );
}

// --------------------------------------------------------------------------------------------------------------------------------------------

function fetchCorrectedWordsFromIndices(indices, tabs, potentialErrorWords) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      func: fetchCorrectedWords,
      args: [indices],
    },
    function (correctionResults) {
      const correctedData =
        correctionResults && correctionResults[0] && correctionResults[0].result;
      const correctionsDiv = document.getElementById("corrections");
      const debugDiv = document.getElementById("debug-info");

      if (correctedData) {
        correctionsDiv.innerHTML = "";
        debugDiv.innerHTML = ""; // Réinitialiser le contenu du débogage

        // Afficher les mots corrigés et les phrases
        correctedData.correctedWords.forEach((correctedWord, idx) => {
          const correctionText = document.createElement("div");
          correctionText.textContent = `Mot corrigé ${idx + 1}: "${correctedWord}"`;
          correctionsDiv.appendChild(correctionText);
        });

        // Ajouter les phrases complètes pour vérification
        const originalPhraseDiv = document.createElement("div");
        originalPhraseDiv.textContent = `Phrase originale : "${correctedData.originalPhrase}"`;
        debugDiv.appendChild(originalPhraseDiv);

        const correctedPhraseDiv = document.createElement("div");
        correctedPhraseDiv.textContent = `Phrase corrigée : "${correctedData.correctedPhrase}"`;
        debugDiv.appendChild(correctedPhraseDiv);

        // Préparer les mots corrigés à envoyer
        const motsCorriges = correctedData.correctedWordsAtIndices.join(", ");

        // Ajouter des logs pour vérifier les correspondances
        console.log("Indices des mots fautifs :", indices);
        console.log("Mots fautifs :", potentialErrorWords);
        console.log("Mots corrigés correspondants :", motsCorriges);

        // Envoyer les données à l'API
        sendPhraseToAPI(
          correctedData.originalPhrase,
          1, // faute = 1 car il y a une correction
          potentialErrorWords.join(", "), // mots incorrects
          motsCorriges // mots corrigés ou null si vide
        );
      }
    }
  );
}

// --------------------------------------------------------------------------------------------------------------------------------------------

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

  // Récupérer la phrase originale
  const parentDivs = document.querySelectorAll(
    'div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu'
  );

  const originalWords = [];
  parentDivs.forEach((parent) => {
    const childElements = parent.querySelectorAll(".css-146c3p1.r-184en5c");
    childElements.forEach((el) => {
      originalWords.push(el.textContent.trim());
    });
  });

  return {
    isActive: true,
    hasCorrection: !!correctionDiv, // true si la div existe, false sinon
    originalPhrase: originalWords.join(" "),
  };
}

// --------------------------------------------------------------------------------------------------------------------------------------------

function highlightElements() {
  const parentDivs = document.querySelectorAll(
    'div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu'
  );

  let totalOccurrences = 0;
  const elementsInOrder = [];
  const highlightMarkers = [];

  parentDivs.forEach((parent) => {
    const childElements = parent.querySelectorAll(".css-146c3p1");

    childElements.forEach((el) => {
      const textContent = el.textContent.trim();
      const isWordElement = el.classList.contains("r-184en5c");
      const isHighlightMarker =
        el.classList.contains("r-lrvibr") && !isWordElement;

      elementsInOrder.push({
        text: textContent,
        element: el,
        isWord: isWordElement,
        isHighlightMarker,
      });

      if (isHighlightMarker) {
        totalOccurrences++;
        el.style.backgroundColor = "yellow";
        highlightMarkers.push(elementsInOrder.length - 1);
      }
    });
  });

  const potentialErrorIndices = [];

  if (highlightMarkers.length === 2) {
    const startIndex = highlightMarkers[0];
    const endIndex = highlightMarkers[1];
    for (let i = startIndex + 1; i < endIndex; i++) {
      potentialErrorIndices.push(i);
    }
  } else if (highlightMarkers.length === 1) {
    const markerIndex = highlightMarkers[0];
    const totalElements = elementsInOrder.length;

    if (markerIndex <= Math.floor(totalElements / 2)) {
      for (let i = 0; i < markerIndex; i++) {
        potentialErrorIndices.push(i);
      }
    } else {
      for (let i = markerIndex + 1; i < totalElements; i++) {
        potentialErrorIndices.push(i);
      }
    }
  }

  const potentialErrorWords = [];
  potentialErrorIndices.forEach((index) => {
    const item = elementsInOrder[index];
    if (item && item.isWord) {
      item.element.style.backgroundColor = "red";
      potentialErrorWords.push(item.text);
    }
  });

  const originalPhrase = elementsInOrder.map((item) => item.text).join(" ");

  return {
    totalOccurrences,
    potentialErrorIndices,
    potentialErrorWords,
    originalPhrase,
  };
}

// --------------------------------------------------------------------------------------------------------------------------------------------

function fetchCorrectedWords(indices) {
  const correctionPopup = document.querySelector(
    'div.css-175oi2r.r-1kihuf0.r-14lw9ot.r-q36t59.r-13awgt0.r-5hg35f.r-u8s1d.r-13qz1uu'
  );

  if (!correctionPopup) {
    return {
      correctedWords: [],
      originalPhrase: "",
      correctedPhrase: "",
      correctedWordsAtIndices: [],
    };
  }

  const correctedPhraseDiv = correctionPopup.querySelector(
    'div.css-175oi2r.r-obd0qt.r-18u37iz.r-1w6e6rj.r-bztko3'
  );

  if (!correctedPhraseDiv) {
    return {
      correctedWords: [],
      originalPhrase: "",
      correctedPhrase: "",
      correctedWordsAtIndices: [],
    };
  }

  const correctedElements = Array.from(
    correctedPhraseDiv.querySelectorAll(
      'div[style*="font-size: 16px"][style*="font-family: Montserrat-Regular"][style*="color: rgb(22, 27, 39);"]'
    )
  );

  const correctedWords = correctedElements.map((el) => el.textContent.trim());

  // Récupérer les mots corrigés aux mêmes positions que les mots fautifs
  const correctedWordsAtIndices = [];
  indices.forEach((index) => {
    // Vérifier si l'indice est valide
    if (index >= 0 && index < correctedWords.length) {
      correctedWordsAtIndices.push(correctedWords[index]);
    } else {
      correctedWordsAtIndices.push("Non trouvé");
    }
  });

  // Récupérer la phrase originale
  const parentDivs = document.querySelectorAll(
    'div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu'
  );

  const originalWords = [];
  parentDivs.forEach((parent) => {
    const childElements = parent.querySelectorAll(".css-146c3p1.r-184en5c");
    childElements.forEach((el) => {
      originalWords.push(el.textContent.trim());
    });
  });

  return {
    correctedWords: correctedWords,
    originalPhrase: originalWords.join(" "),
    correctedPhrase: correctedWords.join(" "),
    correctedWordsAtIndices: correctedWordsAtIndices,
  };
}


// --------------------------------------------------------------------------------------------------------------------------------------------

function sendPhraseToAPI(originalPhrase, faute = 0, mot_faux = null, mot_corrige = null) {
  if (!originalPhrase || originalPhrase.trim() === "") {
    console.error("Phrase originale vide ou invalide, requête annulée.");
    return;
  }
  const apiURL = "http://46.202.131.91:8000/phrases";

  const requestBody = {
    phrase: originalPhrase,
    faute: faute,
    mot_faux: mot_faux,
    mot_corrige: mot_corrige,
  };

  console.log("Données envoyées :", requestBody);

  fetch(apiURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la requête à l'API : " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Réponse de l'API :", data);
    })
    .catch((error) => {
      console.error("Erreur lors de la requête :", error);
    });
}
