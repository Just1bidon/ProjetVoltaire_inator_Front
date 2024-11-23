// Exécuter la fonction dès le chargement de la page
(function() {
    var result = highlightElements();
    console.log('Analyse terminée :', result);
  
    // Afficher les résultats dans un popup de notification (facultatif)
    alert('Phrase : ' + result.sentence + '\nMots potentiellement fautifs : ' + result.potentialErrorWords.join(', '));
  })();
  