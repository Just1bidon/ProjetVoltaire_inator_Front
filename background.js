chrome.commands.onCommand.addListener((command) => {
    if (command === "open-extension") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            const url = activeTab.url;
            
            // Vérifiez si l'URL correspond au site cible
            if (url.startsWith("https://apprentissage.appli3.projet-voltaire.fr/entrainement")) {
                chrome.action.openPopup();
            } else {
                console.log("Cette extension n'est active que sur le site Voltaire.");
            }
        });
    }
});
