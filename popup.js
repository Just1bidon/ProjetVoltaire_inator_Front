document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: checkIfCorrectionExists,
      },
      function (results) {
        const result = results && results[0] && results[0].result;
        const correctionsDiv = document.getElementById("corrections");

        if (result && result.originalPhrase) {
          // Vérifier si la phrase existe déjà dans la base
          checkPhraseInDatabase(result.originalPhrase);
        }

        if (!result || !result.isActive) {
          correctionsDiv.textContent = "Le pop-up de correction n'est pas actif.";
          processHighlighting(tabs, false);
        } else if (result.hasCorrection) {
          correctionsDiv.textContent = "Une correction a été détectée.";
          processHighlighting(tabs, true);
        } else {
          correctionsDiv.textContent = "Il n'y avait pas de faute.";
          sendPhraseToAPI(result.originalPhrase, 0, null, null);
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
        // document.getElementById("result").textContent =
        //   "Nombre total d'éléments mis en évidence : " + data.totalOccurrences;

        // Afficher les indices dans le popup
        // document.getElementById("errors").textContent =
        //   data.potentialErrorIndices && data.potentialErrorIndices.length > 0
        //     ? "Indices concernés : " + data.potentialErrorIndices.join(", ")
        //     : "Aucun indice concerné.";

        // Afficher les mots dans le popup
        // document.getElementById("words").textContent =
        //   data.potentialErrorWords && data.potentialErrorWords.length > 0
        //     ? "Mot(s) à corriger : " + data.potentialErrorWords.join(", ")
        //     : "Aucun mot concerné.";

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
        // correctedData.correctedWords.forEach((correctedWord, idx) => {
        //   const correctionText = document.createElement("div");
        //   correctionText.textContent = `Mot corrigé ${idx + 1}: "${correctedWord}"`;
        //   correctionsDiv.appendChild(correctionText);
        // });

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

  const correctionDiv = correctionPopup
    ? correctionPopup.querySelector(
        'div.css-175oi2r.r-1qfr5kh.r-1867qdf.r-10ptun7.r-1janqcz'
      )
    : null;

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
    isActive: !!correctionPopup,
    hasCorrection: !!correctionDiv,
    originalPhrase: originalWords.join(" "),
  };
}


// --------------------------------------------------------------------------------------------------------------------------------------------

function highlightElements(knownStatus = null) {
  const parentDivs = document.querySelectorAll(
    'div.css-175oi2r.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-1peese0.r-1wzrnnt.r-3pj75a.r-13qz1uu'
  );

  let totalOccurrences = 0;
  const elementsInOrder = [];
  const highlightMarkers = [];

  // Déterminer la couleur en fonction du statut connu
  let highlightColor = "rgba(255, 255, 0, 0.20)"; // Yellow with 0.5 opacity (default)

  if (knownStatus !== null) {
    if (knownStatus === 1) {
      highlightColor = "rgba(255, 0, 0, 0.20)"; // Red with 0.5 opacity
    } else if (knownStatus === 0) {
      highlightColor = "rgba(0, 255, 0, 0.20)"; // Green with 0.5 opacity
    }
  }

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
        el.style.backgroundColor = highlightColor;
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
      item.element.style.backgroundColor = highlightColor; // Utiliser la même couleur pour les mots
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

  // Fonction pour formater la phrase ou le texte
  function formatText(text) {
    if (!text) return null;
    return text
      .replace(/\s+/g, " ") // Remplace les espaces multiples par un seul espace
      .replace(/\s([.,!?;:])/g, "$1") // Supprime les espaces avant la ponctuation
      .replace(/([.,!?;:])\s/g, "$1 ") // Assure un espace après la ponctuation
      .trim(); // Supprime les espaces au début et à la fin
  }

  // Nettoyer la phrase originale, mot_faux et mot_corrige
  const formattedPhrase = formatText(originalPhrase);
  const cleanedMotFaux = formatText(mot_faux);
  const cleanedMotCorrige = formatText(mot_corrige);

  // Vérifier si la phrase existe déjà dans la base avant de l'ajouter
  const apiURL = `http://46.202.131.91:8000/phrases?phrase=${encodeURIComponent(formattedPhrase)}`;

  fetch(apiURL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur lors de la requête à l'API : ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.length > 0) {
        // La phrase existe déjà dans la base, ne pas l'ajouter
        console.log("Phrase déjà existante dans la base :", data[0]);
        handleExistingPhrase(data[0]); // Gérer la phrase existante
      } else {
        // La phrase n'existe pas, l'ajouter
        const requestBody = {
          phrase: formattedPhrase,
          faute: faute,
          mot_faux: cleanedMotFaux,
          mot_corrige: cleanedMotCorrige,
        };

        console.log("Ajout de la phrase :", requestBody);

        fetch("http://46.202.131.91:8000/phrases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                "Erreur lors de la requête à l'API : " + response.status
              );
            }
            return response.json();
          })
          .then((data) => {
            console.log("Réponse de l'API après ajout :", data);
          })
          .catch((error) => {
            console.error("Erreur lors de la requête POST :", error);
          });
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la requête GET :", error);
    });
}



// --------------------------------------------------------------------------------------------------------------------------------------------


function checkPhraseInDatabase(phrase) {
  if (!phrase || phrase.trim() === "") {
    console.error("Phrase invalide ou vide.");
    return;
  }

  // Fonction pour nettoyer la phrase avant la requête
  function cleanPhraseForQuery(text) {
    return text
      .replace(/\s+/g, " ") // Remplace les espaces multiples par un seul espace
      .replace(/\s([.,!?;:])/g, "$1") // Supprime les espaces avant la ponctuation
      .replace(/([.,!?;:])\s/g, "$1 ") // Assure un espace après la ponctuation
      .trim(); // Supprime les espaces au début et à la fin
  }

  // Nettoyer la phrase
  const cleanedPhrase = cleanPhraseForQuery(phrase);

  // URL de l'API avec paramètre de recherche
  const apiURL = `http://46.202.131.91:8000/phrases?phrase=${encodeURIComponent(cleanedPhrase)}`;

  console.log("Recherche de la phrase dans la base :", cleanedPhrase);

  // Requête GET à l'API
  fetch(apiURL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erreur lors de la requête à l'API : ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.length > 0) {
        // La phrase existe dans la base
        console.log("Phrase trouvée dans la base :", data);
        handleExistingPhrase(data[0]); // Appel à une fonction pour gérer les résultats
      } else {
        // La phrase n'existe pas
        console.log("Phrase non trouvée dans la base.");
        handleNonExistingPhrase(cleanedPhrase); // Appel à une fonction pour gérer ce cas
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la requête GET :", error);
    });
}



// --------------------------------------------------------------------------------------------------------------------------------------------

function handleExistingPhrase(data) {
  console.log("Données de la phrase trouvée :", data);

  const correctionsDiv = document.getElementById("corrections");

  if (data.faute == 1) {
    correctionsDiv.textContent = "Cette phrase CONTIENT une faute connue.";
    // Rappeler highlightElements avec le statut "faute"
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: highlightElements,
        args: [1] // 1 pour indiquer une faute
      });
    });
  } else {
    correctionsDiv.textContent = "Cette phrase ne contient PAS DE FAUTE.";
    // Rappeler highlightElements avec le statut "pas de faute"
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: highlightElements,
        args: [0] // 0 pour indiquer pas de faute
      });
    });
  }

  correctionsDiv.textContent += `
    Phrase déjà présente dans la base avec ID ${data.id}.
    Faute : ${data.faute ? "Oui" : "Non"}
    Mot(s) fautif(s) : ${data.mot_faux || "Aucun"}
    Correction(s) : ${data.mot_corrige || "Aucune"}
  `;
}


// --------------------------------------------------------------------------------------------------------------------------------------------

function handleNonExistingPhrase(phrase) {
  console.log("Phrase non trouvée. Prête à être ajoutée si nécessaire :", phrase);

  const correctionsDiv = document.getElementById("corrections");
  correctionsDiv.textContent = "Phrase non trouvée dans la base. Vous pouvez l'ajouter.";

  // Rappeler highlightElements sans paramètre pour utiliser la couleur par défaut
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: highlightElements,
      args: [null] // null pour utiliser la couleur par défaut (jaune)
    });
  });
}